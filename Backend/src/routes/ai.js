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
    let generatedVideoUrl = null;
    let usedModel = 'Mock-Model-v2';

    if (geminiToken) {
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
      // Veo nécessite un long polling (opération asynchrone). On tente l'appel, fallback si échec.
      try {
        logger.info("[AI] Requête REST envoyée vers Veo (veo-3.1-lite-generate-preview)...");
        const veoResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-lite-generate-preview:generateContent?key=${geminiToken}`,
          {
            contents: [{ role: "user", parts: [{ text: `Générer une vidéo 3D tournante de: ${prompt || 'objet'}` }] }],
            generationConfig: { responseModalities: ["VIDEO"] }
          },
          { timeout: 30000 }
        );
        if (veoResponse.data?.candidates?.[0]?.content?.parts) {
          const videoPart = veoResponse.data.candidates[0].content.parts.find(p => p.inlineData?.mimeType?.startsWith('video/'));
          if (videoPart?.inlineData?.data) {
            generatedVideoUrl = `data:${videoPart.inlineData.mimeType};base64,${videoPart.inlineData.data}`;
          }
        }
      } catch (veoErr) {
        logger.warn(`[AI] Veo non disponible (${veoErr.message}), vidéo non générée`);
      }
      
      let base64Image = null;
      if (imagenResponse.data?.candidates?.[0]?.content?.parts) {
          const parts = imagenResponse.data.candidates[0].content.parts;
          const imagePart = parts.find(p => p.inlineData);
          if (imagePart?.inlineData) {
              base64Image = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          }
      }

      optimizedImageUrls = base64Image ? [base64Image] : [...imageList];
      usedModel = 'Gemini-Imagen3 (Veo ' + (generatedVideoUrl ? 'OK' : 'N/A') + ')';
    } else {
      logger.warn(`[AI] Aucune clé (GEMINI_API_KEY) ! Utilisation du mode simulation.`);
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

    // Fallback : estimation basée sur le nom et la description (analyse lexicale simple)
    let weight_kg = 1.0;
    let volume_cbm = 0.01;
    const text = `${name} ${description || ''}`.toLowerCase();

    // Catégories avec poids/volume estimés
    const categories = [
      { keywords: ['téléphone', 'phone', 'smartphone', 'iphone', 'samsung', 'xiaomi'], weight: 0.3, volume: 0.001 },
      { keywords: ['ordinateur', 'laptop', 'macbook', 'pc', 'ecran', 'moniteur'], weight: 2.5, volume: 0.015 },
      { keywords: ['tablette', 'ipad'], weight: 0.5, volume: 0.002 },
      { keywords: ['chaussure', 'basket', 'sneaker', 'sandale'], weight: 1.2, volume: 0.005 },
      { keywords: ['t-shirt', 'chemise', 'vêtement', 'pantalon', 'jean', 'robe', 'veste'], weight: 0.2, volume: 0.002 },
      { keywords: ['livre', 'roman', 'manuel'], weight: 0.5, volume: 0.003 },
      { keywords: ['frigo', 'réfrigérateur', 'congélateur'], weight: 60.0, volume: 0.8 },
      { keywords: ['tv', 'télévision', 'home cinema', 'enceinte'], weight: 8.0, volume: 0.1 },
      { keywords: ['lit', 'canapé', 'meuble', 'table', 'chaise', 'armoire'], weight: 25.0, volume: 0.5 },
      { keywords: ['vélo', 'bicyclette'], weight: 15.0, volume: 0.3 },
    ];

    for (const cat of categories) {
      if (cat.keywords.some(kw => text.includes(kw))) {
        weight_kg = cat.weight;
        volume_cbm = cat.volume;
        break;
      }
    }

    return res.json({
      success: true,
      data: { weight_kg, volume_cbm },
      aiUsed: false,
      message: geminiToken ? "Fallback (clé API sans réponse IA valide)" : "Mode simulation (pas de clé API)"
    });

  } catch (error) {
    next(error);
  }
});

export default router;
