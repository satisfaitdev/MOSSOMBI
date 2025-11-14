#!/bin/bash
# 🚀 SCRIPT DE DÉPLOIEMENT COOLIFY - SERVEUR SMS MOSSOMBI

echo "📱 Déploiement du serveur SMS Mossombi sur Coolify"
echo "=================================================="

# Variables
PROJECT_NAME="mossombi-sms-server"
DOMAIN="sms.mossombi.local"
API_KEY="mossombi_sms_secret_key_2024"

echo "🔧 Configuration du projet..."

# Créer le fichier de configuration Coolify
cat > coolify.json << EOF
{
  "name": "$PROJECT_NAME",
  "description": "Serveur SMS auto-hébergé pour Mossombi",
  "framework": "python",
  "buildpack": "nixpacks",
  "port": 8080,
  "environment": {
    "PORT": "8080",
    "DEBUG": "false",
    "LOG_LEVEL": "INFO",
    "API_KEY": "$API_KEY",
    "MODEM_DEVICE": "/dev/ttyUSB0",
    "MODEM_CONNECTION": "at",
    "MAX_CONCURRENT_SMS": "5",
    "RETRY_ATTEMPTS": "3",
    "RETRY_DELAY": "30"
  },
  "volumes": [
    {
      "host": "/dev",
      "container": "/dev"
    },
    {
      "host": "./logs",
      "container": "/var/log"
    },
    {
      "host": "./data",
      "container": "/var/spool/gammu"
    }
  ],
  "privileged": true,
  "devices": [
    "/dev/ttyUSB0:/dev/ttyUSB0"
  ],
  "healthcheck": {
    "path": "/health",
    "interval": 30,
    "timeout": 10,
    "retries": 3
  }
}
EOF

echo "✅ Configuration créée: coolify.json"

# Créer les répertoires nécessaires
mkdir -p logs data

echo "📁 Répertoires créés: logs/, data/"

# Instructions pour Coolify
echo ""
echo "🎯 INSTRUCTIONS POUR COOLIFY:"
echo "=============================="
echo ""
echo "1. 📂 Dans Coolify, créer un nouveau projet:"
echo "   - Nom: $PROJECT_NAME"
echo "   - Source: Git Repository"
echo "   - Repository: $(pwd)"
echo "   - Branch: main"
echo ""
echo "2. ⚙️ Configuration:"
echo "   - Build Pack: Nixpacks"
echo "   - Port: 8080"
echo "   - Domain: $DOMAIN (optionnel)"
echo ""
echo "3. 🔧 Variables d'environnement à ajouter:"
echo "   PORT=8080"
echo "   DEBUG=false"
echo "   API_KEY=$API_KEY"
echo "   MODEM_DEVICE=/dev/ttyUSB0"
echo "   MODEM_CONNECTION=at"
echo ""
echo "4. 📱 Matériel requis:"
echo "   - Modem GSM connecté en USB"
echo "   - Carte SIM avec forfait SMS"
echo "   - Permissions USB sur le serveur"
echo ""
echo "5. 🚀 Après déploiement:"
echo "   - Tester: curl http://$DOMAIN/health"
echo "   - API: curl -H 'X-API-Key: $API_KEY' http://$DOMAIN/status"
echo ""
echo "💰 COÛT TOTAL: ~\$5-10/mois (SIM + forfait SMS)"
echo "📊 ÉCONOMIES: ~\$40/1000 SMS vs Twilio"
echo ""
echo "✅ Prêt pour le déploiement !"
