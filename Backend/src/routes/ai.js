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

/**
 * @route POST /api/v1/ai/estimate-shipping
 * @desc Estime le poids (kg) et le volume (cbm) d'un produit selon son nom et description.
 */
router.post('/estimate-shipping', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Le nom du produit est requis" });
    }

    const prompt = `Tu es un expert en logistique. Estime le poids en kilogrammes (kg) et le volume en mètres cubes (CBM) pour ce produit à expédier.
Nom: ${name}
Description: ${description || 'N/A'}

Réponds UNIQUEMENT au format JSON strict avec des nombres :
{"weight_kg": valeur_numerique, "volume_cbm": valeur_numerique}`;

    const geminiToken = process.env.GEMINI_API_KEY;
    
    if (geminiToken) {
      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiToken}`, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, data: parsed, aiUsed: true });
        }
      } catch (err) {
        logger.error(`Erreur AI Shipping: ${err.message}`);
        // Fallback to mock
      }
    }

    // Fallback Mock response
    let weight_kg = 1.0;
    let volume_cbm = 0.01;
    const lowerName = name.toLowerCase();
    if (lowerName.includes('téléphone') || lowerName.includes('phone') || lowerName.includes('smartphone')) {
      weight_kg = 0.3; volume_cbm = 0.001;
    } else if (lowerName.includes('ordinateur') || lowerName.includes('laptop') || lowerName.includes('macbook')) {
      weight_kg = 2.5; volume_cbm = 0.015;
    } else if (lowerName.includes('chaussure') || lowerName.includes('basket')) {
      weight_kg = 1.2; volume_cbm = 0.005;
    } else if (lowerName.includes('t-shirt') || lowerName.includes('chemise') || lowerName.includes('vêtement')) {
      weight_kg = 0.2; volume_cbm = 0.002;
    } else if (lowerName.includes('frigo') || lowerName.includes('réfrigérateur')) {
      weight_kg = 60.0; volume_cbm = 0.8;
    }

    return res.json({
      success: true,
      data: { weight_kg, volume_cbm },
      aiUsed: false,
      message: geminiToken ? "Fallback mock utilisé" : "Mode simulation (Pas de clé API)"
    });

  } catch (error) {
    next(error);
  }
});

export default router;
