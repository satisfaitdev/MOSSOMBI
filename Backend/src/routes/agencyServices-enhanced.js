import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 🔥 SCHÉMA UNIVERSEL POUR TOUS LES TYPES DE PRODUITS
const universalProductSchema = Joi.object({
  // 📦 Informations de base
  name: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().allow('').max(2000).optional(),
  price: Joi.number().min(0).required(),
  currency: Joi.string().valid('XAF', 'CDF', 'EUR', 'USD', 'GBP').default('XAF'),
  
  // 📊 Gestion des stocks
  stock_management: Joi.object({
    in_stock: Joi.boolean().default(true),
    quantity: Joi.number().integer().min(0).default(1),
    low_stock_threshold: Joi.number().integer().min(0).default(5),
    track_quantity: Joi.boolean().default(true)
  }).default(),
  
  // 🌍 Disponibilité géographique
  availability: Joi.object({
    countries: Joi.array().items(Joi.string().max(100)).default(['RD Congo']),
    cities: Joi.array().items(Joi.string().max(100)).default([]),
    delivery_zones: Joi.array().items(Joi.string().max(100)).default([])
  }).default(),
  
  // 🚚 Livraison
  delivery: Joi.object({
    delivery_time: Joi.string().max(50).default('24-48h'),
    delivery_cost: Joi.number().min(0).default(0),
    free_delivery_threshold: Joi.number().min(0).optional(),
    delivery_methods: Joi.array().items(
      Joi.string().valid('standard', 'express', 'pickup', 'delivery')
    ).default(['standard']),
    return_policy: Joi.string().max(500).optional()
  }).default(),
  
  // 💳 Paiement
  payment: Joi.object({
    accepted_methods: Joi.array().items(
      Joi.string().valid('credit_card', 'mobile_money', 'cash', 'bank_transfer', 'crypto')
    ).default(['mobile_money', 'cash']),
    installments_available: Joi.boolean().default(false),
    max_installments: Joi.number().integer().min(2).max(24).optional(),
    deposit_required: Joi.number().min(0).max(1).default(0)
  }).default(),
  
  // 🎨 Médias
  media: Joi.object({
    images: Joi.array().items(
      Joi.object({
        url: Joi.string().uri().required(),
        alt: Joi.string().max(200).optional(),
        order: Joi.number().integer().min(0).default(0)
      })
    ).default([]),
    video: Joi.object({
      url: Joi.string().uri().optional(),
      thumbnail: Joi.string().uri().optional(),
      duration: Joi.number().min(10).max(60).optional(),
      autoplay: Joi.boolean().default(false)
    }).optional(),
    gallery_360: Joi.array().items(Joi.string().uri()).optional()
  }).default(),
  
  // 🏷️ Catégorisation
  category: Joi.object({
    main_category: Joi.string().valid(
      'electronics', 'clothing', 'shoes', 'accessories', 'computers', 
      'phones', 'home', 'beauty', 'sports', 'books', 'toys', 'food',
      'health', 'automotive', 'jewelry', 'watches', 'bags', 'furniture'
    ).required(),
    sub_category: Joi.string().max(100).optional(),
    brand: Joi.string().max(100).optional(),
    collection: Joi.string().max(100).optional()
  }).required(),
  
  // 👫 Caractéristiques démographiques
  demographics: Joi.object({
    gender: Joi.string().valid('men', 'women', 'unisex', 'kids', 'boys', 'girls').default('unisex'),
    age_group: Joi.string().valid('baby', 'toddler', 'kids', 'teen', 'adult', 'senior').default('adult'),
    target_audience: Joi.array().items(Joi.string().max(50)).optional()
  }).default(),
  
  // 🎭 Caractéristiques dynamiques selon catégorie
  attributes: Joi.object().when('category.main_category', {
    switch: [
      {
        is: 'phones',
        then: Joi.object({
          screen_size: Joi.string().max(20).optional(),
          storage: Joi.string().max(20).optional(),
          ram: Joi.string().max(20).optional(),
          camera: Joi.string().max(100).optional(),
          battery: Joi.string().max(50).optional(),
          processor: Joi.string().max(100).optional(),
          connectivity: Joi.array().items(Joi.string().max(50)).optional(),
          color_options: Joi.array().items(Joi.string().max(30)).optional(),
          condition: Joi.string().valid('new', 'refurbished', 'used').default('new'),
          network_compatibility: Joi.array().items(Joi.string().max(20)).optional()
        })
      },
      {
        is: 'clothing',
        then: Joi.object({
          sizes: Joi.array().items(Joi.string().valid('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL')).optional(),
          colors: Joi.array().items(Joi.string().max(30)).optional(),
          material: Joi.string().max(100).optional(),
          fit: Joi.string().valid('slim', 'regular', 'loose', 'oversized').optional(),
          style: Joi.string().max(50).optional(),
          season: Joi.string().valid('spring', 'summer', 'fall', 'winter', 'all-season').optional(),
          care_instructions: Joi.string().max(500).optional()
        })
      },
      {
        is: 'shoes',
        then: Joi.object({
          sizes: Joi.array().items(Joi.string().max(10)).optional(),
          colors: Joi.array().items(Joi.string().max(30)).optional(),
          material: Joi.string().max(100).optional(),
          closure_type: Joi.string().max(50).optional(),
          heel_height: Joi.string().max(20).optional(),
          width: Joi.string().valid('narrow', 'regular', 'wide').optional(),
          occasion: Joi.string().max(50).optional()
        })
      },
      {
        is: 'computers',
        then: Joi.object({
          cpu: Joi.string().max(100).optional(),
          ram: Joi.string().max(20).optional(),
          storage: Joi.string().max(50).optional(),
          graphics: Joi.string().max(100).optional(),
          screen_size: Joi.string().max(20).optional(),
          operating_system: Joi.string().max(50).optional(),
          weight: Joi.string().max(20).optional(),
          ports: Joi.array().items(Joi.string().max(30)).optional()
        })
      }
    ],
    otherwise: Joi.object({
      // Attributs génériques pour autres catégories
      model: Joi.string().max(100).optional(),
      dimensions: Joi.string().max(100).optional(),
      weight: Joi.string().max(50).optional(),
      material: Joi.string().max(100).optional(),
      color_options: Joi.array().items(Joi.string().max(30)).optional(),
      size_options: Joi.array().items(Joi.string().max(30)).optional(),
      warranty: Joi.string().max(200).optional(),
      origin: Joi.string().max(100).optional()
    })
  }).default(),
  
  // ⭐ Marketing et SEO
  marketing: Joi.object({
    tags: Joi.array().items(Joi.string().max(50)).optional(),
    featured: Joi.boolean().default(false),
    bestseller: Joi.boolean().default(false),
    promotion: Joi.object({
      active: Joi.boolean().default(false),
      discount_percentage: Joi.number().min(0).max(100).optional(),
      promotion_price: Joi.number().min(0).optional(),
      valid_until: Joi.date().optional(),
      promo_code: Joi.string().max(20).optional()
    }).optional(),
    seo_title: Joi.string().max(200).optional(),
    seo_description: Joi.string().max(300).optional()
  }).default(),
  
  // 🔧 Configuration avancée
  configuration: Joi.object({
    requires_prescription: Joi.boolean().default(false),
    age_restriction: Joi.number().integer().min(0).max(21).optional(),
    custom_attributes: Joi.object().optional(),
    variants: Joi.array().items(
      Joi.object({
        name: Joi.string().max(100).required(),
        sku: Joi.string().max(50).optional(),
        price_adjustment: Joi.number().default(0),
        stock: Joi.number().integer().min(0).default(0),
        attributes: Joi.object().optional()
      })
    ).optional()
  }).default()
});

