/**
 * ROUTES WHATSAPP
 * Gestion des sessions et statut WhatsApp
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { whatsappService } from '../services/whatsappService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/v1/whatsapp/status
 * Vérifier le statut de l'API WhatsApp
 */
router.get('/status', asyncHandler(async (req, res) => {
  const status = await whatsappService.checkStatus();
  
  res.json({
    success: true,
    data: {
      api_available: status,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/v1/whatsapp/session
 * Vérifier le statut de la session WhatsApp
 */
router.get('/session', asyncHandler(async (req, res) => {
  const sessionStatus = await whatsappService.checkSessionStatus();
  
  res.json({
    success: true,
    data: sessionStatus
  });
}));

/**
 * POST /api/v1/whatsapp/session/create
 * Créer une nouvelle session WhatsApp
 */
router.post('/session/create', asyncHandler(async (req, res) => {
  const result = await whatsappService.createSession();
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la session',
      details: result.error
    });
  }
  
  res.json({
    success: true,
    message: 'Session créée avec succès',
    data: result
  });
}));

/**
 * GET /api/v1/whatsapp/session/qr
 * Obtenir le QR code de la session
 */
router.get('/session/qr', asyncHandler(async (req, res) => {
  const result = await whatsappService.getQRCode();
  
  if (!result.success) {
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du QR code',
      details: result.error
    });
  }
  
  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/v1/whatsapp/test
 * Tester l'envoi d'un message WhatsApp
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({
      success: false,
      error: 'Numéro de téléphone et message requis'
    });
  }
  
  const result = await whatsappService.sendMessage(phone, message);
  
  res.json({
    success: true,
    message: 'Message de test envoyé',
    data: result
  });
}));

export default router;
