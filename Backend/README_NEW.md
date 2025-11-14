# 🚀 Mossombi Backend API

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

### 🎯 Prochaines Phases (Roadmap)
- **Phase 2** : Portefeuilles multi-devises et transactions
- **Phase 3** : Services numériques et billetterie
- **Phase 4** : Système d'agences multi-niveaux

## 🚀 Installation & Démarrage

### 1. Prérequis
```bash
Node.js 18+ installé
Compte Supabase configuré
```

### 2. Installation
```bash
cd Backend
npm install
```

### 3. Configuration
```bash
cp .env.example .env
# Modifier les variables d'environnement dans .env
```

### 4. Variables d'environnement essentielles
```env
SUPABASE_URL=https://ysehwpykzgksmaayaqek.supabase.co
SUPABASE_ANON_KEY=votre-cle-anonyme
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service
JWT_SECRET=votre-secret-jwt
```

### 5. Démarrage
```bash
# Développement avec auto-reload
npm run dev

# Production
npm start

# Tests
npm test
```

### 6. Vérification
```bash
# Test de santé de l'API
curl http://localhost:3000/health

# Réponse attendue :
{
  "status": "OK",
  "message": "Mossombi Backend API is running",
  "version": "v1",
  "environment": "development"
}
```

## 📡 Endpoints Principaux

### 🔐 Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/forgot-password` - Mot de passe oublié
- `GET /api/v1/auth/me` - Profil actuel

### 👤 Utilisateurs
- `GET /api/v1/users/profile` - Récupérer profil complet
- `PUT /api/v1/users/profile` - Mettre à jour profil
- `POST /api/v1/users/avatar` - Upload avatar
- `POST /api/v1/users/documents` - Upload documents

### 🔔 Notifications
- `GET /api/v1/notifications` - Liste avec filtres
- `PUT /api/v1/notifications/:id/read` - Marquer comme lu
- `PUT /api/v1/notifications/read-all` - Tout marquer

### 📱 Sessions
- `GET /api/v1/sessions` - Sessions actives
- `POST /api/v1/sessions` - Créer session
- `DELETE /api/v1/sessions/:id` - Terminer session

## 📚 Documentation

- **Documentation API complète** : [`/docs/API.md`](./docs/API.md)
- **Schémas de base de données** : [`/migrations/`](./migrations/)
- **Configuration Supabase** : [`/docs/supabase-setup.md`](./docs/supabase-setup.md)

## 🛡️ Sécurité

- **Authentification JWT** avec Supabase
- **Row Level Security (RLS)** sur toutes les tables
- **Rate Limiting** : 100 req/15min par IP
- **Validation** stricte avec Joi
- **Headers de sécurité** avec Helmet
- **Logs** complets pour audit

## 📊 Monitoring & Logs

### Logs de développement
```bash
# Console avec couleurs
npm run dev
```

### Logs de production
```bash
# Fichiers dans /logs/
tail -f logs/app.log
tail -f logs/error.log
```

### Métriques disponibles
- Temps de réponse par endpoint
- Nombre de requêtes par utilisateur
- Erreurs par type et fréquence
- Sessions actives en temps réel

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Développement avec nodemon
npm start            # Production
npm test             # Tests unitaires
npm run lint         # Vérification du code
npm run db:migrate   # Appliquer migrations
npm run db:seed      # Données de test
```

## 🐛 Debugging

### Logs détaillés
```bash
LOG_LEVEL=debug npm run dev
```

### Erreurs communes
1. **Erreur Supabase** : Vérifier les clés API dans `.env`
2. **Port occupé** : Changer `PORT=3001` dans `.env`
3. **CORS** : Ajouter votre domaine dans `CORS_ORIGIN`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📞 Support

- **Documentation** : `/docs/API.md`
- **Issues** : GitHub Issues
- **Email** : support@mossombi.com
- **Logs** : `/logs/app.log`

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**🎯 Status : Phase 1 Complète ✅**
- Authentification & Profils : 100%
- API Documentation : 100%
- Tests & Sécurité : 100%
- Prêt pour intégration frontend : ✅
