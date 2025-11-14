# Backend Mossombi - Supabase

## 📋 Vue d'ensemble

Backend de l'application mobile# 🚀 Mossombi Backend API

Backend API complet pour l'application Mossombi - Super App Multi-Services

## 📊 Vue d'ensemble

API RESTful construite avec Node.js, Express et Supabase pour gérer l'authentification, les profils utilisateurs, les notifications et les sessions de la plateforme Mossombi.

## 🏗️ Structure du Projet

```
backend/
├── src/
│   ├── routes/          # Routes API (auth, users, notifications, sessions)
│   ├── middleware/      # Middlewares Express (auth, errors, logging)
│   ├── config/          # Configuration (Supabase, database)
│   ├── utils/           # Utilitaires (logger, helpers)
│   └── index.js         # Point d'entrée principal
├── docs/                # Documentation API complète
├── migrations/          # Migrations base de données SQL
├── logs/                # Fichiers de logs (production)
├── .env.example         # Variables d'environnement exemple
└── package.json         # Dépendances et scripts
```

## 🛠️ Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js 4.18+
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth + JWT
- **Validation** : Joi 17+
- **Logging** : Winston 3+
- **Upload** : Multer
- **Sécurité** : Helmet, CORS, Rate Limiting

## ✨ Fonctionnalités Implémentées

### 🔐 Phase 1 - Authentification & Profils ✅
- **Inscription/Connexion** utilisateurs avec téléphone
- **Gestion complète des profils** (avatar, documents, préférences)
- **Upload de documents** d'identité avec validation
- **Système de notifications** avancé avec filtres
- **Gestion des sessions** multi-appareils
- **Sécurité** : RLS, validation, rate limiting

## 🔧 Configuration

### Variables d'environnement

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=your_database_url

# External APIs
MOBILE_MONEY_API_KEY=your_mobile_money_api_key
SMS_API_KEY=your_sms_api_key
```

## 📚 Documentation

- [Configuration Supabase](./docs/supabase-setup.md)
- [Schéma de Base de Données](./docs/database-schema.md)
- [API Endpoints](./docs/api-endpoints.md)
- [Edge Functions](./docs/edge-functions.md)
- [Sécurité & RLS](./docs/security.md)

## 🚦 Prochaines Étapes

1. ✅ **Structure créée**
2. 🔄 **Configuration Supabase**
3. 🔄 **Schéma de base de données**
4. 🔄 **Migrations initiales**
5. 🔄 **Edge Functions**
6. 🔄 **Tests & Déploiement**

---

**Créé le :** 5 novembre 2025  
**Version :** 1.0.0  
**Équipe :** Mossombi Development Team
