import express from 'express';
import { logger } from '../utils/logger.js';
import axios from 'axios';

const router = express.Router();

/**
 * @route POST /api/v1/ai/enhance
 * @desc Optimise une image (détourage/nettoyage) et génère une vidéo de présentation 3D.
 * @access Private
 */
router.post('/enhance', async (req, res, next) => {
  try {
    const { images, prompt } = req.body;
    
    // Support legacy 'image' or new 'images' array
    const imageList = images || (req.body.image ? [req.body.image] : []);

    if (imageList.length === 0) {
      return res.status(400).json({ success: false, error: "Aucune image n'a été fournie" });
    }

    logger.info(`[AI] Demande d'optimisation (Galerie: ${imageList.length} images) -> Prompt: ${prompt}`);

    // Configuration des variables pour Google AI Studio (Gemini / Imagen 3 / Veo)
    const geminiToken = process.env.GEMINI_API_KEY;

    let optimizedImageUrls = [...imageList]; 
    let generatedVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Placeholder vidéo 3D Spin
    let usedModel = 'Mock-Model-v2';

    if (geminiToken) {
      // 🚀 PRODUCTION MODE: Gemini API Key detectée !
      logger.info(`[AI] Clé Gemini API détectée ! Appel à Imagen 3 et Veo...`);
      
      // 1. Image Generation via gemini-2.5-flash-image
      logger.info("[AI] Requête REST envoyée vers gemini-2.5-flash-image...");
      const imagenResponse = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiToken}`, {
         contents: [
            {
               role: "user",
               parts: [ { text: prompt || "Optimiser cet objet avec un fond transparent, rendu photoréaliste de haute qualité." } ]
            }
         ],
         generationConfig: {
             responseModalities: ["IMAGE"]
         }
      });
      
      // 2. Veo (Video Generation) : Interpolation 3D "Objet rotatif"
      logger.info("[AI] Requête REST envoyée vers Veo (veo-3.1-lite-generate-preview) - En attente via Mock");
      // Pour l'instant, Veo nécessite du "long polling" (attente asynchrone) non géré facilement dans une route Express synchrone, on mock la vidéo.
      const veoResponse = { data: { output: 'https://www.w3schools.com/html/mov_bbb.mp4' } };
      
      let base64Image = null;
      // Parsing de la réponse propre à Gemini-2.5-flash-image
      if (imagenResponse.data?.candidates?.[0]?.content?.parts) {
          const parts = imagenResponse.data.candidates[0].content.parts;
          const imagePart = parts.find(p => p.inlineData);
          if (imagePart?.inlineData) {
              base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          }
      }

      optimizedImageUrls = base64Image ? [base64Image] : [...imageList];
      generatedVideoUrl = veoResponse.data.output;
      
      usedModel = 'Gemini-Imagen3 (Veo Mocked)';
    } else {
      // 🧪 DEVELOPMENT MODE
      logger.warn(`[AI] Aucune clé (GEMINI_API_KEY) ! Utilisation du mode Simulation Google AI.`);
      await new Promise(resolve => setTimeout(resolve, 3500));
    }

    logger.info(`[AI] Optimisation terminée avec succès (${usedModel})`);

    return res.status(200).json({
      success: true,
      message: 'Traitement Gemini IA terminé',
      data: {
        optimizedImageUrls: optimizedImageUrls,
        videoUrl: generatedVideoUrl,
        aiUsed: usedModel
      }
    });

  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    logger.error(`Erreur lors du traitement Gemini IA: ${errorMsg}`, { 
      status: error.response?.status,
      details: error.response?.data
    });
    next(error);
  }
});

export default router;
