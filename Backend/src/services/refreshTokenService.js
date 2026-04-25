import crypto from 'crypto';
import { appDataSource, initDatabase } from '../db/dataSource.js';
import { RefreshToken } from '../db/entities/RefreshToken.js';

const PEPPER = process.env.REFRESH_TOKEN_PEPPER || '';
const DEFAULT_REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);

function hashToken(token) {
  return crypto.createHash('sha256').update(`${token}${PEPPER}`).digest('hex');
}

function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export const refreshTokenService = {
  hashToken,

  async issueToken({ userId, ip, userAgent }) {
    await initDatabase();

    const token = generateOpaqueToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + DEFAULT_REFRESH_DAYS * 24 * 60 * 60 * 1000);

    const repo = appDataSource.getRepository(RefreshToken);

    const inserted = await repo
      .createQueryBuilder()
      .insert()
      .into(RefreshToken)
      .values({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_by_ip: ip || null,
        user_agent: userAgent || null,
      })
      .returning('*')
      .execute();

    const row = inserted.raw?.[0] || null;

    return {
      token,
      record: row,
      expiresAt,
    };
  },

  async rotateToken({ token, ip, userAgent }) {
    await initDatabase();

    const tokenHash = hashToken(token);
    const repo = appDataSource.getRepository(RefreshToken);

    // Lock-free minimal approach: fetch then update.
    const existing = await repo
      .createQueryBuilder('rt')
      .where('rt.token_hash = :tokenHash', { tokenHash })
      .getOne();

    if (!existing) {
      return { ok: false, reason: 'NOT_FOUND' };
    }

    if (existing.revoked_at) {
      // Possible reuse attempt.
      return { ok: false, reason: 'REVOKED' };
    }

    if (existing.expires_at && new Date(existing.expires_at) <= new Date()) {
      return { ok: false, reason: 'EXPIRED' };
    }

    const { token: newToken, record: newRecord } = await this.issueToken({
      userId: existing.user_id,
      ip,
      userAgent,
    });

    await repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({
        revoked_at: new Date(),
        replaced_by_token_id: newRecord?.id || null,
      })
      .where('id = :id', { id: existing.id })
      .execute();

    return {
      ok: true,
      userId: existing.user_id,
      newToken,
      newRecord,
    };
  },

  async revokeToken({ token }) {
    await initDatabase();

    const tokenHash = hashToken(token);
    const repo = appDataSource.getRepository(RefreshToken);

    await repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where('token_hash = :tokenHash', { tokenHash })
      .execute();

    return true;
  },

  async revokeAllForUser({ userId }) {
    await initDatabase();

    const repo = appDataSource.getRepository(RefreshToken);
    await repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revoked_at: new Date() })
      .where('user_id = :userId AND revoked_at IS NULL', { userId })
      .execute();

    return true;
  },
};
