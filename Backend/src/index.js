/**
 * MOSSOMBI BACKEND API - SERVEUR PRINCIPAL
 * Point d'entrée de l'API backend pour l'application Mossombi
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';

// Configuration des variables d'environnement
dotenv.config();

// Import des routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import notificationRoutes from './routes/notifications.js';
import sessionRoutes from './routes/sessions.js';
import whatsappRoutes from './routes/whatsapp.js';
import { auditMiddleware } from './middleware/auditMiddleware.js';
import { redisManager } from './config/redis.js';
import { auditLogService } from './services/auditLogService.js';
import { monitoringService } from './services/monitoringService.js';
import { alertService } from './services/alertService.js';
import profileRoutes from './routes/profile.js';
import walletRoutes from './routes/wallet.js';
import monitoringRoutes from './routes/monitoring.js';
import privacyRoutes from './routes/privacy.js';
import adminRoutes from './routes/admin.js';
import adminAdsRoutes from './routes/adminAds.js';
import adminAgenciesRoutes from './routes/adminAgencies.js';
import adminCommissionsRoutes from './routes/adminCommissions.js';
import adsRoutes from './routes/ads.js';
import agenciesRoutes from './routes/agencies.js';
import agencyServicesRoutes from './routes/agencyServices.js';
import agencyServicesEnhancedRoutes from './routes/agencyServices-enhanced.js';
import agencySalesRoutes from './routes/agencySales.js';
import storeRoutes from './routes/store.js';
import storeEnhancedRoutes from './routes/store-enhanced.js';
import liveLocationsRoutes from './routes/liveLocations.js';
import taxiRidesRoutes from './routes/taxiRides.js';
import aiRoutes from './routes/ai.js';
import deliveriesRoutes from './routes/deliveries.js';
import disputesRoutes from './routes/disputes.js';
import logisticsZonesRoutes from './routes/logistics-zones.js';

import { initRealtimeSocket } from './realtime/socket.js';

// Import des middlewares
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { appDataSource, initDatabase } from './db/dataSource.js';

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Caddy / reverse proxy (nécessaire pour req.ip, secure cookies, etc.)
app.set('trust proxy', 1);

// =====================================================
// 🛡️ MIDDLEWARES DE SÉCURITÉ
// =====================================================

// Helmet pour la sécurité des headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS pour les requêtes cross-origin (restreint aux origines configurées)
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8081')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origin (apps mobiles, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // En développement, on peut aussi autoriser localhost
    if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:/.test(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite par IP
  message: {
    error: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${API_VERSION}`, limiter);

// =====================================================
// 📊 MIDDLEWARE D'AUDIT GLOBAL
// =====================================================
app.use(auditMiddleware);

// =====================================================
// 🏥 ENDPOINT DE SANTÉ BASIQUE
// =====================================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =====================================================
// 🔧 MIDDLEWARES GÉNÉRAUX
// =====================================================

// Compression des réponses
app.use(compression());

// Logging des requêtes HTTP
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Parsing du body JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serving static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// =====================================================
// 📊 ROUTE DE SANTÉ (DOUBLON SUPPRIMÉ)
// =====================================================
// L'endpoint /health est déjà défini plus haut

// =====================================================
// 🛣️ ROUTES PRINCIPALES
// =====================================================

// Routes d'authentification
app.use(`/api/${API_VERSION}/auth`, authRoutes);

// Routes utilisateurs
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Routes notifications
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// Routes sessions
app.use(`/api/${API_VERSION}/sessions`, sessionRoutes);

// Routes WhatsApp
app.use(`/api/${API_VERSION}/whatsapp`, whatsappRoutes);

// Routes profil
app.use(`/api/${API_VERSION}/profile`, profileRoutes);
app.use(`/api/${API_VERSION}/profile/privacy`, privacyRoutes);
app.use(`/api/${API_VERSION}/wallet`, walletRoutes);
app.use(`/api/${API_VERSION}/monitoring`, monitoringRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/admin/ads`, adminAdsRoutes);
app.use(`/api/${API_VERSION}/admin/agencies`, adminAgenciesRoutes);
app.use(`/api/${API_VERSION}/admin/commissions`, adminCommissionsRoutes);
app.use(`/api/${API_VERSION}/ads`, adsRoutes);
app.use(`/api/${API_VERSION}/live-locations`, liveLocationsRoutes);
app.use(`/api/${API_VERSION}/agencies`, agenciesRoutes);
app.use(`/api/${API_VERSION}/agency-services`, agencyServicesRoutes);
app.use(`/api/${API_VERSION}/agency-services-enhanced`, agencyServicesEnhancedRoutes);
app.use(`/api/${API_VERSION}/agency-sales`, agencySalesRoutes);
app.use(`/api/${API_VERSION}/store`, storeRoutes);
app.use(`/api/${API_VERSION}/store-enhanced`, storeEnhancedRoutes);
app.use(`/api/${API_VERSION}/taxi`, taxiRidesRoutes);
app.use(`/api/${API_VERSION}/ai`, aiRoutes);
app.use(`/api/${API_VERSION}/deliveries`, deliveriesRoutes);
app.use(`/api/${API_VERSION}/disputes`, disputesRoutes);
app.use(`/api/${API_VERSION}/logistics-zones`, logisticsZonesRoutes);

// =====================================================
// 🚫 GESTION DES ERREURS
// =====================================================

// Route 404 pour les endpoints non trouvés
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Middleware de gestion d'erreurs global
app.use(errorHandler);

// =====================================================
// 🚀 DÉMARRAGE DU SERVEUR
// =====================================================
// =====================================================
// 🚀 INITIALISATION DES SERVICES
// =====================================================

async function initializeServices() {
  try {
    logger.info('🔧 Initialisation des services...');

    // 0. Initialiser la base de données PostgreSQL
    logger.info('🐘 Connexion PostgreSQL...');
    const rawDbUrl = process.env.DATABASE_URL || '';
    const safeDbUrl = rawDbUrl
      ? rawDbUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')
      : '';
    logger.info(
      `🐘 DB runtime config cwd=${process.cwd()} database_url=${safeDbUrl} db_ssl=${process.env.DB_SSL || ''}`
    );
    await initDatabase();

    try {
      const [{ postgis_full_version } = {}] = await appDataSource.query(
        'SELECT PostGIS_Full_Version() AS postgis_full_version'
      );
      logger.info(`🧭 PostGIS version ${postgis_full_version || ''}`);
    } catch (e) {
      logger.warn('⚠️  PostGIS check failed', { message: e?.message, code: e?.code });
    }

    try {
      const [{ live_locations } = {}] = await appDataSource.query(
        "SELECT to_regclass('public.live_locations') AS live_locations"
      );
      logger.info(`🧭 live_locations table ${live_locations || ''}`);
    } catch (e) {
      logger.warn('⚠️  live_locations check failed', { message: e?.message, code: e?.code });
    }

    // 1. Initialiser Redis
    if (process.env.REDIS_HOST) {
      logger.info('🔴 Connexion à Redis...');
      await redisManager.connect();
    } else {
      logger.warn('⚠️  Redis non configuré, utilisation du stockage mémoire');
    }

    // 2. Initialiser le service d'audit unifié
    logger.info('🗄️  Initialisation service audit...');
    await auditLogService.initialize();

    // 3. Tester les alertes si configurées
    if (process.env.EMAIL_ALERTS_ENABLED === 'true' || process.env.SMS_ALERTS_ENABLED === 'true') {
      logger.info('📧 Services d\'alerte configurés');
    }

    logger.info('✅ Tous les services initialisés avec succès');

  } catch (error) {
    logger.error('❌ Erreur initialisation services:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
      error,
    });
    // Ne pas arrêter le serveur, continuer avec les services disponibles
  }
}

export async function startServer({ port = PORT, hostname = '0.0.0.0', logStartup = true } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);

    server.listen(port, hostname, async () => {
      try {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;

        if (logStartup) {
          logger.info(`🚀 Serveur Mossombi démarré sur le port ${actualPort}`);
          logger.info(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
          logger.info(`📅 Démarré le: ${new Date().toLocaleString('fr-FR')}`);
          logger.info(`❤️  Santé: http://localhost:${actualPort}/health`);
        }

        await initializeServices();

        // Realtime Socket.IO (live location streaming)
        try {
          await initRealtimeSocket(server);
        } catch (e) {
          logger.error('❌ Erreur init realtime socket', { error: e?.message });
        }

        if (logStartup) {
          logger.info('📋 Routes disponibles:');
          logger.info('   - POST /api/v1/auth/register - Inscription utilisateur');
          logger.info('   - GET  /api/v1/auth/check-phone - Vérifier existence numéro');
          logger.info('   - POST /api/v1/auth/send-otp - Envoyer code OTP');
          logger.info('   - POST /api/v1/auth/verify-otp - Vérifier code OTP');
          logger.info('   - POST /api/v1/auth/admin/unblock-user - Débloquer utilisateur (admin)');
          logger.info('   - GET  /api/v1/auth/admin/security-stats - Statistiques sécurité (admin)');
          logger.info('   - GET  /api/v1/auth/admin/audit-report - Rapport d\'audit (admin)');
          logger.info('   - GET  /api/v1/users/profile');
          logger.info('   - PUT  /api/v1/users/profile');
          logger.info('   - GET  /api/v1/notifications');
          logger.info('   - GET  /api/v1/whatsapp/session');
          logger.info('   - GET  /api/v1/monitoring/health - Santé système détaillée');
          logger.info('   - GET  /api/v1/monitoring/metrics - Métriques temps réel (admin)');
          logger.info('   - GET  /api/v1/monitoring/search-audit - Recherche audit (admin)');

          logger.info('🛡️  Système de sécurité: ACTIF');
          logger.info('📊 Monitoring temps réel: ACTIF');
          logger.info('🗄️  Audit base de données: ACTIF');
          logger.info('🔴 Redis rate limiting: ' + (redisManager.isConnected ? 'ACTIF' : 'FALLBACK MÉMOIRE'));
        }

        resolve({
          server,
          port: actualPort,
          baseUrl: `http://127.0.0.1:${actualPort}`,
        });
      } catch (e) {
        reject(e);
      }
    });

    server.on('error', reject);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer({ port: PORT }).catch((error) => {
    logger.error('❌ Erreur démarrage serveur:', { error: error.message });
    process.exit(1);
  });
}

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

export default app;
