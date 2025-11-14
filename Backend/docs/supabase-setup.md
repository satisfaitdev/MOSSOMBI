# Configuration Supabase - Guide Complet

## 📋 Prérequis

- Compte Supabase (gratuit)
- Node.js 18+ installé
- Git configuré

## 🚀 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Choisir la région (Europe West pour la France)
4. Attendre l'initialisation (2-3 minutes)

### 2. Récupérer les Clés API

#### Nouvelles Clés (Recommandées - 2024)
```bash
# Clé Publishable (pour le client)
sb_publishable_xxx...

# Clé Service Role (pour le serveur)
sb_service_role_xxx...
```

#### Anciennes Clés (Legacy - Compatibilité)
```bash
# Clé Anon (pour le client)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clé Service Role (pour le serveur)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Configuration React Native

#### Installation des Dépendances
```bash
# Pour Expo
npx expo install @supabase/supabase-js expo-sqlite

# Pour React Native CLI
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

#### Configuration Client (Expo)
```typescript
// lib/supabase.ts
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabasePublishableKey = 'YOUR_PUBLISHABLE_KEY';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### Configuration Client (React Native CLI)
```typescript
// lib/supabase.ts
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabasePublishableKey = 'YOUR_PUBLISHABLE_KEY';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Auto-refresh pour React Native
if (Platform.OS !== "web") {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
```

### 4. Variables d'Environnement

#### Fichier .env
```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx...

# Pour les fonctions serveur uniquement
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_xxx...
```

#### Utilisation dans le Code
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
```

### 5. Configuration de Base de Données

#### Activation de RLS (Row Level Security)
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

#### Politiques de Sécurité Exemple
```sql
-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### 6. Configuration des Edge Functions

#### Structure des Fonctions
```
functions/
├── auth-webhook/
│   └── index.ts
├── payment-webhook/
│   └── index.ts
└── send-notification/
    └── index.ts
```

#### Déploiement
```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Déployer une fonction
supabase functions deploy auth-webhook
```

### 7. Configuration Real-time

#### Activation des Canaux
```sql
-- Activer real-time sur les tables
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

#### Écoute des Changements
```typescript
// Écouter les nouvelles transactions
supabase
  .channel('transactions')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'transactions' },
    (payload) => {
      console.log('Nouvelle transaction:', payload);
    }
  )
  .subscribe();
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Clés API** : Ne jamais exposer la clé service_role côté client
2. **RLS** : Toujours activer Row Level Security
3. **Politiques** : Créer des politiques restrictives
4. **HTTPS** : Toujours utiliser HTTPS en production
5. **Validation** : Valider toutes les entrées utilisateur

### Exemple de Politique Sécurisée
```sql
-- Politique pour les portefeuilles
CREATE POLICY "Users can only access own wallet" ON wallets
  FOR ALL USING (
    auth.uid() = user_id AND 
    auth.role() = 'authenticated'
  );
```

## 📊 Monitoring

### Métriques Importantes
- Nombre de requêtes par minute
- Temps de réponse des API
- Erreurs d'authentification
- Utilisation de la base de données

### Alertes Recommandées
- Pic de trafic inhabituel
- Erreurs 500 répétées
- Tentatives d'authentification échouées
- Dépassement des quotas

## 🚀 Déploiement

### Environnements
- **Development** : Projet Supabase de test
- **Staging** : Projet Supabase de pré-production
- **Production** : Projet Supabase principal

### Checklist Déploiement
- [ ] Variables d'environnement configurées
- [ ] RLS activé sur toutes les tables
- [ ] Politiques de sécurité créées
- [ ] Edge Functions déployées
- [ ] Tests d'intégration passés
- [ ] Monitoring configuré

---

**Dernière mise à jour :** 5 novembre 2025
