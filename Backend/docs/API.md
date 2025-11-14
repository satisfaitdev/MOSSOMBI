# 🚀 MOSSOMBI BACKEND API - DOCUMENTATION

## 📋 Vue d'ensemble

L'API Backend Mossombi est une API RESTful construite avec Node.js, Express et Supabase pour gérer l'authentification, les profils utilisateurs, les notifications et les sessions.

### 🔗 URL de base
```
http://localhost:3000/api/v1
```

### 🔐 Authentification
Toutes les routes protégées nécessitent un token Bearer dans le header Authorization :
```
Authorization: Bearer <your-jwt-token>
```

---

## 📊 ROUTES D'AUTHENTIFICATION

### 🔐 POST /auth/register
Inscription d'un nouvel utilisateur

**Body :**
```json
{
  "phone": "+243123456789",
  "full_name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "motdepasse123",
  "country_code": "CD"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Compte créé avec succès !",
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+243123456789",
      "full_name": "Jean Dupont",
      "user_id_display": "MSB-123456",
      "user_level": "Bronze",
      "points": 100,
      "is_verified": false
    },
    "requires_verification": true
  }
}
```

### 🔑 POST /auth/login
Connexion utilisateur

**Body :**
```json
{
  "phone": "+243123456789",
  "password": "motdepasse123"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+243123456789",
      "full_name": "Jean Dupont",
      "user_level": "Bronze",
      "points": 100
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "expires_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

### 🚪 POST /auth/logout
Déconnexion utilisateur (nécessite authentification)

**Réponse :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### 🔄 POST /auth/forgot-password
Demande de réinitialisation de mot de passe

**Body :**
```json
{
  "phone": "+243123456789"
}
```

### 🔑 POST /auth/reset-password
Réinitialisation du mot de passe avec code OTP

**Body :**
```json
{
  "phone": "+243123456789",
  "otp_code": "123456",
  "new_password": "nouveaumotdepasse"
}
```

### 👤 GET /auth/me
Récupérer les informations de l'utilisateur connecté (nécessite authentification)

---

## 👥 ROUTES UTILISATEURS

### 📋 GET /users/profile
Récupérer le profil complet (nécessite authentification)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "phone": "+243123456789",
      "email": "jean@example.com",
      "full_name": "Jean Dupont",
      "user_id_display": "MSB-123456",
      "avatar_url": "https://...",
      "date_of_birth": "1990-01-01",
      "address": "Kinshasa, RDC",
      "gender": "male",
      "country_code": "CD",
      "user_level": "Bronze",
      "points": 1250,
      "is_verified": true,
      "preferences": {},
      "created_at": "2025-01-01T00:00:00Z"
    },
    "documents": [],
    "stats": {
      "total_points": 1250,
      "level_progress": {
        "current_level": "Bronze",
        "progress_percentage": 75,
        "points_to_next": 125
      },
      "account_completion": 85
    }
  }
}
```

### ✏️ PUT /users/profile
Mettre à jour le profil (nécessite authentification)

**Body :**
```json
{
  "full_name": "Jean Dupont",
  "email": "nouveau@example.com",
  "date_of_birth": "1990-01-01",
  "address": "Kinshasa, Gombe",
  "gender": "male"
}
```

### ⚙️ PUT /users/preferences
Mettre à jour les préférences (nécessite authentification)

**Body :**
```json
{
  "theme": "dark",
  "language": "fr",
  "notifications": {
    "push_enabled": true,
    "email_enabled": false
  }
}
```

### 🖼️ POST /users/avatar
Upload de l'avatar (nécessite authentification)

**Form Data :**
- `avatar`: fichier image (JPG, PNG)

### 📄 POST /users/documents
Upload d'un document d'identité (nécessite authentification)

**Form Data :**
- `document_type`: "national_id" | "passport" | "driver_license" | "voter_card"
- `document_number`: "123456789"
- `document_front`: fichier image (recto)
- `document_back`: fichier image (verso, optionnel)
- `selfie`: fichier image (selfie avec document, optionnel)

### 📋 GET /users/documents
Récupérer les documents (nécessite authentification)

### 🗑️ DELETE /users/account
Supprimer le compte (nécessite authentification)

---

## 🔔 ROUTES NOTIFICATIONS

### 📬 GET /notifications
Récupérer les notifications avec filtres (nécessite authentification)

**Query Parameters :**
- `type`: "welcome" | "verification" | "security" | "profile_update" | "system"
- `is_read`: true | false
- `limit`: nombre (défaut: 20, max: 100)
- `offset`: nombre (défaut: 0)
- `sort`: "created_at" | "read_at"
- `order`: "asc" | "desc"

