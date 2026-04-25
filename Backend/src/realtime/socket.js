import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../utils/logger.js';
import SecurityService from '../services/securityService.js';
import { dbAdmin } from '../config/db.js';
import { redisManager } from '../config/redis.js';
import { appDataSource } from '../db/dataSource.js';
import { setIO } from './io.js';

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

async function authenticateSocket(socket) {
  const authHeader = socket.handshake?.headers?.authorization;
  const tokenFromHeader = authHeader && String(authHeader).startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = tokenFromHeader || socket.handshake?.auth?.token || socket.handshake?.query?.token;

  if (!token) {
    const err = new Error('MISSING_TOKEN');
    err.data = { code: 'MISSING_TOKEN' };
    throw err;
  }

  const decoded = SecurityService.verifyToken(String(token));

  const { data: user, error } = await dbAdmin
    .from('users')
    .select('*')
    .eq('id', decoded.userId)
    .eq('is_verified', true)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    const err = new Error('INVALID_USER');
    err.data = { code: 'INVALID_USER' };
    throw err;
  }

  return {
    user,
    tokenPayload: decoded,
  };
}

function roomKey({ service_id, city } = {}) {
  const sid = String(service_id || '').trim();
  const c = String(city || '').trim().toLowerCase();
  const cityPart = c ? `:city:${c}` : '';
  return `service:${sid}${cityPart}`;
}

function rideRoomKey(rideId) {
  return `ride:${String(rideId)}`;
}

async function canJoinRideRoom({ rideId, userId } = {}) {
  if (!rideId || !userId) return false;
  try {
    const [{ client_user_id, driver_user_id } = {}] = await appDataSource.query(
      `SELECT client_user_id, driver_user_id FROM public.taxi_rides WHERE id = $1 LIMIT 1`,
      [String(rideId)],
    );
    if (!client_user_id && !driver_user_id) return false;
    return String(client_user_id || '') === String(userId) || String(driver_user_id || '') === String(userId);
  } catch {
    return false;
  }
}

async function findActiveRideIdForDriver(driverUserId) {
  if (!driverUserId) return null;
  try {
    const [row] = await appDataSource.query(
      `SELECT id FROM public.taxi_rides
       WHERE driver_user_id = $1
         AND status IN ('assigned','en_route','started')
       ORDER BY updated_at DESC
       LIMIT 1`,
      [String(driverUserId)],
    );
    return row?.id ? String(row.id) : null;
  } catch {
    return null;
  }
}

async function upsertLiveLocation(payload) {
  const now = new Date().toISOString();

  const userId = String(payload.user_id);
  const serviceId = String(payload.service_id || '');
  const city = String(payload.city || '');

  const lat = Number(payload.lat);
  const lng = Number(payload.lng);

  const isVisible = Boolean(payload.is_visible);
  const isBusy = Boolean(payload.is_busy);

  const heading = payload.heading === undefined || payload.heading === null ? null : Number(payload.heading);
  const speed = payload.speed === undefined || payload.speed === null ? null : Number(payload.speed);
  const accuracy = payload.accuracy === undefined || payload.accuracy === null ? null : Number(payload.accuracy);

  // geography(Point, 4326)
  const pointWkt = `SRID=4326;POINT(${lng} ${lat})`;

  await appDataSource.query(
    `INSERT INTO public.live_locations (user_id, service_id, city, is_visible, is_busy, location, heading, speed, accuracy, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,ST_GeogFromText($6),$7,$8,$9,$10,$10)
     ON CONFLICT (user_id) DO UPDATE SET
       service_id = EXCLUDED.service_id,
       city = EXCLUDED.city,
       is_visible = EXCLUDED.is_visible,
       is_busy = EXCLUDED.is_busy,
       location = EXCLUDED.location,
       heading = EXCLUDED.heading,
       speed = EXCLUDED.speed,
       accuracy = EXCLUDED.accuracy,
       updated_at = EXCLUDED.updated_at`,
    [userId, serviceId, city, isVisible, isBusy, pointWkt, heading, speed, accuracy, now],
  );

  return now;
}

