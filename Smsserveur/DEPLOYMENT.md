# 🚀 GUIDE DE DÉPLOIEMENT - SERVEUR SMS MOSSOMBI

## 📋 PRÉREQUIS

### 🔌 Matériel
- Serveur Linux avec port USB
- Modem GSM compatible (recommandé: Huawei E3372, E3531, E173)
- Carte SIM avec forfait SMS actif
- Câble USB pour connecter le modem

### 💻 Logiciel
- Coolify configuré
- Docker et Docker Compose
- Accès root au serveur

## 🛠️ INSTALLATION

### 1. Préparation du serveur
```bash
# Installer les dépendances système
sudo apt update
sudo apt install -y gammu gammu-smsd usb-modeswitch usbutils

# Vérifier la détection du modem
lsusb
dmesg | grep ttyUSB
```

### 2. Configuration du modem
```bash
# Connecter le modem GSM
# Insérer la carte SIM
# Vérifier la détection
ls -la /dev/ttyUSB*

# Test basique Gammu
gammu --config /dev/null --device /dev/ttyUSB0 --connection at identify
```

### 3. Déploiement sur Coolify

#### Option A: Via Nixpacks (Recommandé)
```bash
# Dans Coolify:
1. Nouveau projet
2. Source: Git Repository
3. Repository: /path/to/Smsserveur
4. Build Pack: Nixpacks
5. Variables d'environnement (voir .env.example)
6. Deploy
```

#### Option B: Via Docker
```bash
# Cloner le projet
git clone /path/to/Smsserveur
cd Smsserveur

# Copier et configurer l'environnement
cp .env.example .env
nano .env

# Construire et démarrer
docker-compose up -d
```

### 4. Configuration des variables d'environnement
```bash
# Dans Coolify ou .env
PORT=8080
DEBUG=false
API_KEY=votre_cle_api_secrete_ici
MODEM_DEVICE=/dev/ttyUSB0
MODEM_CONNECTION=at
MAX_CONCURRENT_SMS=5
```

### 5. Test de l'installation
```bash
# Vérifier le service
curl http://localhost:8080/health

# Test avec clé API
curl -H "X-API-Key: votre_cle_api" http://localhost:8080/status

# Envoyer un SMS de test
./scripts/test-api.sh
```

## 🔧 INTÉGRATION AVEC BACKEND MOSSOMBI

### 1. Modifier smsService.js
```javascript
// Ajouter dans Backend/src/services/smsService.js
async sendViaLocalGSM(to, message, type) {
  try {
    const response = await fetch('http://sms-server:8080/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SMS_LOCAL_API_KEY
      },
      body: JSON.stringify({ to, message, type })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Local SMS service error: ${error.message}`);
  }
}
```

### 2. Variables d'environnement Backend
```bash
# Dans Backend/.env
SMS_PROVIDER=local-gsm
SMS_LOCAL_API_KEY=votre_cle_api_secrete_ici
SMS_LOCAL_URL=http://sms-server:8080
```

### 3. Modifier la logique d'envoi
```javascript
// Dans sendSMS() method
if (this.provider === 'local-gsm') {
  result = await this.sendViaLocalGSM(to, message, type);
} else {
  // Fallback vers Twilio ou simulation
}
```

## 📊 MONITORING

### 1. Logs
```bash
# Logs du conteneur
docker logs mossombi-sms-server -f

# Logs Gammu
tail -f logs/gammu.log
tail -f logs/smsd.log
```

### 2. Métriques
```bash
# Statistiques via API
curl -H "X-API-Key: votre_cle" http://localhost:8080/stats

# Statut du modem
curl -H "X-API-Key: votre_cle" http://localhost:8080/status
```

### 3. Alertes
Le service peut envoyer des webhooks vers le backend Mossombi en cas de problème.

## 🚨 DÉPANNAGE

### Modem non détecté
```bash
# Vérifier la connexion USB
lsusb
dmesg | tail

# Vérifier les permissions
ls -la /dev/ttyUSB*
sudo chmod 666 /dev/ttyUSB0
```

### Erreurs Gammu
```bash
# Test manuel
gammu --config /dev/null --device /dev/ttyUSB0 --connection at identify
gammu --config /dev/null --device /dev/ttyUSB0 --connection at getsmsfolders
```

### Problèmes de réseau
```bash
# Vérifier la connectivité
docker network ls
docker network inspect mossombi-network
```

## 💰 COÛTS

### Matériel (une fois)
- Modem GSM: $30-50
- Câble USB: $5-10

### Opérationnel (mensuel)
- Carte SIM + forfait SMS: $5-15
- Électricité: ~$1

### Total
- **Initial**: $40-60
- **Mensuel**: $6-16
- **Par SMS**: ~$0.001-0.005 (vs $0.045 Twilio)

**ROI**: Rentable dès 1000 SMS/mois !

## 🎯 PROCHAINES ÉTAPES

1. ✅ Déployer le serveur SMS
2. ✅ Tester l'envoi de SMS
3. ✅ Intégrer avec Backend Mossombi
4. ✅ Configurer le monitoring
5. 🚀 Mettre en production !

**🎉 Félicitations ! Vous avez maintenant un serveur SMS 100% gratuit et auto-hébergé !**
