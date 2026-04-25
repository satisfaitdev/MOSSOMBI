# Sécurité & Audit - Mossombi Backend

## 📋 Vue d'ensemble

Le backend Mossombi implémente une architecture de sécurité multicouche conforme aux standards OWASP, avec un système d'audit complet et une détection proactive des menaces.

## 🛡️ Couches de Sécurité

### 1. Authentification & Autorisation

#### JWT avec Refresh Tokens
```javascript
// Tokens HttpOnly pour la sécurité
const refreshTokenConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
};
```

#### 2FA (Two-Factor Authentication)
- **Email** : Code à 6 chiffres
- **SMS** : OTP sécurisé
- **App** : TOTP (Google Authenticator)
- **Backup codes** : 10 codes de secours

### 2. Validation & Sanitization

#### Joi Schemas
```javascript
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email().max(255),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required()
});
```

#### Rate Limiting
```javascript
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
};
```

### 3. Protection CSRF & CORS

#### CSRF Protection
```javascript
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});
```

#### CORS Configuration
```javascript
const corsConfig = {
  origin: process.env.CORS_ORIGIN?.split(',') || false,
  credentials: true,
  optionsSuccessStatus: 200
};
```

## 🔍 Détection d'Anomalies

### 1. Session Security

#### Détection de Menaces
- **Sessions multiples** suspectes
- **Appareils non reconnus**
- **Changements de géolocalisation**
- **Connexions inhabituelles**
- **User agents suspects**

#### Scoring de Risque
```javascript
const riskFactors = {
  newDevice: 15,
  newLocation: 20,
  rapidLogin: 10,
  suspiciousUA: 25,
  multipleSessions: 15
};
```

### 2. Audit Complet

#### Types d'Événements
```javascript
const auditEvents = {
  authentication: ['login', 'logout', 'failed_login', '2fa_enabled'],
  profile: ['profile_update', 'avatar_upload', 'document_upload'],
  security: ['password_change', '2fa_disabled', 'session_revoked'],
  system: ['error', 'warning', 'info']
};
```

#### Métadonnées d'Audit
```javascript
const auditMetadata = {
  userId: 'uuid',
  action: 'string',
  resource: 'string',
  ip: 'string',
  userAgent: 'string',
  timestamp: 'ISO8601',
  sessionId: 'uuid',
  riskScore: 'number'
};
```

## 🛡️ OWASP Top 10 - Implémentation

### 1. Broken Access Control ✅
- **Validation des permissions** à chaque requête
- **Principe du moindre privilège**
- **Vérification des rôles** dynamique

### 2. Cryptographic Failures ✅
- **Hash bcrypt** (12 rounds) pour les mots de passe
- **JWT RS256** pour les tokens
- **HTTPS obligatoire** en production
- **Variables d'environnement** sécurisées

### 3. Injection ✅
- **TypeORM** avec paramètres bindés
- **Joi validation** pour tous les inputs
- **Sanitization** des données utilisateur

### 4. Insecure Design ✅
- **Architecture modulaire** sécurisée
- **Defense in depth** multicouche
- **Secure by default** configuration

### 5. Security Misconfiguration ✅
- **Headers de sécurité** (Helmet)
- **CORS restrictif**
- **Environment variables** validation

### 6. Vulnerable Components ✅
- **npm audit** automatique
- **Dépendances mises à jour**
- **Vulnerability scanning**

### 7. Authentication Failures ✅
- **2FA obligatoire** pour les actions sensibles
- **Rate limiting** sur les tentatives de connexion
- **Account lockout** après échecs répétés

### 8. Software & Data Integrity ✅
- **Checksum validation** pour les uploads
- **Digital signatures** pour les tokens
- **Immutable logs** d'audit

### 9. Logging & Monitoring ✅
- **Audit complet** des actions
- **Real-time alerts** pour les menaces
- **Structured logging** avec Winston

### 10. Server-Side Request Forgery ✅
- **URL validation** stricte
- **Allowlist** pour les requêtes externes
- **Timeout configuration** pour les appels réseau

## 🔧 Configuration de Sécurité

