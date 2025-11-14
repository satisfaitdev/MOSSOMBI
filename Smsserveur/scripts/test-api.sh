#!/bin/bash
# 🧪 SCRIPT DE TEST - API SMS MOSSOMBI

API_URL="http://localhost:8080"
API_KEY="mossombi_sms_secret_key_2024"

echo "📱 Test de l'API SMS Mossombi"
echo "================================"

# Test 1: Health Check
echo "🏥 Test Health Check..."
curl -s "$API_URL/health" | jq '.' || echo "❌ Health check échoué"
echo ""

# Test 2: Status
echo "📊 Test Status..."
curl -s -H "X-API-Key: $API_KEY" "$API_URL/status" | jq '.' || echo "❌ Status échoué"
echo ""

# Test 3: Envoi SMS
echo "📤 Test Envoi SMS..."
SMS_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "to": "+242066944200",
    "message": "Test SMS depuis Mossombi - ' $(date) '",
    "priority": "high"
  }' \
  "$API_URL/send-sms")

echo $SMS_RESPONSE | jq '.'

# Extraire l'ID du SMS
SMS_ID=$(echo $SMS_RESPONSE | jq -r '.data.id')

if [ "$SMS_ID" != "null" ]; then
  echo ""
  echo "📋 Test Statut SMS..."
  sleep 2
  curl -s -H "X-API-Key: $API_KEY" "$API_URL/sms-status/$SMS_ID" | jq '.'
fi

echo ""
echo "📈 Test Statistiques..."
curl -s -H "X-API-Key: $API_KEY" "$API_URL/stats" | jq '.'

echo ""
echo "✅ Tests terminés !"
