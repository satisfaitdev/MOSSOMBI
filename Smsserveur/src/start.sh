#!/bin/bash
# 🚀 SCRIPT DE DÉMARRAGE - SERVEUR SMS MOSSOMBI

echo "📱 Démarrage du serveur SMS Mossombi..."

# Vérifier les permissions USB
echo "🔌 Vérification des périphériques USB..."
ls -la /dev/tty* | grep USB || echo "⚠️ Aucun modem USB détecté"

# Vérifier la configuration Gammu
echo "⚙️ Test de la configuration Gammu..."
gammu --config /dev/null identify 2>/dev/null || echo "⚠️ Modem non détecté, mode simulation activé"

# Démarrer l'application
echo "🚀 Lancement de l'API SMS..."
exec python3 app.py