### Variables d'Environnement

```env
# Security Configuration
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_256_bits
REFRESH_TOKEN_SECRET=your_refresh_token_secret
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS & CSRF
CORS_ORIGIN=https://yourdomain.com
CSRF_SECRET=your_csrf_secret

# Session Security
SESSION_TIMEOUT=3600000
MAX_CONCURRENT_SESSIONS=5

# Audit & Monitoring
ENABLE_AUDIT_LOGS=true
LOG_LEVEL=info
SECURITY_ALERT_EMAIL=security@yourdomain.com
```

### Headers de Sécurité

```javascript
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## 📊 Monitoring & Alertes

### 1. Real-time Monitoring

#### Métriques de Sécurité
```javascript
const securityMetrics = {
  failedLogins: 'counter',
  suspiciousSessions: 'gauge',
  riskScores: 'histogram',
  auditEvents: 'counter',
  blockedRequests: 'counter'
};
```

#### Alertes Automatiques
```javascript
const alertThresholds = {
  failedLoginsPerMinute: 5,
  suspiciousSessionScore: 50,
  rapidLoginAttempts: 3,
  unusualLocationChange: true
};
```

### 2. Dashboard de Sécurité

#### KPIs Principaux
- **Score de risque moyen** par utilisateur
- **Sessions suspectes** actives
- **Tentatives d'intrusion** bloquées
- **Couverture d'audit** des actions
- **Temps de réponse** aux menaces

## 🧪 Tests de Sécurité

### 1. Tests Automatisés

#### Tests d'Injection
```javascript
test('should prevent SQL injection', async () => {
  const maliciousInput = "'; DROP TABLE users; --";
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: maliciousInput, password: 'test' });
  
  assert.strictEqual(response.status, 400);
});
```

#### Tests d'Authentification
```javascript
test('should reject expired JWT tokens', async () => {
  const expiredToken = generateExpiredToken();
  const response = await request(app)
    .get('/api/v1/users/profile')
    .set('Authorization', `Bearer ${expiredToken}`);
  
  assert.strictEqual(response.status, 401);
});
```

### 2. Tests de Charge

#### Configuration Artillery
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  payload:
    path: './test-data/users.json'

scenarios:
  - name: "Login Attack"
    weight: 100
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            username: "{{ username }}"
            password: "{{ password }}"
```

## 🚀 Bonnes Pratiques

### 1. Développement Sécurisé

#### Code Review Checklist
- ✅ Validation des inputs
- ✅ Gestion des erreurs sécurisée
- ✅ Logging approprié
- ✅ Pas de secrets en dur
- ✅ Permissions vérifiées

#### Static Analysis
```bash
# npm audit
npm audit

# ESLint security rules
npx eslint . --ext .js --config .eslintrc.security.js

# Snyk vulnerability scan
npx snyk test
```

### 2. Déploiement Sécurisé

#### Docker Security
```dockerfile
# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Minimal layers
FROM node:18-alpine AS builder
# ... build steps
FROM node:18-alpine AS runtime
COPY --from=builder /app/dist ./dist
```

#### Infrastructure as Code
```yaml
# Kubernetes Security Context
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  capabilities:
    drop:
      - ALL
```

## 📈 Améliorations Continues

### 1. Roadmap Sécurité

#### Court Terme (Q1 2026)
- [ ] WAF integration
- [ ] Behavioral analysis
- [ ] Threat intelligence feeds

#### Moyen Terme (Q2 2026)
- [ ] Zero-trust architecture
- [ ] Hardware security keys
- [ ] Advanced threat detection

#### Long Terme (Q3-Q4 2026)
- [ ] AI-powered security
- [ ] Quantum-resistant cryptography
- [ ] Automated incident response

### 2. Metrics de Succès

- **MTTR** (Mean Time To Respond) < 15 minutes
- **False positive rate** < 5%
- **Vulnerability remediation** < 72 heures
- **Security score** > 95/100

---

**Dernière mise à jour :** 9 janvier 2026  
**Version :** 2.0.0  
**Auteur :** Mossombi Development Team  
**Contact sécurité :** security@mossombi.com
