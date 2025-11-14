# 🚀 GUIDE DE DÉPLOIEMENT PRODUCTION MOSSOMBI

## 📋 **PRÉREQUIS**

### 🔧 **Infrastructure Requise :**
- **Serveur** : Ubuntu 20.04+ / CentOS 8+ (4 CPU, 8GB RAM minimum)
- **Node.js** : Version 18+ LTS
- **Redis** : Version 6+ pour le rate limiting
- **PostgreSQL** : Version 13+ (via Supabase ou dédié)
- **SSL/TLS** : Certificat valide
- **Domaine** : Configuré avec DNS

### 📧 **Services Externes :**
- **Supabase** : Base de données et authentification
- **Twilio** : SMS d'alerte (optionnel)
- **SMTP** : Service email (Gmail, SendGrid, etc.)
- **Slack/Teams** : Webhooks d'alerte (optionnel)

---

## 🛠️ **ÉTAPES DE DÉPLOIEMENT**

### **1. PRÉPARATION DU SERVEUR**

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Installation PM2 pour la gestion des processus
sudo npm install -g pm2

# Installation Nginx (reverse proxy)
sudo apt install nginx -y
sudo systemctl enable nginx
```

### **2. CONFIGURATION REDIS**

```bash
# Éditer la configuration Redis
sudo nano /etc/redis/redis.conf

# Modifications recommandées :
# bind 127.0.0.1
# requirepass your_secure_redis_password
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# Redémarrer Redis
sudo systemctl restart redis-server
```

### **3. DÉPLOIEMENT DE L'APPLICATION**

```bash
# Cloner le repository
git clone https://github.com/your-org/mossombi-backend.git
cd mossombi-backend

# Installation des dépendances
npm ci --production

# Configuration de l'environnement
cp .env.production.example .env.production
nano .env.production
```

### **4. CONFIGURATION ENVIRONNEMENT**

Éditez `.env.production` avec vos valeurs :

```env
# Base de données
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_secure_redis_password

# Alertes Email
EMAIL_ALERTS_ENABLED=true
ADMIN_EMAILS=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Alertes SMS (Twilio)
SMS_ALERTS_ENABLED=true
ADMIN_PHONES=+242066123456
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# Sécurité
JWT_SECRET=your_very_secure_jwt_secret_here
AUDIT_ENCRYPTION_KEY=your_audit_encryption_key_here
```

### **5. CONFIGURATION BASE DE DONNÉES**

```bash
# Exécuter les migrations d'audit
psql -h your-db-host -U your-user -d your-database -f sql/audit_tables.sql
```

### **6. CONFIGURATION PM2**

Créez `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'mossombi-backend',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=2048'
  }]
};
```

### **7. CONFIGURATION NGINX**

Créez `/etc/nginx/sites-available/mossombi` :

```nginx
server {
    listen 80;
    server_name api.mossombi.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.mossombi.com;

    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:3000/health;
    }
}
```

### **8. ACTIVATION ET DÉMARRAGE**

```bash
# Activer le site Nginx
sudo ln -s /etc/nginx/sites-available/mossombi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Créer les dossiers de logs
mkdir -p logs

# Démarrer l'application avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔍 **VÉRIFICATION DU DÉPLOIEMENT**

### **1. Tests de Santé**

```bash
# Test de l'API
curl -k https://api.mossombi.com/health

# Test Redis
redis-cli -a your_password ping

# Test base de données
curl -k https://api.mossombi.com/api/v1/auth/check-phone?phone=%2B242066123456
```

### **2. Tests de Sécurité**

```bash
# Test rate limiting
for i in {1..25}; do curl -k https://api.mossombi.com/api/v1/auth/check-phone?phone=%2B24206612345$i; done

# Test force brute (doit être bloqué)
node tests/aggressive-security-test.js
```

### **3. Vérification des Logs**

```bash
# Logs PM2
pm2 logs mossombi-backend

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs application
tail -f logs/combined.log
```

---

## 📊 **MONITORING ET ALERTES**

### **1. Configuration des Alertes**