// Middleware pour vérifier l'appartenance à une agence
async function getActiveAgencyMembership(userId) {
  const { data: membership } = await dbAdmin
    .from('agency_memberships')
    .select('agency_id, role_in_agency')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .single();

  if (!membership) throw new ValidationError('Vous n\'êtes pas membre d\'une agence approuvée');
  return membership;
}

// 🚀 Route POST améliorée
router.post('/articles', asyncHandler(async (req, res) => {
  const { error, value } = universalProductSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message);

  const membership = await getActiveAgencyMembership(req.user.id);
  const now = new Date().toISOString();

  // 🔥 Transformation pour la base de données
  const article = {
    id: crypto.randomUUID(),
    agency_id: membership.agency_id,
    created_by_user_id: req.user.id,
    
    // Champs de base compatibles avec l'ancien schéma
    name: value.name,
    description: value.description,
    price: value.price,
    in_stock: value.stock_management.in_stock,
    country: value.availability.countries[0] || 'RD Congo',
    delivery_time: value.delivery.delivery_time,
    status: 'active',
    created_at: now,
    updated_at: now,
    
    // 🔥 Nouveaux champs enrichis dans metadata
    metadata: {
      currency: value.currency,
      stock_management: value.stock_management,
      availability: value.availability,
      delivery: value.delivery,
      payment: value.payment,
      media: value.media,
      category: value.category,
      demographics: value.demographics,
      attributes: value.attributes,
      marketing: value.marketing,
      configuration: value.configuration,
      
      // Champs calculés
      searchable_text: [
        value.name,
        value.description,
        value.category.brand || '',
        value.attributes.model || '',
        ...(value.marketing.tags || [])
      ].join(' ').toLowerCase(),
      
      // Indexation pour filtres
      filters: {
        price_range: get_price_range(value.price),
        main_category: value.category.main_category,
        gender: value.demographics.gender,
        age_group: value.demographics.age_group,
        has_promotion: value.marketing.promotion?.active || false,
        in_stock: value.stock_management.in_stock
      }
    }
  };

  const { data, error: dbErr } = await dbAdmin.from('agency_articles').insert(article).select().single();
  if (dbErr) throw dbErr;

  res.status(201).json({ 
    success: true, 
    data: {
      ...data,
      // Retourner les données structurées pour le frontend
      structured_data: JSON.parse(JSON.stringify(value))
    }
  });
}));

