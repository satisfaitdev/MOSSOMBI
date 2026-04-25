# 🚀 Mossombi Backend API

Backend API complet pour l'application Mossombi - Super App Multi-Services

## 📊 Vue d'ensemble

API RESTful construite avec Node.js, Express et PostgreSQL pour gérer l'authentification, les profils utilisateurs, les notifications et les sessions de la plateforme Mossombi.

## 🏗️ Structure du Projet

```
backend/
├── src/
│   ├── routes/          # Routes API modulaires
│   │   ├── auth/       # Routes d'authentification
│   │   ├── users/      # Routes utilisateurs (profil, sécurité, activité)
│   │   ├── notifications/ # Routes notifications (manager, sender, templates)
│   │   └── profile/    # Routes profil utilisateur
│   ├── middleware/      # Middlewares Express (auth, errors, logging, audit)
│   ├── services/        # Services métier modulaires
│   │   ├── session/    # Services de session (core, manager, security)
│   │   ├── audit/      # Services d'audit (core, logger, database, security)
│   │   └── [autres]    # Autres services spécialisés
│   ├── config/          # Configuration (database, environment)
│   ├── utils/           # Utilitaires (logger, helpers, validators)
│   └── index.js         # Point d'entrée principal
├── docs/                # Documentation API complète
├── tests/               # Tests unitaires et intégration
├── logs/                # Fichiers de logs (production)
├── .env.example         # Variables d'environnement exemple
└── package.json         # Dépendances et scripts
```

## 🛠️ Technologies

- **Runtime** : Node.js 18+
- **Framework** : Express.js 4.18+
- **Base de données** : PostgreSQL avec TypeORM
- **Authentification** : JWT avec refresh tokens HttpOnly
- **Validation** : Joi 17+
- **Logging** : Winston 3+ avec audit complet
- **Upload** : Multer
- **Sécurité** : Helmet, CORS, Rate Limiting, CSRF protection
- **Architecture** : Modulaire avec séparation des responsabilités

## ✨ Fonctionnalités Implémentées

### 🔐 Phase 1 - Authentification & Profils ✅
- **Inscription/Connexion** utilisateurs avec téléphone/email
- **Gestion complète des profils** (avatar, documents, préférences)
- **Upload de documents** d'identité avec validation
- **Système de notifications** avancé avec filtres
- **Gestion des sessions** multi-appareils avec détection d'anomalies
- **Sécurité** : 2FA, audit logs, rate limiting, CSRF protection

### 🏗️ Architecture Modulaire ✅
- **Services spécialisés** : Session, Audit, Notifications, Profils
- **Modules <500 lignes** pour une meilleure maintenabilité
- **Séparation claire** des responsabilités
- **Tests complets** avec node:test natif

### 🔍 Sécurité Avancée ✅
- **Détection d'anomalies** de session
- **Audit complet** des actions utilisateur
- **2FA** par email/SMS/app
- **Cookies HttpOnly** pour les refresh tokens
- **Rate limiting** et protection CSRF

## 🔧 Configuration

### Variables d'environnement

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/mossombi
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mossombi
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# External APIs
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SMS_API_KEY=your_sms_api_key

# Security
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# Monitoring
LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true
```

## 📚 Documentation

- [Architecture Modulaire](./docs/modular-architecture.md)
- [Schéma de Base de Données](./docs/database-schema.md)
- [API Endpoints](./docs/api-endpoints.md)
- [Sécurité & Audit](./docs/security.md)
- [Tests](./docs/testing.md)

## 🚦 Déploiement

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd mossombi-backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos configurations

# Démarrer le serveur
npm run dev
```

### Scripts disponibles

```bash
npm run dev          # Démarrer en mode développement
npm run start        # Démarrer en mode production
npm run test         # Exécuter les tests
npm run test:api     # Tests API uniquement
npm run lint         # Vérifier le code
npm run logs         # Voir les logs
```

## 📊 Statistiques du Projet

- **Architecture** : 23 modules spécialisés
- **Taille moyenne** : <500 lignes par module
- **Tests** : 100% des endpoints testés
- **Sécurité** : OWASP compliant
- **Performance** : <100ms response time

---

**Créé le :** 5 novembre 2025  
**Version :** 2.0.0 (Refactorisé)  
**Équipe :** Mossombi Development Team  
**Dernière mise à jour :** 9 janvier 2026