Les alertes sont automatiquement configurées via :
- **Email** : Envoi vers `ADMIN_EMAILS`
- **SMS** : Envoi vers `ADMIN_PHONES` (Twilio)
- **Slack/Teams** : Webhooks configurés

### **2. Endpoints de Monitoring**

```bash
# Santé générale
GET /health

# Statistiques de sécurité (admin)
GET /api/v1/auth/admin/security-stats

# Rapport d'audit (admin)
GET /api/v1/auth/admin/audit-report
```

### **3. Métriques Clés à Surveiller**

- **Temps de réponse** : < 5 secondes
- **Taux d'erreur** : < 10%
- **Utilisation mémoire** : < 80%
- **IPs bloquées** : < 50/heure
- **Tentatives force brute** : < 100/heure

---

## 🔧 **MAINTENANCE**

### **1. Mise à Jour de l'Application**

```bash
# Sauvegarder la configuration
cp .env.production .env.production.backup

# Mettre à jour le code
git pull origin main
npm ci --production

# Redémarrer sans downtime
pm2 reload mossombi-backend
```

### **2. Nettoyage des Logs d'Audit**

```bash
# Nettoyage automatique (90 jours par défaut)
# Configuré dans l'application

# Nettoyage manuel
psql -h your-db-host -U your-user -d your-database -c "SELECT cleanup_old_audit_logs(30);"
```

### **3. Sauvegarde**

```bash
# Sauvegarde base de données
pg_dump -h your-db-host -U your-user your-database > backup_$(date +%Y%m%d).sql

# Sauvegarde configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env.production ecosystem.config.js
```

---

## 🚨 **RÉSOLUTION DE PROBLÈMES**

### **1. Application ne démarre pas**

```bash
# Vérifier les logs
pm2 logs mossombi-backend

# Vérifier la configuration
node -c src/index.js

# Vérifier les dépendances
npm audit
```

### **2. Redis inaccessible**

```bash
# Vérifier le statut
sudo systemctl status redis-server

# Tester la connexion
redis-cli -a your_password ping

# Vérifier les logs
sudo journalctl -u redis-server
```

### **3. Alertes non reçues**

```bash
# Tester les alertes
node -e "
const { alertService } = require('./src/services/alertService.js');
alertService.testAlerts();
"

# Vérifier la configuration SMTP/Twilio
```

### **4. Performance dégradée**

```bash
# Vérifier l'utilisation des ressources
htop
free -h
df -h

# Vérifier les métriques Redis
redis-cli -a your_password info memory

# Analyser les logs de performance
grep "slow" logs/combined.log
```

---

## 📈 **OPTIMISATIONS AVANCÉES**

### **1. Clustering Multi-Serveurs**

```bash
# Load balancer avec Nginx
upstream mossombi_backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}
```

### **2. Cache Redis Avancé**

```bash
# Configuration Redis Cluster
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002
```

### **3. Monitoring Avancé**

```bash
# Prometheus + Grafana
docker run -d -p 9090:9090 prom/prometheus
docker run -d -p 3001:3000 grafana/grafana
```

---

## ✅ **CHECKLIST DE DÉPLOIEMENT**

- [ ] Serveur configuré et sécurisé
- [ ] Redis installé et configuré
- [ ] Base de données migrée
- [ ] Variables d'environnement configurées
- [ ] SSL/TLS activé
- [ ] Nginx configuré
- [ ] PM2 configuré et démarré
- [ ] Tests de santé passés
- [ ] Tests de sécurité passés
- [ ] Alertes configurées et testées
- [ ] Monitoring activé
- [ ] Sauvegardes configurées
- [ ] Documentation équipe mise à jour

---

## 🎯 **SUPPORT ET CONTACT**

Pour toute question ou problème :
- **Documentation** : Ce fichier
- **Logs** : `logs/combined.log`
- **Monitoring** : `/health` endpoint
- **Alertes** : Configurées automatiquement

**🚀 Votre application Mossombi est maintenant prête pour la production avec une sécurité de niveau entreprise ! 🛡️**
