import crypto from 'crypto';
import { dbAdmin } from '../config/db.js';

// Plages de prix (conforme à store-enhanced.js)
function get_price_range(price) {
  if (price < 5000) return '0-5000';
  if (price < 25000) return '5000-25000';
  if (price < 100000) return '25000-100000';
  if (price < 250000) return '100000-250000';
  return '250000+';
}

async function run() {
  console.log('🌱 Démarrage du peuplement des articles...');

  // Trouver l'utilisateur Juste KIBANGOU par son téléphone
  const phone = '+242066944200';
  const { data: user, error: userError } = await dbAdmin
    .from('users')
    .select('id, full_name')
    .eq('phone', phone)
    .single();

  if (userError || !user) {
    console.error('❌ Utilisateur introuvable pour le téléphone:', phone, userError);
    process.exit(1);
  }

  console.log(`✅ Utilisateur trouvé: ${user.full_name} (${user.id})`);

  // Trouver l'agence possédée par cet utilisateur
  const { data: agency, error: agencyError } = await dbAdmin
    .from('agencies')
    .select('id, name')
    .eq('owner_user_id', user.id)
    .single();

  if (agencyError || !agency) {
    console.error('❌ Agence introuvable pour l\'utilisateur:', user.id, agencyError);
    process.exit(1);
  }

  console.log(`✅ Agence trouvée: ${agency.name} (${agency.id})`);

  // Supprimer d'éventuels articles existants pour repartir sur de bonnes bases
  const { error: deleteError } = await dbAdmin
    .from('agency_articles')
    .delete()
    .eq('agency_id', agency.id);

  if (deleteError) {
    console.warn('⚠️ Erreur lors de la suppression des anciens articles:', deleteError);
  } else {
    console.log('✅ Anciens articles de cette agence supprimés.');
  }

  const now = new Date().toISOString();

  // Liste complète des 12 articles de démonstration
  const mockProducts = [
    {
      name: 'iPhone 15 Pro Max',
      description: 'iPhone 15 Pro Max 256GB, titane naturel. État neuf, scellé dans sa boîte d\'origine. Garantie 12 mois.',
      price: 950000,
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
      category: 'phones',
      brand: 'Apple',
      model: '15 Pro Max',
      tags: ['apple', 'iphone', 'ios', 'telephone', 'smartphone'],
      attributes: {
        screen_size: '6.7 pouces',
        storage: '256 Go',
        ram: '8 Go',
        camera: '48 MP + 12 MP + 12 MP',
        battery: '4441 mAh',
        processor: 'A17 Pro',
        color_options: ['Titane Naturel', 'Titane Bleu', 'Titane Noir'],
        condition: 'new'
      }
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Samsung Galaxy S24 Ultra 512GB, gris titane. Appareil photo 200 MP, stylet S-Pen inclus. Intelligence Artificielle Galaxy AI intégrée.',
      price: 850000,
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
      category: 'phones',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      tags: ['samsung', 'galaxy', 'android', 'telephone', 's24'],
      attributes: {
        screen_size: '6.8 pouces',
        storage: '512 Go',
        ram: '12 Go',
        camera: '200 MP + 50 MP + 12 MP + 10 MP',
        battery: '5000 mAh',
        processor: 'Snapdragon 8 Gen 3',
        color_options: ['Gris Titane', 'Noir Titane', 'Violet Titane'],
        condition: 'new'
      }
    },
    {
      name: 'MacBook Pro 14" M3',
      description: 'Apple MacBook Pro 14 pouces avec puce M3, 16 Go de RAM unifiée, 512 Go SSD. Couleur gris sidéral. Performance et autonomie exceptionnelles pour les professionnels.',
      price: 1400000,
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      category: 'computers',
      brand: 'Apple',
      model: 'MacBook Pro M3',
      tags: ['apple', 'macbook', 'ordinateur', 'laptop', 'macos'],
      attributes: {
        cpu: 'Apple M3 (8-core CPU)',
        ram: '16 Go',
        storage: '512 Go SSD',
        graphics: '10-core GPU',
        screen_size: '14.2 pouces Liquid Retina XDR',
        operating_system: 'macOS Sonoma',
        weight: '1.55 kg'
      }
    },
    {
      name: 'PlayStation 5 Slim',
      description: 'Console de salon Sony PlayStation 5 modèle Slim avec lecteur de disque Blu-ray, 1 To SSD. Fournie avec une manette sans fil DualSense blanche.',
      price: 450000,
      image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
      category: 'electronics',
      brand: 'Sony',
      model: 'PS5 Slim',
      tags: ['sony', 'playstation', 'ps5', 'console', 'jeux', 'gaming'],
      attributes: {
        model: 'PlayStation 5 Slim',
        storage: '1 To SSD',
        connectivity: ['HDMI', 'USB-C', 'Wi-Fi', 'Bluetooth'],
        color_options: ['Blanc'],
        condition: 'new'
      }
    },
    {
      name: 'Montre Connectée Apple Watch S9',
      description: 'Apple Watch Series 9 GPS, boîtier en aluminium minuit de 45 mm avec bracelet sport assorti. Analyse avancée du sommeil et de l\'activité physique.',
      price: 320000,
      image_url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500',
      category: 'watches',
      brand: 'Apple',
      model: 'Series 9',
      tags: ['apple', 'watch', 'montre', 'connecte', 'sport'],
      attributes: {
        screen_size: '45 mm',
        connectivity: ['GPS', 'Bluetooth', 'Wi-Fi'],
        color_options: ['Minuit', 'Lumière Stellaire', 'Argent'],
        warranty: '1 an'
      }
    },
    {
      name: 'Canapé Convertible 3 Places',
      description: 'Canapé convertible moderne de 3 places en tissu robuste gris anthracite. Se transforme rapidement en un lit double confortable de 140x190 cm.',
      price: 350000,
      image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500',
      category: 'furniture',
      brand: 'Maison & Co',
      model: 'Convertible Cozy',
      tags: ['canape', 'lit', 'meuble', 'salon', 'maison'],
      attributes: {
        material: 'Tissu texturé / Structure Bois',
        color_options: ['Gris Anthracite', 'Bleu Canard'],
        dimensions: '210 x 90 x 85 cm'
      }
    },
    {
      name: 'T-shirt Mossombi Premium',
      description: 'T-shirt premium Mossombi 100% coton biologique. Coupe moderne et tissu très confortable. Logo Mossombi brodé sur la poitrine.',
      price: 15000,
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
      category: 'clothing',
      brand: 'Mossombi',
      model: 'T-Shirt Classic',
      tags: ['vetement', 'tshirt', 'mossombi', 'coton', 'mode'],
      attributes: {
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Noir', 'Blanc', 'Bleu Marine'],
        material: '100% Coton Biologique',
        fit: 'regular',
        style: 'casual',
        season: 'all-season'
      }
    },
    {
      name: 'Nike Air Max 270',
      description: 'Baskets Nike Air Max 270 blanches pour homme. Confort exceptionnel grâce à la grande unité Air au talon. Design moderne et sportif.',
      price: 75000,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      category: 'shoes',
      brand: 'Nike',
      model: 'Air Max 270',
      tags: ['chaussures', 'baskets', 'nike', 'sport', 'mode'],
      attributes: {
        sizes: ['40', '41', '42', '43', '44'],
        colors: ['Blanc/Noir', 'Tout Noir'],
        material: 'Mesh respirant / Synthétique',
        closure_type: 'Lacets',
        width: 'regular'
      }
    },
    {
      name: 'Sac à dos étanche Adventurer',
      description: 'Sac à dos imperméable Mossombi, robuste avec compartiment renforcé pour ordinateur jusqu\'à 15.6 pouces. Poches intelligentes pour accessoires.',
      price: 25000,
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      category: 'bags',
      brand: 'Mossombi',
      model: 'Adventurer Pack',
      tags: ['sac', 'sacados', 'etanche', 'voyage', 'ordinateur'],
      attributes: {
        material: 'Nylon Waterproof 600D',
        color_options: ['Noir', 'Gris Mat', 'Kaki'],
        dimensions: '45 x 30 x 15 cm'
      }
    },
    {
      name: 'Parfum Bleu de Chanel 100ml',
      description: 'Eau de Parfum Bleu de Chanel pour homme. Flacon de 100 ml. Une fragrance boisée aromatique intemporelle et captivante.',
      price: 110000,
      image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
      category: 'beauty',
      brand: 'Chanel',
      model: 'Bleu Eau de Parfum',
      tags: ['parfum', 'luxe', 'homme', 'beaute', 'chanel'],
      attributes: {
        dimensions: '100 ml',
        origin: 'France',
        warranty: 'Authenticité garantie'
      }
    },
    {
      name: 'Ballon de Football Adidas Pro',
      description: 'Ballon de football Adidas officiel conçu pour les entraînements intensifs et les matchs sur gazon. Revêtement résistant et excellente trajectoire.',
      price: 20000,
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500',
      category: 'sports',
      brand: 'Adidas',
      model: 'Pro Match Ball',
      tags: ['sport', 'football', 'ballon', 'adidas', 'match'],
      attributes: {
        material: 'Polyuréthane thermoplastique (TPU)',
        color_options: ['Blanc/Noir/Rouge'],
        size_options: ['Taille 5 (Officielle)']
      }
    },
    {
      name: 'Casque Audio JBL Tune 770NC',
      description: 'Casque sans fil JBL Tune 770NC avec réduction de bruit adaptative (ANC). Son Pure Bass JBL, connexion multipoint et jusqu\'à 70 heures d\'autonomie.',
      price: 45000,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      category: 'electronics',
      brand: 'JBL',
      model: 'Tune 770NC',
      tags: ['audio', 'casque', 'jbl', 'musique', 'bluetooth', 'sans-fil'],
      attributes: {
        model: 'Tune 770NC',
        color_options: ['Noir', 'Bleu', 'Blanc'],
        warranty: '1 an'
      }
    }
  ];

  for (const p of mockProducts) {
    const articleId = crypto.randomUUID();

    // Construction de l'objet de base et des métadonnées enrichies
    const article = {
      id: articleId,
      agency_id: agency.id,
      created_by_user_id: user.id,
      name: p.name,
      description: p.description,
      price: p.price,
      in_stock: true,
      country: 'Congo-Brazzaville',
      delivery_time: '24-48h',
      status: 'active',
      image_url: p.image_url,
      shipping_unit: 'kg',
      shipping_value: p.category === 'computers' ? 2.5 : p.category === 'clothing' ? 0.3 : 1.0,
      created_at: now,
      updated_at: now,
      metadata: {
        currency: 'XAF',
        stock_management: {
          in_stock: true,
          quantity: 15,
          low_stock_threshold: 3,
          track_quantity: true
        },
        availability: {
          countries: ['Congo-Brazzaville', 'Congo-Kinshasa'],
          cities: ['Pointe-Noire', 'Brazzaville'],
          delivery_zones: ['Zone Centre', 'Zone Périphérie']
        },
        delivery: {
          delivery_time: '24-48h',
          delivery_cost: 1500,
          free_delivery_threshold: 150000,
          delivery_methods: ['standard', 'express', 'pickup']
        },
        payment: {
          accepted_methods: ['mobile_money', 'cash', 'credit_card'],
          installments_available: false,
          deposit_required: 0
        },
        media: {
          images: [
            { url: p.image_url, alt: p.name, order: 0 }
          ]
        },
        category: {
          main_category: p.category,
          brand: p.brand
        },
        demographics: {
          gender: 'unisex',
          age_group: 'adult'
        },
        attributes: p.attributes,
        marketing: {
          tags: p.tags,
          featured: true,
          bestseller: false,
          promotion: {
            active: false
          }
        },
        configuration: {
          requires_prescription: false
        },
        searchable_text: [
          p.name,
          p.description,
          p.brand,
          p.model,
          ...p.tags
        ].join(' ').toLowerCase(),
        filters: {
          price_range: get_price_range(p.price),
          main_category: p.category,
          gender: 'unisex',
          age_group: 'adult',
          has_promotion: false,
          in_stock: true
        }
      }
    };

    console.log(`⏳ Insertion de l'article : ${p.name}...`);
    const { data, error } = await dbAdmin.from('agency_articles').insert(article).select().single();
    if (error) {
      console.error(`❌ Échec de l'insertion pour ${p.name}:`, error.message);
    } else {
      console.log(`✅ Article inséré avec succès : ${data.name} (ID: ${data.id})`);
    }
  }

  console.log('✨ Peuplement terminé avec succès !');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Une erreur est survenue lors du peuplement :', err);
  process.exit(1);
});
