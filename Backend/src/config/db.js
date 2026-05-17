/**
 * COUCHE DB POSTGRES
 * Fournit une API minimale compatible avec l'usage actuel: dbAdmin.from(...)
 */

import { initDatabase, appDataSource } from '../db/dataSource.js';

class DbQuery {
  constructor(table) {
    this.table = table;
    this._select = '*';
    this._countHead = false;
    this._filters = [];
    this._or = null;
    this._order = null;
    this._limit = null;
    this._offset = null;
    this._groupBy = [];
    this._headOnly = false;
  }

  // Make the query "thenable" so `await dbAdmin.from(...).insert(...)` executes.
  // This keeps compatibility with existing code that does not chain `.select()`.
  then(resolve, reject) {
    const run = async () => {
      if (this._pendingWrite) return this._executeWrite({ returning: false, single: false });
      return this._runSelect({ single: false });
    };

    return run().then(resolve, reject);
  }

  select(columns = '*', options = {}) {
    this._select = columns;
    if (options?.head) this._headOnly = true;
    if (options?.count) this._countHead = true;
    return this;
  }

  eq(column, value) {
    this._filters.push({ op: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this._filters.push({ op: 'neq', column, value });
    return this;
  }

  gte(column, value) {
    this._filters.push({ op: 'gte', column, value });
    return this;
  }

  lte(column, value) {
    this._filters.push({ op: 'lte', column, value });
    return this;
  }

  lt(column, value) {
    this._filters.push({ op: 'lt', column, value });
    return this;
  }

  ilike(column, pattern) {
    this._filters.push({ op: 'ilike', column, value: pattern });
    return this;
  }

  not(column, operator, value) {
    this._filters.push({ op: 'not', column, operator, value });
    return this;
  }

  // Minimal Supabase compatibility used by the codebase.
  // Example used: .or('is_used.is.null,is_used.eq.false')
  in(column, values) { this._filters.push({ op: 'in', column, value: values }); return this; }

  or(expression) {
    this._or = String(expression || '').trim();
    return this;
  }

  order(column, { ascending = true } = {}) {
    this._order = { column, ascending };
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  range(from, to) {
    this._offset = from;
    this._limit = (to - from) + 1;
    return this;
  }

  group(columns) {
    // Accepte une string: "a, b". On normalise.
    const cols = String(columns)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    this._groupBy.push(...cols);
    return this;
  }

  async _ensureDb() {
    await initDatabase();
  }

  _applyFilters(qb, alias = 't') {
    let idx = 0;
    for (const f of this._filters) {
      const param = `p${idx++}`;

      const colRef = alias ? `${alias}.${f.column}` : `${f.column}`;

      if (f.op === 'eq') {
        qb.andWhere(`${colRef} = :${param}`, { [param]: f.value });
      } else if (f.op === 'neq') {
        qb.andWhere(`${colRef} <> :${param}`, { [param]: f.value });
      } else if (f.op === 'gte') {
        qb.andWhere(`${colRef} >= :${param}`, { [param]: f.value });
      } else if (f.op === 'lte') {
        qb.andWhere(`${colRef} <= :${param}`, { [param]: f.value });
      } else if (f.op === 'lt') {
        qb.andWhere(`${colRef} < :${param}`, { [param]: f.value });
      } else if (f.op === 'in') {
        if (Array.isArray(f.value) && f.value.length > 0) {
          qb.andWhere(`${colRef} IN (:...${param})`, { [param]: f.value });
        } else {
          qb.andWhere('1=0');
        }
      } else if (f.op === 'ilike') {
        qb.andWhere(`${colRef} ILIKE :${param}`, { [param]: f.value });
      } else if (f.op === 'not') {
        if (f.operator === 'is' && f.value === null) {
          qb.andWhere(`${colRef} IS NOT NULL`);
        } else {
          qb.andWhere(`NOT (${colRef} = :${param})`, { [param]: f.value });
        }
      }
    }

    if (this._or) {
      // Support a small subset of Supabase OR syntax: comma-separated predicates.
      // We only implement what we currently use in the app.
      const parts = this._or
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const orClauses = [];
      for (const p of parts) {
        // format: <col>.<op>.<value>
        const seg = p.split('.').map((s) => s.trim());
        if (seg.length < 2) continue;
        const col = seg[0];
        const op = seg[1];
        const value = seg.slice(2).join('.');

        if (op === 'is' && value === 'null') {
          orClauses.push(`${alias ? `${alias}.` : ''}${col} IS NULL`);
          continue;
        }

        if (op === 'eq' && (value === 'false' || value === 'true')) {
          orClauses.push(`${alias ? `${alias}.` : ''}${col} = ${value}`);
          continue;
        }

        if (op === 'eq' && value !== 'false' && value !== 'true') {
          const orParam = `or${idx++}`;
          orClauses.push(`${alias ? `${alias}.` : ''}${col} = :${orParam}`);
          qb.setParameter(orParam, value);
          continue;
        }

        if (op === 'ilike') {
          const orParam = `or${idx++}`;
          orClauses.push(`${alias ? `${alias}.` : ''}${col} ILIKE :${orParam}`);
          qb.setParameter(orParam, value);
          continue;
        }
      }

      if (orClauses.length > 0) {
        qb.andWhere(`(${orClauses.join(' OR ')})`);
      }
    }
  }

  async _runSelect({ single = false } = {}) {
    await this._ensureDb();
    try {
      const qb = appDataSource.createQueryBuilder();

      // Colonnes
      if (this._select === '*' || !this._select) {
        qb.select('*');
      } else {
        // Support minimal: "col1, col2" ou "col, count(*)"
        const rawCols = String(this._select)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

        const selects = rawCols.map((c) => {
          if (c.toLowerCase().includes('count(')) return c;
          return `t.${c} AS ${c}`;
        });
        qb.select(selects);
      }

      qb.from(this.table, 't');
      this._applyFilters(qb, 't');

      if (this._groupBy.length > 0) {
        for (const col of this._groupBy) {
          qb.addGroupBy(`t.${col}`);
        }
      }

      if (this._order) {
        qb.orderBy(`t.${this._order.column}`, this._order.ascending ? 'ASC' : 'DESC');
      }

      if (this._offset !== null && this._offset !== undefined) qb.skip(this._offset);
      if (this._limit !== null && this._limit !== undefined) qb.take(this._limit);

      if (this._countHead) {
        const count = await qb.getCount();
        return { data: this._headOnly ? null : [], error: null, count };
      }

      const data = await qb.getRawMany();
      if (single) {
        if (!data || data.length === 0) {
          return { data: null, error: { code: 'PGRST116', message: 'No rows returned' } };
        }
        return { data: data[0], error: null };
      }

      return { data, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  async single() {
    return this._runSelect({ single: true });
  }

  insert(values) {
    this._pendingWrite = { type: 'insert', values };
    return this;
  }

  update(values) {
    this._pendingWrite = { type: 'update', values };
    return this;
  }

  delete() {
    this._pendingWrite = { type: 'delete' };
    return this;
  }

  upsert(values, options = {}) {
    this._pendingWrite = { type: 'upsert', values, options };
    return this;
  }

  async _executeWrite({ returning = false, single = false } = {}) {
    await this._ensureDb();
    try {
      const w = this._pendingWrite;
      if (!w) {
        return { data: null, error: { message: 'No write operation queued' } };
      }

      if (w.type === 'insert') {
        const qb = appDataSource.createQueryBuilder().insert().into(this.table).values(w.values);
        if (returning) qb.returning('*');
        const result = await qb.execute();
        const rows = result.raw || [];
        const data = returning ? rows : null;
        if (single && Array.isArray(data)) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      }

      if (w.type === 'update') {
        const qb = appDataSource.createQueryBuilder().update(this.table).set(w.values);
        // where
        qb.where('1=1');
        this._applyFilters(qb, null);
        if (returning) qb.returning('*');
        const result = await qb.execute();
        const rows = result.raw || [];
        const data = returning ? rows : null;
        if (single && Array.isArray(data)) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      }

      if (w.type === 'delete') {
        const qb = appDataSource.createQueryBuilder().delete().from(this.table);
        qb.where('1=1');
        this._applyFilters(qb, null);
        const result = await qb.execute();
        return { data: returning ? result.raw : null, error: null };
      }

      if (w.type === 'upsert') {
        const qb = appDataSource.createQueryBuilder()
          .insert()
          .into(this.table)
          .values(w.values)
          .orUpdate(
            Object.keys(w.values).filter(k => k !== 'key' && k !== 'id'), 
            w.options?.onConflict || ['key']
          );
        
        if (returning) qb.returning('*');
        const result = await qb.execute();
        const rows = result.raw || [];
        const data = returning ? rows : null;
        if (single && Array.isArray(data)) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      }
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  }

  async selectAndReturnSingle() {
    return this._executeWrite({ returning: true, single: true });
  }

  async selectAndReturnMany() {
    return this._executeWrite({ returning: true, single: false });
  }
}

function wrapQuery(table) {
  const q = new DbQuery(table);

  // Petite compat: dans le code existant, on fait souvent:
  // await dbAdmin.from('x').insert({...}).select().single();
  // Ici, on interprète ".select().single()" après une écriture comme "returning".
  const origSelect = q.select.bind(q);
  q.select = (columns = '*', options = {}) => {
    origSelect(columns, options);
    return q;
  };

  const origSingle = q.single.bind(q);
  q.single = async () => {
    if (q._pendingWrite) return q.selectAndReturnSingle();
    return origSingle();
  };

  const origRunSelect = q._runSelect.bind(q);
  q._runSelect = async (...args) => {
    if (q._pendingWrite) return q.selectAndReturnMany();
    return origRunSelect(...args);
  };

  return q;
}

function createDbClient() {
  return {
    from: (table) => wrapQuery(table),
    auth: {
      // Auth stub (JWT local)
      getUser: async () => ({ data: { user: null }, error: { message: 'Auth removed' } }),
    },
  };
}

export const dbAdmin = createDbClient();
export const dbClient = createDbClient();
export const getDbClient = () => createDbClient();

