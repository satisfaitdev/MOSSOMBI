-- Migration: Ajout de la colonne privacy_settings à la table users
-- Date: 2025-01-10
-- Description: Ajouter le support des paramètres de confidentialité

-- Ajouter la colonne privacy_settings (JSON) à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "locationSharing": true,
  "cameraAccess": true,
  "microphoneAccess": false,
  "activityTracking": true,
  "dataSharing": false,
  "marketingEmails": true,
  "pushNotifications": true,
  "emailNotifications": false,
  "smsNotifications": true,
  "soundEnabled": true,
  "vibrationEnabled": true,
  "biometricAuth": false
}'::jsonb;

-- Créer un index pour améliorer les performances des requêtes sur privacy_settings
CREATE INDEX IF NOT EXISTS idx_users_privacy_settings 
ON users USING GIN (privacy_settings);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN users.privacy_settings IS 'Paramètres de confidentialité de l''utilisateur (JSON)';

-- Mettre à jour les utilisateurs existants avec les paramètres par défaut s'ils n'en ont pas
UPDATE users 
SET privacy_settings = '{
  "locationSharing": true,
  "cameraAccess": true,
  "microphoneAccess": false,
  "activityTracking": true,
  "dataSharing": false,
  "marketingEmails": true,
  "pushNotifications": true,
  "emailNotifications": false,
  "smsNotifications": true,
  "soundEnabled": true,
  "vibrationEnabled": true,
  "biometricAuth": false
}'::jsonb
WHERE privacy_settings IS NULL;
