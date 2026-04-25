import express from 'express';
import Joi from 'joi';
import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 🔥 SCHÉMAS VALIDATION AMÉLIORÉS
const listProductsSchema = Joi.object({
  q: Joi.string().allow('').max(100).optional(),
  agency_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
  category: Joi.string().valid(
    'electronics', 'clothing', 'shoes', 'accessories', 'computers', 
    'phones', 'home', 'beauty', 'sports', 'books', 'toys', 'food',
    'health', 'automotive', 'jewelry', 'watches', 'bags', 'furniture'
  ).optional(),
  gender: Joi.string().valid('men', 'women', 'unisex', 'kids', 'boys', 'girls').optional(),
  age_group: Joi.string().valid('baby', 'toddler', 'kids', 'teen', 'adult', 'senior').optional(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  in_stock: Joi.boolean().optional(),
  featured: Joi.boolean().optional(),
  has_promotion: Joi.boolean().optional(),
  brand: Joi.string().max(100).optional(),
  sort_by: Joi.string().valid('price_asc', 'price_desc', 'newest', 'oldest', 'name_asc', 'name_desc').default('newest'),
  limit: Joi.number().integer().min(1).max(100).default(40).optional(),
  offset: Joi.number().integer().min(0).default(0).optional(),
});

const checkoutSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      article_id: Joi.string().guid({ version: 'uuidv4' }).required(),
      quantity: Joi.number().integer().min(1).max(100).default(1),
      variant_id: Joi.string().guid({ version: 'uuidv4' }).optional(),
    })
  ).min(1).required(),
  client_name: Joi.string().allow('').max(200).optional(),
  client_phone: Joi.string().allow('').max(32).optional(),
  delivery_address: Joi.string().allow('').max(500).optional(),
  delivery_method: Joi.string().valid('standard', 'express', 'pickup', 'delivery').default('standard'),
  payment_method: Joi.string().valid('credit_card', 'mobile_money', 'cash', 'bank_transfer', 'crypto').required(),
  notes: Joi.string().allow('').max(500).optional(),
});

// 🚀 GET /api/v1/store-enhanced/products - Recherche avancée
router.get('/products', asyncHandler(async (req, res) => {
  const { error, value } = listProductsSchema.validate(req.query);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  let query = dbAdmin
    .from('agency_articles')
    .select(`
      id, agency_id, name, description, price, in_stock, country, delivery_time, status, created_at,
      metadata
    `)
    .eq('status', 'active');

  // 🔥 Filtres avancés
  if (value.agency_id) query = query.eq('agency_id', value.agency_id);
  
  if (value.category) {
    query = query.contains('metadata->filters->main_category', [value.category]);
  }
  
  if (value.gender) {
    query = query.contains('metadata->filters->gender', [value.gender]);
  }
  
  if (value.age_group) {
    query = query.contains('metadata->filters->age_group', [value.age_group]);
  }
  
  if (value.in_stock !== undefined) {
    query = query.eq('metadata->filters->in_stock', value.in_stock);
  }
  
  if (value.featured !== undefined) {
    query = query.eq('metadata->marketing->featured', value.featured);
  }
  
  if (value.has_promotion !== undefined) {
    query = query.eq('metadata->filters->has_promotion', value.has_promotion);
  }
  
  if (value.brand) {
    query = query.ilike('metadata->category->brand', `%${value.brand}%`);
  }
  
  if (value.price_min || value.price_max) {
    if (value.price_min) query = query.gte('price', parseFloat(value.price_min));
    if (value.price_max) query = query.lte('price', parseFloat(value.price_max));
  }
  
  if (value.q) {
    query = query.ilike('metadata->searchable_text', `%${value.q}%`);
  }

  // 🔄 Tri avancé
  switch (value.sort_by) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  query = query.range(value.offset, value.offset + value.limit - 1);

  const { data, error: dbErr } = await query;
  if (dbErr) throw new ValidationError(`Erreur lors de la récupération des produits: ${String(dbErr.message || '')}`);

  // 🔥 Enrichissement des données pour le frontend
  const enrichedProducts = (data || []).map(product => {
    const metadata = product.metadata || {};
    
    return {
      ...product,
      // Extraire les champs enrichis
      currency: metadata.currency || 'XAF',
      images: metadata.media?.images || [],
      video: metadata.media?.video,
      category: metadata.category || {},
      demographics: metadata.demographics || {},
      attributes: metadata.attributes || {},
      marketing: metadata.marketing || {},
      delivery: metadata.delivery || {},
      payment: metadata.payment || {},
      
      // Champs calculés
      has_promotion: metadata.marketing?.promotion?.active || false,
      promotion_price: metadata.marketing?.promotion?.promotion_price,
      discount_percentage: metadata.marketing?.promotion?.discount_percentage,
      
      // Disponibilité
      available_countries: metadata.availability?.countries || [],
      delivery_cost: metadata.delivery?.delivery_cost || 0,
      
      // Filtrer pour le frontend
      metadata: undefined // Cacher les métadonnées brutes
    };
  });

  return res.json({ 
    success: true, 
    data: enrichedProducts,
    pagination: {
      limit: value.limit,
      offset: value.offset,
      total: enrichedProducts.length
    }
  });
}));

