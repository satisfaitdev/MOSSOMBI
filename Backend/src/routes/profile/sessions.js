/**
 * ROUTES SESSIONS PROFIL
 * Gestion des sessions utilisateur actives
 */

import express from 'express';
import { dbAdmin } from '../../config/db.js';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { asyncHandler, ValidationError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// =====================================================
// 🔧 FONCTIONS UTILITAIRES
// =====================================================

const cleanExpiredSessions = async (userId) => {
  const { error } = await dbAdmin
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString());

  if (error) {
    logger.error('Erreur nettoyage sessions expirées', { userId, error });
  }
};

const ensureCurrentSession = async (req) => {
  const currentUserAgent = req.headers['user-agent'] || '';
  const rawIP = req.ip || req.connection.remoteAddress || 'IP inconnue';
  const currentIP = cleanIP(rawIP);
  
  // Chercher une session existante pour cet appareil
  const { data: existingSession } = await dbAdmin
    .from('user_sessions')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('user_agent', currentUserAgent)
    .eq('is_active', true)
    .single();

  if (!existingSession) {
    // Créer une nouvelle session
    const currentDevice = parseUserAgent(currentUserAgent);
    const currentLocation = await getLocationFromIP(rawIP);
    
    await dbAdmin
      .from('user_sessions')
      .insert({
        user_id: req.user.id,
        session_token: generateSessionToken(),
        device_type: 'mobile',
        device_name: currentDevice.device,
        os_name: currentDevice.os.split(' ')[0], // Ex: "iOS" de "iOS 18.0"
        os_version: currentDevice.os.split(' ')[1] || '', // Ex: "18.0" de "iOS 18.0"
        ip_address: currentIP,
        user_agent: currentUserAgent,
        location_country: currentLocation.country,
        location_city: currentLocation.city,
        is_active: true,
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
      });
  } else {
    // Mettre à jour l'activité de la session existante
    await dbAdmin
      .from('user_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        ip_address: currentIP
      })
      .eq('id', existingSession.id);
  }
};

const generateSessionToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const cleanIP = (ip) => {
  if (!ip) return 'IP inconnue';
  // Si c'est une IPv6 mappée IPv4, extraire seulement la partie IPv4
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  return ip;
};

const parseUserAgent = (userAgent) => {
    if (!userAgent) return { device: 'Appareil inconnu', os: 'OS inconnu' };
    
    // Détection Expo Go avec Darwin (macOS/iOS)
    if (userAgent.includes('Expo')) {
      // Expo sur Darwin (iOS/macOS)
      if (userAgent.includes('Darwin')) {
        const darwinMatch = userAgent.match(/Darwin\/(\d+\.\d+\.\d+)/);
        const darwinVersion = darwinMatch ? darwinMatch[1] : 'inconnu';
        
        // Note: Expo Go ne permet pas d'obtenir la vraie version iOS
        // Darwin version ne correspond pas exactement à la version iOS de l'utilisateur
        const darwinMajor = parseInt(darwinVersion.split('.')[0]);
        
        return { 
          device: 'iPhone (Expo Go)', 
          os: 'iOS' // Expo Go ne permet pas d'obtenir la vraie version iOS
        };
      }
      
      // Expo sur Android
      if (userAgent.includes('Android')) {
        const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
        const version = androidMatch ? androidMatch[1] : 'inconnu';
        return { device: 'Android (Expo Go)', os: `Android ${version}` };
      }
      
      return { device: 'Expo Go', os: 'Mobile' };
    }
    
    // Détection iOS
    if (userAgent.includes('iPhone')) {
      const iosMatch = userAgent.match(/iPhone.*?OS (\d+_\d+)/);
      const version = iosMatch ? iosMatch[1].replace('_', '.') : 'inconnu';
      return { device: 'iPhone', os: `iOS ${version}` };
    }
    
    // Détection iPad
    if (userAgent.includes('iPad')) {
      const iosMatch = userAgent.match(/OS (\d+_\d+)/);
      const version = iosMatch ? iosMatch[1].replace('_', '.') : 'inconnu';
      return { device: 'iPad', os: `iPadOS ${version}` };
    }
    
    // Détection Android
    if (userAgent.includes('Android')) {
      const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
      const version = androidMatch ? androidMatch[1] : 'inconnu';
      return { device: 'Android', os: `Android ${version}` };
    }
    
    // Détection Windows
    if (userAgent.includes('Windows')) {
      if (userAgent.includes('Chrome')) return { device: 'Chrome sur Windows', os: 'Windows' };
      if (userAgent.includes('Firefox')) return { device: 'Firefox sur Windows', os: 'Windows' };
      if (userAgent.includes('Safari')) return { device: 'Safari sur Windows', os: 'Windows' };
      return { device: 'Windows', os: 'Windows' };
    }
    
    // Détection macOS
    if (userAgent.includes('Macintosh')) {
      if (userAgent.includes('Chrome')) return { device: 'Chrome sur Mac', os: 'macOS' };
      if (userAgent.includes('Firefox')) return { device: 'Firefox sur Mac', os: 'macOS' };
      if (userAgent.includes('Safari')) return { device: 'Safari sur Mac', os: 'macOS' };
      return { device: 'Mac', os: 'macOS' };
    }
    
    return { device: 'Appareil inconnu', os: 'OS inconnu' };
};