// 📊 Route GET améliorée avec filtres
router.get('/articles', asyncHandler(async (req, res) => {
  const membership = await getActiveAgencyMembership(req.user.id);
  
  const {
    category,
    gender,
    in_stock,
    featured,
    price_min,
    price_max,
    search,
    limit = 40,
    offset = 0
  } = req.query;

  let query = dbAdmin
    .from('agency_articles')
    .select('*')
    .eq('agency_id', membership.agency_id)
    .order('created_at', { ascending: false });

  // 🔥 Filtres avancés
  if (category) {
    query = query.contains('metadata->filters->main_category', [category]);
  }
  
  if (gender) {
    query = query.contains('metadata->filters->gender', [gender]);
  }
  
  if (in_stock !== undefined) {
    query = query.eq('metadata->filters->in_stock', in_stock === 'true');
  }
  
  if (featured !== undefined) {
    query = query.eq('metadata->marketing->featured', featured === 'true');
  }
  
  if (price_min || price_max) {
    if (price_min) query = query.gte('price', parseFloat(price_min));
    if (price_max) query = query.lte('price', parseFloat(price_max));
  }
  
  if (search) {
    query = query.ilike('metadata->searchable_text', `%${search}%`);
  }

  query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  const { data, error } = await query;
  if (error) throw error;

  res.json({ success: true, data: data || [] });
}));

// 🔥 Fonction utilitaire pour les plages de prix
function get_price_range(price) {
  if (price < 5000) return '0-5000';
  if (price < 25000) return '5000-25000';
  if (price < 100000) return '25000-100000';
  if (price < 250000) return '100000-250000';
  return '250000+';
}

export default router;