// 🔍 GET /api/v1/store-enhanced/products/:id - Détail produit
router.get('/products/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data, error } = await dbAdmin
    .from('agency_articles')
    .select(`
      id, agency_id, name, description, price, in_stock, country, delivery_time, status, created_at,
      metadata
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new ValidationError('Produit introuvable');
  }

  // 🔥 Enrichissement complet pour la page détail
  const metadata = data.metadata || {};
  
  const enrichedProduct = {
    ...data,
    currency: metadata.currency || 'XAF',
    stock_management: metadata.stock_management || {},
    availability: metadata.availability || {},
    delivery: metadata.delivery || {},
    payment: metadata.payment || {},
    media: metadata.media || {},
    category: metadata.category || {},
    demographics: metadata.demographics || {},
    attributes: metadata.attributes || {},
    marketing: metadata.marketing || {},
    configuration: metadata.configuration || {},
    
    // Champs calculés
    has_promotion: metadata.marketing?.promotion?.active || false,
    promotion_price: metadata.marketing?.promotion?.promotion_price,
    discount_percentage: metadata.marketing?.promotion?.discount_percentage,
    valid_until: metadata.marketing?.promotion?.valid_until,
    
    // SEO
    seo_title: metadata.marketing?.seo_title,
    seo_description: metadata.marketing?.seo_description,
    tags: metadata.marketing?.tags || [],
    
    metadata: undefined
  };

  return res.json({ success: true, data: enrichedProduct });
}));

// 🛒 POST /api/v1/store-enhanced/checkout - Checkout amélioré
router.post('/checkout', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = checkoutSchema.validate(req.body);
  if (error) throw new ValidationError(error.details[0].message, error.details);

  const ids = value.items.map(i => i.article_id);
  const { data: articles, error: artErr } = await dbAdmin
    .from('agency_articles')
    .select('id, agency_id, name, price, metadata, status')
    .in('id', ids);

  if (artErr) throw new ValidationError(`Erreur chargement articles: ${String(artErr.message || '')}`);

  const byId = new Map((articles || []).map(a => [String(a.id), a]));

  const now = new Date().toISOString();
  const rows = [];
  let total_amount = 0;
  let total_delivery_cost = 0;

  for (const item of value.items) {
    const art = byId.get(String(item.article_id));
    if (!art) throw new ValidationError(`Article introuvable: ${item.article_id}`);
    if (String(art.status) !== 'active') throw new ValidationError(`Article indisponible: ${item.article_id}`);
    
    const metadata = art.metadata || {};
    const stockManagement = metadata.stock_management || {};
    
    // Vérification du stock
    if (stockManagement.track_quantity && stockManagement.quantity < item.quantity) {
      throw new ValidationError(`Stock insuffisant pour: ${art.name}`);
    }

    const unit = Number(art.price || 0);
    const qty = Number(item.quantity || 1);
    const amount = unit * qty;
    
    // Calcul du prix avec promotion
    let final_amount = amount;
    if (metadata.marketing?.promotion?.active) {
      const promoPrice = metadata.marketing.promotion.promotion_price;
      if (promoPrice && promoPrice < unit) {
        final_amount = promoPrice * qty;
      }
    }
    
    total_amount += final_amount;

    // Coût de livraison
    const deliveryCost = metadata.delivery?.delivery_cost || 0;
    const itemDeliveryCost = value.delivery_method === 'pickup' ? 0 : deliveryCost;
    total_delivery_cost += itemDeliveryCost;

    rows.push({
      id: crypto.randomUUID(),
      agency_id: art.agency_id,
      service_id: 'store',
      amount: final_amount,
      currency: metadata.currency || 'XAF',
      client_user_id: req.user.id,
      client_name: value.client_name || '',
      client_phone: value.client_phone || '',
      sold_by_user_id: req.user.id,
      reference_type: 'agency_article',
      reference_id: art.id,
      commission_amount: null,
      metadata: {
        article_name: art.name,
        unit_price: unit,
        quantity: qty,
        final_amount: final_amount,
        delivery_status: 'pending',
        delivery_method: value.delivery_method,
        delivery_address: value.delivery_address || '',
        payment_method: value.payment_method,
        notes: value.notes || '',
        promotion_applied: final_amount < amount,
        original_amount: amount,
        discount_amount: amount - final_amount,
        delivery_cost: itemDeliveryCost,
        article_metadata: {
          category: metadata.category || {},
          attributes: metadata.attributes || {},
          media: metadata.media || {}
        }
      },
      created_at: now,
      updated_at: now,
    });
  }

  // Vérification du montant minimum pour livraison gratuite
  const grand_total = total_amount + total_delivery_cost;

  const { data: sales, error: saleErr } = await dbAdmin
    .from('agency_sales')
    .insert(rows)
    .select('*');

  if (saleErr) throw new ValidationError(`Erreur création vente: ${String(saleErr.message || '')}`);

  return res.status(201).json({
    success: true,
    data: {
      items_count: value.items.length,
      subtotal: total_amount,
      delivery_cost: total_delivery_cost,
      total_amount: grand_total,
      currency: rows[0]?.currency || 'XAF',
      delivery_method: value.delivery_method,
      payment_method: value.payment_method,
      sales: sales || [],
      estimated_delivery: getEstimatedDelivery(value.delivery_method)
    },
  });
}));

// 🔥 GET /api/v1/store-enhanced/categories - Categories disponibles
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = [
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'phones', name: 'Téléphones', icon: '📱' },
    { id: 'computers', name: 'Ordinateurs', icon: '💻' },
    { id: 'clothing', name: 'Vêtements', icon: '👔' },
    { id: 'shoes', name: 'Chaussures', icon: '👟' },
    { id: 'accessories', name: 'Accessoires', icon: '⌚' },
    { id: 'home', name: 'Maison', icon: '🏠' },
    { id: 'beauty', name: 'Beauté', icon: '💄' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'books', name: 'Livres', icon: '📚' },
    { id: 'toys', name: 'Jouets', icon: '🧸' },
    { id: 'food', name: 'Alimentation', icon: '🍔' },
    { id: 'health', name: 'Santé', icon: '💊' },
    { id: 'automotive', name: 'Automobile', icon: '🚗' },
    { id: 'jewelry', name: 'Bijoux', icon: '💍' },
    { id: 'watches', name: 'Montres', icon: '⌚' },
    { id: 'bags', name: 'Sacs', icon: '👜' },
    { id: 'furniture', name: 'Meubles', icon: '🪑' }
  ];

  return res.json({ success: true, data: categories });
}));

// 🔥 GET /api/v1/store-enhanced/search/filters - Filtres disponibles
router.get('/search/filters', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  // Récupérer les filtres dynamiques selon la catégorie
  let query = dbAdmin
    .from('agency_articles')
    .select('metadata')
    .eq('status', 'active');

  if (category) {
    query = query.contains('metadata->filters->main_category', [category]);
  }

  const { data } = await query;

  // Extraire les filtres uniques
  const brands = new Set();
  const priceRanges = new Set();
  const genders = new Set();
  const ageGroups = new Set();

  (data || []).forEach(item => {
    const metadata = item.metadata || {};
    
    if (metadata.category?.brand) brands.add(metadata.category.brand);
    if (metadata.filters?.price_range) priceRanges.add(metadata.filters.price_range);
    if (metadata.filters?.gender) genders.add(metadata.filters.gender);
    if (metadata.filters?.age_group) ageGroups.add(metadata.filters.age_group);
  });

  return res.json({
    success: true,
    data: {
      brands: Array.from(brands).sort(),
      price_ranges: Array.from(priceRanges).sort(),
      genders: Array.from(genders).sort(),
      age_groups: Array.from(ageGroups).sort()
    }
  });
}));

// 🔧 Fonction utilitaire pour estimation de livraison
function getEstimatedDelivery(method) {
  switch (method) {
    case 'express':
      return '1-2 jours';
    case 'standard':
      return '3-5 jours';
    case 'pickup':
      return 'Disponible immédiatement';
    default:
      return '3-5 jours';
  }
}

export default router;