const getLocationFromIP = async (ip) => {
  // TODO: Implémenter la géolocalisation par IP
  // Pour l'instant, retourne des valeurs par défaut
  return {
    country: 'UNKNOWN',
    city: 'Localisation inconnue'
  };
};

// =====================================================
// 📱 ROUTES SESSIONS
// =====================================================

/**
 * GET /api/v1/profile/security/sessions
 * Récupérer les sessions actives depuis la base de données
 */
router.get('/security/sessions', authenticateToken, asyncHandler(async (req, res) => {
  // D'abord, créer/mettre à jour la session actuelle si elle n'existe pas
  await ensureCurrentSession(req);
  
  // Nettoyer les sessions expirées
  await cleanExpiredSessions(req.user.id);
  
  // Récupérer les sessions actives depuis la base de données
  const { data: sessions, error } = await dbAdmin
    .from('user_sessions')
    .select(`
      id,
      device_type,
      device_name,
      os_name,
      os_version,
      ip_address,
      user_agent,
      location_country,
      location_city,
      is_active,
      last_activity_at,
      created_at
    `)
    .eq('user_id', req.user.id)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false });

  if (error) {
    logger.error('Erreur récupération sessions', { userId: req.user.id, error });
    throw new ValidationError('Erreur lors de la récupération des sessions');
  }

  // Transformer les sessions pour l'API frontend
  const transformedSessions = sessions?.map((session, index) => {
    // Localisation honnête et précise
    let location = 'Localisation inconnue';
    if (session.location_country === 'UNKNOWN') {
      location = session.location_city || 'Localisation inconnue';
    } else if (session.location_city && session.location_country) {
      location = `${session.location_city}, ${session.location_country}`;
    } else if (session.location_country) {
      location = session.location_country;
    }
    
    const device = session.device_name || session.device_type || 'Appareil inconnu';
    const os = session.os_version ? 
      `${session.os_name} ${session.os_version}` : 
      session.os_name || 'OS inconnu';

    return {
      id: session.id,
      device: device,
      location: location,
      ip_address: session.ip_address,
      last_active: session.last_activity_at,
      is_current: index === 0, // La première session (plus récente) est considérée comme actuelle
      user_agent: session.user_agent,
      os: os
    };
  }) || [];

  console.log('🔍 Sessions récupérées depuis la BD:', {
    userId: req.user.id,
    sessionsCount: transformedSessions.length,
    sessions: transformedSessions
  });

  res.json({
    success: true,
    message: 'Sessions actives récupérées',
    data: {
      sessions: transformedSessions,
      total_sessions: transformedSessions.length,
      active_sessions: transformedSessions.filter(s => s.is_current).length
    }
  });
}));

export default router;