export async function initRealtimeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081'],
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Redis adapter (scale)
  try {
    if (redisManager?.isConnected && redisManager?.client) {
      const pubClient = redisManager.client;
      const subClient = redisManager.client.duplicate();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('✅ Socket.IO Redis adapter activé');
    } else {
      logger.warn('⚠️ Socket.IO sans Redis adapter (single instance)');
    }
  } catch (e) {
    logger.error('❌ Erreur init Socket.IO Redis adapter', { error: e?.message });
  }

  io.use(async (socket, next) => {
    try {
      const ctx = await authenticateSocket(socket);
      socket.data.user = ctx.user;
      socket.data.tokenPayload = ctx.tokenPayload;
      next();
    } catch (e) {
      next(e);
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.data?.user?.id || '');

    try {
      socket.join(`user:${userId}`);
    } catch {
      // ignore
    }

    socket.on('subscribe', async (raw, cb) => {
      try {
        const service_id = String(raw?.service_id || '').trim();
        const city = String(raw?.city || '').trim();
        if (!service_id) throw new Error('service_id requis');

        const key = roomKey({ service_id, city });
        await socket.join(key);

        cb?.({ success: true, room: key });
      } catch (e) {
        cb?.({ success: false, error: e?.message || 'Erreur subscribe' });
      }
    });

    socket.on('unsubscribe', async (raw, cb) => {
      try {
        const service_id = String(raw?.service_id || '').trim();
        const city = String(raw?.city || '').trim();
        if (!service_id) throw new Error('service_id requis');

        const key = roomKey({ service_id, city });
        await socket.leave(key);

        cb?.({ success: true, room: key });
      } catch (e) {
        cb?.({ success: false, error: e?.message || 'Erreur unsubscribe' });
      }
    });

    socket.on('taxi:ride:subscribe', async (raw, cb) => {
      try {
        const ride_id = String(raw?.ride_id || '').trim();
        if (!ride_id) throw new Error('ride_id requis');

        const ok = await canJoinRideRoom({ rideId: ride_id, userId });
        if (!ok) throw new Error('Accès refusé');

        const key = rideRoomKey(ride_id);
        await socket.join(key);
        cb?.({ success: true, room: key });
      } catch (e) {
        cb?.({ success: false, error: e?.message || 'Erreur subscribe ride' });
      }
    });

    socket.on('taxi:ride:unsubscribe', async (raw, cb) => {
      try {
        const ride_id = String(raw?.ride_id || '').trim();
        if (!ride_id) throw new Error('ride_id requis');

        const key = rideRoomKey(ride_id);
        await socket.leave(key);
        cb?.({ success: true, room: key });
      } catch (e) {
        cb?.({ success: false, error: e?.message || 'Erreur unsubscribe ride' });
      }
    });

    // Chauffeur -> serveur
    socket.on('location:update', async (raw, cb) => {
      try {
        const service_id = String(raw?.service_id || '').trim();
        const city = String(raw?.city || '').trim();
        const lat = Number(raw?.lat);
        const lng = Number(raw?.lng);

        if (!service_id) throw new Error('service_id requis');
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('lat/lng invalides');

        const is_visible = raw?.is_visible === undefined ? true : Boolean(raw?.is_visible);
        const is_busy = raw?.is_busy === undefined ? false : Boolean(raw?.is_busy);

        const payload = {
          user_id: userId,
          service_id,
          city,
          lat,
          lng,
          heading: raw?.heading,
          speed: raw?.speed,
          accuracy: raw?.accuracy,
          is_visible,
          is_busy,
        };

        const updated_at = await upsertLiveLocation(payload);

        const event = {
          ...payload,
          updated_at,
        };

        const key = roomKey({ service_id, city });
        io.to(key).emit('location:update', event);

        try {
          if (service_id === 'taxi') {
            const activeRideId = await findActiveRideIdForDriver(userId);
            if (activeRideId) {
              const rideKey = rideRoomKey(activeRideId);
              io.to(rideKey).emit('taxi:driver:location', {
                ride_id: activeRideId,
                driver_user_id: userId,
                lat,
                lng,
                heading: raw?.heading ?? null,
                speed: raw?.speed ?? null,
                accuracy: raw?.accuracy ?? null,
                updated_at,
              });
            }
          }
        } catch {
          // ignore
        }

        cb?.({ success: true, updated_at });
      } catch (e) {
        cb?.({ success: false, error: e?.message || 'Erreur update' });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId, reason });
    });

    socket.on('error', (err) => {
      logger.warn('Socket error', { userId, err: safeJson(err) });
    });
  });

  logger.info('✅ Socket.IO realtime initialisé');
  try {
    setIO(io);
  } catch {
    // ignore
  }
  return io;
}