**Réponse :**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "welcome",
        "title": "Bienvenue sur Mossombi !",
        "message": "Votre compte a été créé avec succès.",
        "is_read": false,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0,
      "has_more": true
    },
    "stats": {
      "unread_count": 5,
      "total_count": 50
    }
  }
}
```

### 📨 GET /notifications/unread
Récupérer uniquement les notifications non lues (nécessite authentification)

### 📄 GET /notifications/:id
Récupérer une notification spécifique (nécessite authentification)

### ✅ PUT /notifications/:id/read
Marquer une notification comme lue (nécessite authentification)

### ✅ PUT /notifications/read-multiple
Marquer plusieurs notifications comme lues (nécessite authentification)

**Body :**
```json
{
  "notification_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### ✅ PUT /notifications/read-all
Marquer toutes les notifications comme lues (nécessite authentification)

### 🗑️ DELETE /notifications/:id
Supprimer une notification (nécessite authentification)

### 📊 GET /notifications/stats
Récupérer les statistiques des notifications (nécessite authentification)

---

## 📱 ROUTES SESSIONS

### 📋 GET /sessions
Récupérer toutes les sessions actives (nécessite authentification)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "device_type": "mobile",
        "device_name": "iPhone 13",
        "os_name": "iOS",
        "os_version": "15.0",
        "location_country": "CD",
        "location_city": "Kinshasa",
        "is_active": true,
        "last_activity_at": "2025-01-01T00:00:00Z",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total_count": 3,
    "active_count": 2
  }
}
```

### ➕ POST /sessions
Créer une nouvelle session (nécessite authentification)

**Body :**
```json
{
  "device_type": "mobile",
  "device_name": "iPhone 13",
  "os_name": "iOS",
  "os_version": "15.0",
  "app_version": "1.0.0"
}
```

### 🔄 PUT /sessions/:id/activity
Mettre à jour l'activité d'une session (nécessite authentification)

### 🚫 DELETE /sessions/:id
Terminer une session spécifique (nécessite authentification)

### 🚫 DELETE /sessions/all
Terminer toutes les autres sessions (nécessite authentification)

### 📊 GET /sessions/stats
Récupérer les statistiques des sessions (nécessite authentification)

---

## 🔧 CODES D'ERREUR

### Codes HTTP Standards
- **200** - OK
- **201** - Created
- **400** - Bad Request (erreur de validation)
- **401** - Unauthorized (non authentifié)
- **403** - Forbidden (non autorisé)
- **404** - Not Found
- **409** - Conflict (données en conflit)
- **500** - Internal Server Error

### Format des Erreurs
```json
{
  "success": false,
  "error": "Message d'erreur",
  "code": "ERROR_CODE",
  "details": [] // optionnel, pour les erreurs de validation
}
```

### Codes d'Erreur Personnalisés
- `VALIDATION_ERROR` - Erreur de validation des données
- `AUTHENTICATION_ERROR` - Erreur d'authentification
- `AUTHORIZATION_ERROR` - Erreur d'autorisation
- `NOT_FOUND_ERROR` - Ressource non trouvée
- `CONFLICT_ERROR` - Conflit de données
- `DATABASE_ERROR` - Erreur de base de données
- `RATE_LIMIT_EXCEEDED` - Limite de requêtes dépassée

---

## 🛡️ SÉCURITÉ

### Rate Limiting
- **Limite** : 100 requêtes par 15 minutes par IP
- **Headers** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Validation des Données
- Toutes les entrées sont validées avec Joi
- Sanitisation automatique des données
- Protection contre les injections

### Headers de Sécurité
- Helmet.js pour les headers de sécurité
- CORS configuré pour les domaines autorisés
- Protection CSRF

---

## 🚀 DÉMARRAGE RAPIDE

### 1. Installation
```bash
cd Backend
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Modifier les variables d'environnement
```

### 3. Démarrage
```bash
# Développement
npm run dev

# Production
npm start
```

### 4. Test de Santé
```bash
curl http://localhost:3000/health
```

---

## 📊 MONITORING

### Logs
- **Développement** : Console avec couleurs
- **Production** : Fichiers dans `/logs/`
- **Niveaux** : error, warn, info, http, debug

### Métriques
- Temps de réponse des requêtes
- Nombre de requêtes par endpoint
- Erreurs par type
- Sessions actives

---

## 🔄 VERSIONS

### v1.0.0 - Phase 1
- ✅ Authentification complète
- ✅ Gestion des profils utilisateurs
- ✅ Système de notifications
- ✅ Gestion des sessions
- ✅ Upload de documents
- ✅ Sécurité et validation

### Roadmap v1.1.0 - Phase 2
- 💰 Système de portefeuilles
- 💳 Gestion des transactions
- 📱 Intégration SMS/Email
- 🔄 Système de points et niveaux

---

## 📞 SUPPORT

Pour toute question ou problème :
- **Email** : support@mossombi.com
- **Documentation** : `/docs/`
- **Logs** : `/logs/app.log`
