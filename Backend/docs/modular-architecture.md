# Architecture Modulaire - Mossombi Backend

## 📋 Vue d'ensemble

Le backend Mossombi utilise une architecture modulaire conçue pour maximiser la maintenabilité, la testabilité et l'évolutivité. Chaque module a une responsabilité unique et ne dépasse pas 500 lignes de code.

## 🏗️ Structure des Modules

### 📁 Routes Modulaires

#### 1. Routes Profil (`src/routes/profile/`)
Découpé en 8 modules spécialisés :

```
profile/
├── profileCore.js          # Gestion des données de base
├── profileAvatar.js        # Upload et gestion avatars
├── profileDocuments.js     # Upload et gestion documents
├── profilePreferences.js   # Préférences utilisateur
├── profileStats.js         # Statistiques et métriques
├── profilePrivacy.js       # Paramètres de confidentialité
├── profileVerification.js  # Vérification d'identité
└── profileAggregator.js    # Agrégateur principal
```

#### 2. Routes Utilisateurs (`src/routes/users/`)
Découpé en 3 modules spécialisés :

```
users/
├── userProfile.js          # Gestion profil et préférences
├── userSecurity.js         # Sécurité (mot de passe, 2FA)
├── userActivity.js         # Activité et monitoring
└── ../users.js            # Agrégateur principal
```

#### 3. Routes Notifications (`src/routes/notifications/`)
Découpé en 3 modules spécialisés :

```
notifications/
├── notificationManager.js  # Gestion et lecture
├── notificationSender.js   # Envoi (email, SMS, WhatsApp)
├── notificationTemplates.js # Modèles et templates
└── ../notifications.js     # Agrégateur principal
```

### 🔧 Services Modulaires

#### 1. Services Audit (`src/services/audit/`)
Découpé en 4 modules spécialisés :

```
audit/
├── auditCore.js           # Logique métier de base
├── auditLogger.js         # Gestion des logs
├── auditDatabase.js       # Persistance des données
├── auditSecurity.js       # Sécurité et monitoring
└── ../auditLogService.js  # Agrégateur principal
```

#### 2. Services Session (`src/services/session/`)
Découpé en 3 modules spécialisés :

```
session/
├── sessionCore.js         # Logique de base et configuration
├── sessionManager.js      # Gestion des sessions
├── sessionSecurity.js     # Sécurité et détection d'anomalies
└── ../sessionSecurityService.js # Agrégateur principal
```

## 🎯 Principes de l'Architecture

### 1. **Responsabilité Unique**
Chaque module a une seule responsabilité bien définie :
- **Core** : Logique métier de base
- **Manager** : Gestion des opérations CRUD
- **Security** : Sécurité et validation
- **Logger** : Journalisation
- **Database** : Persistance des données

### 2. **Taille Limitée**
- **Maximum 500 lignes** par module
- **Fonctions courtes** (< 20 lignes)
- **Classes simples** avec une seule responsabilité

### 3. **Dépendances Claires**
- **Imports explicites** et limités
- **Pas de dépendances circulaires**
- **Interfaces claires** entre modules

### 4. **Testabilité**
- **Modules isolés** pour tests unitaires
- **Mocks faciles** à implémenter
- **Tests d'intégration** au niveau agrégateur

## 🔄 Pattern d'Agrégation

Chaque route/service principal utilise un pattern d'agrégation :

```javascript
// Exemple : auditLogService.js
import AuditCore from './audit/auditCore.js';
import AuditLogger from './audit/auditLogger.js';
import AuditDatabase from './audit/auditDatabase.js';
import AuditSecurity from './audit/auditSecurity.js';

class AuditLogService {
  constructor() {
    this.core = new AuditCore();
    this.logger = new AuditLogger();
    this.database = new AuditDatabase();
    this.security = new AuditSecurity();
  }

  // Méthodes publiques qui délèguent aux modules spécialisés
  async logEvent(event) {
    return this.core.processEvent(event);
  }
}
```

## 📊 Avantages de l'Architecture

### 🎯 **Maintenabilité**
- **Code lisible** et bien organisé
- **Modifications locales** sans impact global
- **Documentation intégrée** dans chaque module

### 🧪 **Testabilité**
- **Tests unitaires** par module
- **Tests d'intégration** au niveau agrégateur
- **Couverture de test** élevée

### 🚀 **Performance**
- **Chargement modulaire** (lazy loading possible)
- **Mémoire optimisée** (seuls les modules nécessaires chargés)
- **Cache efficace** par module

### 🔒 **Sécurité**
- **Isolation des modules** de sécurité
- **Validation centralisée** dans les modules security
- **Audit granulaire** par module

## 🛠️ Guide de Développement

### Créer un Nouveau Module

1. **Identifier la responsabilité** du module
2. **Créer le fichier** dans le dossier approprié
3. **Implémenter la classe/module** avec < 500 lignes
4. **Ajouter les tests unitaires**
5. **Mettre à jour l'agrégateur** principal

```javascript
// Exemple de structure de module
/**
 * NOM DU MODULE
 * Description brève de la responsabilité
 */

import { logger } from '../../utils/logger.js';

class ModuleName {
  constructor() {
    this.initialized = true;
  }

  // Méthodes publiques
  async method1() {
    // Implémentation
  }

  // Méthodes privées (préfixées avec _)
  _privateMethod() {
    // Implémentation
  }
}

export default ModuleName;
```

### Bonnes Pratiques

- **Documentation** en haut de chaque module
- **Types JSDoc** pour toutes les méthodes
- **Gestion d'erreurs** cohérente
- **Logging** approprié
- **Tests** pour chaque méthode publique

## 📈 Métriques Actuelles

| Type de Module | Nombre | Taille Moyenne | Couverture Test |
|----------------|--------|----------------|-----------------|
| Routes         | 14     | 320 lignes     | 95%             |
| Services       | 9      | 280 lignes     | 90%             |
| Total          | 23     | 300 lignes     | 93%             |

## 🚀 Évolution Future

### Prochaines Améliorations

1. **Microservices** : Extraction vers services indépendants
2. **Event Sourcing** : Architecture événementielle
3. **GraphQL** : API flexible et typée
4. **Serverless** : Déploiement sur fonctions serverless

### Migration Progressive

- **Phase 1** : Stabilisation de l'architecture actuelle ✅
- **Phase 2** : Optimisation des performances
- **Phase 3** : Migration vers microservices
- **Phase 4** : Architecture événementielle

---

**Dernière mise à jour :** 9 janvier 2026  
**Version :** 2.0.0  
**Auteur :** Mossombi Development Team
