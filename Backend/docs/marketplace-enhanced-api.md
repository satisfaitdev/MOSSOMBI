# 🛍️ Marketplace Enhanced API Documentation

## 📋 Vue d'ensemble

L'API Marketplace Enhanced offre une gestion complète des produits avec support pour tous les types d'articles, médias avancés, promotions, et filtres intelligents.

## 🔗 Endpoints

### 🏪 Gestion des Produits (Côté Agence)

#### **POST /api/v1/agency-services-enhanced/articles**
Créer un nouveau produit avec le schéma universel

**Headers:**
```
Authorization: Bearer <token>
```

**Body:** Voir exemples ci-dessous

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "agency_id": "uuid",
    "name": "Nom du produit",
    "price": 15000,
    "structured_data": {
      // Payload complet envoyé
    }
  }
}
```

#### **GET /api/v1/agency-services-enhanced/articles**
Lister les produits de l'agence avec filtres avancés

**Query Parameters:**
- `category`: electronics, clothing, shoes, phones, etc.
- `gender`: men, women, unisex, kids
- `in_stock`: true/false
- `featured`: true/false
- `price_min`: nombre
- `price_max`: nombre
- `search`: texte
- `limit`: nombre (max 100)
- `offset`: nombre

### 🛒 Boutique Publique (Côté Client)

#### **GET /api/v1/store-enhanced/products**
Rechercher des produits dans toutes les agences

**Query Parameters:**
- `q`: recherche textuelle
- `category`: filtre par catégorie
- `brand`: filtre par marque
- `gender`: filtre par genre
- `age_group`: filtre par tranche d'âge
- `price_min/prix_max`: plage de prix
- `in_stock`: produits en stock
- `featured`: produits mis en avant
- `has_promotion`: produits en promotion
- `sort_by`: price_asc, price_desc, newest, oldest, name_asc, name_desc

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15 Pro Max",
      "price": 650000,
      "currency": "XAF",
      "images": [
        {"url": "https://...", "alt": "...", "order": 0}
      ],
      "video": {
        "url": "https://...",
        "thumbnail": "https://...",
        "duration": 30
      },
      "category": {
        "main_category": "phones",
        "sub_category": "smartphones",
        "brand": "Apple"
      },
      "attributes": {
        "screen_size": "6.7 pouces",
        "storage": "256GB",
        "ram": "8GB",
        "color_options": ["Noir", "Blanc", "Bleu"]
      },
      "has_promotion": true,
      "promotion_price": 585000,
      "discount_percentage": 10,
      "delivery_cost": 2500,
      "available_countries": ["RD Congo", "Cameroun"]
    }
  ],
  "pagination": {
    "limit": 40,
    "offset": 0,
    "total": 156
  }
}
```

#### **GET /api/v1/store-enhanced/products/:id**
Détail complet d'un produit

**Response enrichie avec toutes les métadonnées**

#### **POST /api/v1/store-enhanced/checkout**
Passer une commande avec produits enrichis

**Body:**
```json
{
  "items": [
    {
      "article_id": "uuid",
      "quantity": 2,
      "variant_id": "uuid" // optionnel
    }
  ],
  "client_name": "Jean Dupont",
  "client_phone": "+243812345678",
  "delivery_address": "123 Avenue des Nations, Kinshasa",
  "delivery_method": "standard",
  "payment_method": "mobile_money",
  "notes": "Livraison après 18h"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items_count": 2,
    "subtotal": 1300000,
    "delivery_cost": 5000,
    "total_amount": 1305000,
    "currency": "XAF",
    "delivery_method": "standard",
    "payment_method": "mobile_money",
    "estimated_delivery": "3-5 jours",
    "sales": [
      {
        "id": "uuid-sale",
        "amount": 650000,
        "metadata": {
          "article_name": "iPhone 15 Pro Max",
          "promotion_applied": true,
          "original_amount": 700000,
          "discount_amount": 50000
        }
      }
    ]
  }
}
```

#### **GET /api/v1/store-enhanced/categories**
Liste des catégories disponibles

**Response:**
```json
{
  "success": true,
  "data": [
    {"id": "electronics", "name": "Électronique", "icon": "📱"},
    {"id": "phones", "name": "Téléphones", "icon": "📱"},
    {"id": "clothing", "name": "Vêtements", "icon": "👔"}
  ]
}
```

