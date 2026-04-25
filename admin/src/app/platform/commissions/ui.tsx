'use client';

import { useEffect, useMemo, useState } from 'react';

type Context = 'agent_self' | 'host_under_agent' | 'sub_agent_under_agent';

type Rule = {
  id: string;
  service_id: string;
  context: Context;
  app_pct: number;
  worker_pct: number;
  upline_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const contexts: Context[] = ['agent_self', 'host_under_agent', 'sub_agent_under_agent'];

function pct(v: number) {
  const n = Number(v);
  if (Number.isNaN(n)) return '0%';
  return `${Math.round(n * 100)}%`;
}

export default function CommissionsClient() {
  const [items, setItems] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState('delivery');
  const [context, setContext] = useState<Context>('agent_self');

  // create form
  const [appPct, setAppPct] = useState('0.3');
  const [workerPct, setWorkerPct] = useState('0.7');
  const [uplinePct, setUplinePct] = useState('0');

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (serviceId.trim()) params.set('service_id', serviceId.trim());
      const res = await fetch(`/api/platform/commissions?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Erreur chargement');
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRule() {
    setError(null);
    try {
      const res = await fetch('/api/platform/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId.trim(),
          context,
          app_pct: Number(appPct),
          worker_pct: Number(workerPct),
          upline_pct: Number(uplinePct),
          is_active: true,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Création échouée');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Création échouée');
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette règle ?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/platform/commissions/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Suppression échouée');
      await refresh();
    } catch (e: any) {
      setError(e?.message || 'Suppression échouée');
    }
  }

  const byContext = useMemo(() => {
    const map = new Map<Context, Rule[]>();
    for (const c of contexts) map.set(c, []);
    for (const r of items) {
      const arr = map.get(r.context as Context) || [];
      arr.push(r);
      map.set(r.context as Context, arr);
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Commissions</h1>
          <p className="text-sm text-zinc-500 mt-1">Configuration des parts App / Worker / Upline par service.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            placeholder="service_id (delivery, taxi, ...)"
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50"
          />
          <button
            onClick={refresh}
            className="bg-white text-black text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Recharger
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">{error}</div>
      )}

      <div className="glass-card rounded-2xl p-6 border border-zinc-800/50">
        <h2 className="text-zinc-100 font-semibold">Créer une règle</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <select
            value={context}
            onChange={(e) => setContext(e.target.value as Context)}
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none"
          >
            {contexts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            value={appPct}
            onChange={(e) => setAppPct(e.target.value)}
            placeholder="app_pct (0-1)"
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none"
          />
          <input
            value={workerPct}
            onChange={(e) => setWorkerPct(e.target.value)}
            placeholder="worker_pct (0-1)"
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none"
          />
          <input
            value={uplinePct}
            onChange={(e) => setUplinePct(e.target.value)}
            placeholder="upline_pct (0-1)"
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={createRule}
            className="bg-white text-black text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Créer
          </button>
        </div>

        <p className="text-[11px] text-zinc-600 mt-3">
          Note: le backend exige que app_pct + worker_pct + upline_pct = 1.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card h-40 rounded-2xl animate-pulse bg-zinc-900/50" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {contexts.map((ctx) => {
            const list = byContext.get(ctx) || [];
            return (
              <div key={ctx} className="glass-card rounded-2xl p-6 border border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-zinc-100 font-semibold">{ctx}</h3>
                  <span className="text-xs text-zinc-500">{list.length} règle(s)</span>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-zinc-600 mt-3">Aucune règle pour ce contexte.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {list.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                        <div>
                          <p className="text-sm text-zinc-200 font-mono">{r.service_id}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            App {pct(r.app_pct)} • Worker {pct(r.worker_pct)} • Upline {pct(r.upline_pct)}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(r.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-zinc-800/70 text-zinc-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