#### **GET /api/v1/store-enhanced/search/filters**
Filtres disponibles pour la recherche

**Response:**
```json
{
  "success": true,
  "data": {
    "brands": ["Apple", "Samsung", "Nike"],
    "price_ranges": ["0-5000", "5000-25000", "25000-100000"],
    "genders": ["men", "women", "unisex"],
    "age_groups": ["adult", "teen", "kids"]
  }
}
```

## 🎯 Exemples par Catégorie

### 📱 Smartphones
```json
{
  "name": "Samsung Galaxy S24 Ultra",
  "price": 520000,
  "category": {
    "main_category": "phones",
    "sub_category": "smartphones",
    "brand": "Samsung"
  },
  "attributes": {
    "screen_size": "6.8 pouces",
    "storage": "256GB",
    "ram": "12GB",
    "camera": "200MP + 50MP + 12MP",
    "battery": "5000mAh",
    "color_options": ["Noir Titane", "Violet Titane", "Gris Titane"]
  },
  "media": {
    "images": [
      {"url": "https://example.com/s24-1.jpg", "order": 0},
      {"url": "https://example.com/s24-2.jpg", "order": 1}
    ],
    "video": {
      "url": "https://example.com/s24-demo.mp4",
      "duration": 25
    }
  }
}
```

### 👗 Vêtements
```json
{
  "name": "Chemise en lin blanc",
  "price": 25000,
  "category": {
    "main_category": "clothing",
    "sub_category": "chemises",
    "brand": "Fashion Africa"
  },
  "demographics": {
    "gender": "men",
    "age_group": "adult"
  },
  "attributes": {
    "sizes": ["S", "M", "L", "XL", "XXL"],
    "colors": ["Blanc", "Bleu ciel", "Rose"],
    "material": "Lin et coton",
    "fit": "regular",
    "season": "summer"
  },
  "stock_management": {
    "in_stock": true,
    "quantity": 50,
    "track_quantity": true
  }
}
```

### 👟 Chaussures
```json
{
  "name": "Air Jordan 1 Retro High",
  "price": 95000,
  "category": {
    "main_category": "shoes",
    "brand": "Nike"
  },
  "attributes": {
    "sizes": ["38", "39", "40", "41", "42", "43", "44", "45"],
    "colors": ["Rouge", "Blanc", "Noir"],
    "material": "Cuir et synthétique",
    "closure_type": "lacets"
  },
  "marketing": {
    "featured": true,
    "tags": ["jordan", "basket", "rétro", "classique"]
  }
}
```

## 🔧 Fonctionnalités Avancées

### 📊 Stock Intelligent
- Suivi automatique des quantités
- Alertes de stock faible
- Gestion multi-dépôts

### 🎬 Médias Riches
- Images multiples avec ordre
- Vidéos de démonstration (10-60s)
- Galeries 360° optionnelles

### 💳 Paiements Flexibles
- Multi-méthodes (Mobile Money, Carte, Espèces)
- Paiements en plusieurs fois
- Dépôt optionnel

### 🚚 Livraison Avancée
- Plusieurs méthodes (Standard, Express, Pickup)
- Zones de livraison personnalisées
- Politique de retour configurable

### 🎯 Marketing Intégré
- Promotions et réductions
- Produits mis en avant
- SEO optimisé
- Tags pour recherche

### 🔍 Recherche Intelligente
- Recherche textuelle full-text
- Filtres multi-critères
- Tri personnalisable
- Suggestions automatiques

## 📱 Intégration Mobile

Les endpoints sont optimisés pour:

- **Réponse rapide**: Pagination et filtres efficaces
- **Images optimisées**: URLs CDN ready
- **Métadonnées riches**: Pour UI/UX avancée
- **Offline support**: Structure prédictible
- **Cache friendly**: Headers appropriés

## 🚀 Performance

- **Indexation**: Champs de recherche optimisés
- **Pagination**: Limite 100 produits par requête
- **Cache**: Métadonnées calculées
- **Compression**: Réponses gzip
- **Rate limiting**: Protection anti-abus

## 🔒 Sécurité

- **Authentification**: JWT requise pour les opérations d'écriture
- **Validation**: Joi schemas stricts
- **Sanitization**: Protection XSS
- **Rate limiting**: Par utilisateur et IP
- **Audit**: Traçabilité complète des actions
