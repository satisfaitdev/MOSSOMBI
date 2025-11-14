-- =====================================================
-- MOSSOMBI - PHASE 1 : AUTHENTIFICATION & PROFILS
-- Migration 001 - Basée sur l'analyse du frontend
-- Date: 6 novembre 2025
-- =====================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 👤 TABLE PRINCIPALE : PROFILS UTILISATEURS
-- =====================================================

-- Table des profils utilisateurs (complète auth.users de Supabase)
CREATE TABLE public.users (
  -- Référence à auth.users de Supabase
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- 📱 DONNÉES D'AUTHENTIFICATION (du frontend)
  phone TEXT UNIQUE NOT NULL, -- "+243 XXX XXX XXX" - utilisé pour login/register
  email TEXT UNIQUE, -- "user@mossombi.com" - optionnel au début
  full_name TEXT NOT NULL DEFAULT 'Utilisateur Mossombi', -- nom complet
  
  -- 🖼️ DONNÉES DE PROFIL (page edit profile)
  avatar_url TEXT, -- URL de l'image de profil
  date_of_birth DATE, -- "01/01/1995" format du frontend
  address TEXT, -- "Kinshasa, RDC" - adresse complète
  gender TEXT CHECK (gender IN ('male', 'female', 'other')), -- genre
  
  -- 🏆 DONNÉES SYSTÈME (page profile)
  user_id_display TEXT UNIQUE, -- "MSB-123456" format affiché
  country_code TEXT DEFAULT 'CD', -- 🇨🇩 code pays
  user_level TEXT DEFAULT 'Bronze' CHECK (user_level IN ('Bronze', 'Silver', 'Gold', 'Diamond')),
  points INTEGER DEFAULT 0 CHECK (points >= 0), -- 1250 points système
  
  -- 🔒 STATUTS & SÉCURITÉ
  is_verified BOOLEAN DEFAULT FALSE, -- vérification téléphone/email
  is_active BOOLEAN DEFAULT TRUE, -- compte actif
  phone_verified_at TIMESTAMP WITH TIME ZONE, -- date vérification téléphone
  email_verified_at TIMESTAMP WITH TIME ZONE, -- date vérification email
  last_login_at TIMESTAMP WITH TIME ZONE, -- dernière connexion
  
  -- 📊 MÉTADONNÉES
  metadata JSONB DEFAULT '{}', -- données additionnelles flexibles
  preferences JSONB DEFAULT '{}', -- préférences utilisateur (thème, notifications)
  
  -- ⏰ TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 📄 TABLE : DOCUMENTS D'IDENTITÉ
-- =====================================================

-- Table des documents d'identité (pour vérification)
CREATE TABLE public.user_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 📋 TYPE DE DOCUMENT
  document_type TEXT NOT NULL CHECK (document_type IN (
    'national_id', 'passport', 'driver_license', 'voter_card'
  )),
  document_number TEXT NOT NULL, -- numéro du document
  
  -- 📁 FICHIERS
  document_front_url TEXT, -- recto du document
  document_back_url TEXT, -- verso du document (si applicable)
  selfie_url TEXT, -- selfie avec document
  
  -- ✅ VÉRIFICATION
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN (
    'pending', 'under_review', 'approved', 'rejected'
  )),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id), -- admin qui a vérifié
  rejection_reason TEXT, -- raison du rejet si applicable
  
  -- ⏰ VALIDITÉ
  issued_date DATE, -- date d'émission
  expires_at DATE, -- date d'expiration
  
  -- 📊 MÉTADONNÉES
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte : un seul document par type par utilisateur
  UNIQUE(user_id, document_type)
);

-- =====================================================
-- 📱 TABLE : SESSIONS UTILISATEURS
-- =====================================================

-- Table des sessions actives (pour sécurité et monitoring)
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 📱 INFORMATIONS SESSION
  session_token TEXT NOT NULL UNIQUE, -- token de session
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop', 'web')),
  device_name TEXT, -- "iPhone 13", "Samsung Galaxy"
  os_name TEXT, -- "iOS", "Android", "Windows"
  os_version TEXT, -- "15.0", "12"
  app_version TEXT, -- "1.0.0"
  
  -- 🌐 INFORMATIONS RÉSEAU
  ip_address INET, -- adresse IP
  user_agent TEXT, -- user agent complet
  location_country TEXT, -- pays détecté
  location_city TEXT, -- ville détectée
  
  -- ⏰ GESTION SESSION
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- 📊 MÉTADONNÉES
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 🔔 TABLE : NOTIFICATIONS
-- =====================================================

-- Table des notifications (basée sur profile.tsx)
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 📋 CONTENU NOTIFICATION
  type TEXT NOT NULL CHECK (type IN (
    'welcome', 'verification', 'security', 'profile_update', 'system'
  )),
  title TEXT NOT NULL, -- "Bienvenue sur Mossombi !"
  message TEXT NOT NULL, -- message détaillé
  
  -- 🎯 DONNÉES ADDITIONNELLES
  action_url TEXT, -- URL d'action (optionnel)
  action_text TEXT, -- texte du bouton d'action
  data JSONB DEFAULT '{}', -- données personnalisées
  
  -- 📱 ÉTAT
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- ⏰ TIMESTAMPS
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 📊 INDEX POUR PERFORMANCE
-- =====================================================

-- Index utilisateurs (requêtes fréquentes)
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_user_id_display ON public.users(user_id_display) WHERE user_id_display IS NOT NULL;
CREATE INDEX idx_users_country_code ON public.users(country_code);
CREATE INDEX idx_users_user_level ON public.users(user_level);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- Index documents
CREATE INDEX idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX idx_user_documents_verification_status ON public.user_documents(verification_status);
CREATE INDEX idx_user_documents_document_type ON public.user_documents(document_type);

-- Index sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions(is_active);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions(last_activity_at DESC);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Index notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- =====================================================
-- 🔧 TRIGGERS POUR UPDATED_AT
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at 
  BEFORE UPDATE ON public.user_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔧 FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un user_id_display unique
CREATE OR REPLACE FUNCTION generate_user_display_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Générer un ID au format MSB-XXXXXX
    new_id := 'MSB-' || LPAD((RANDOM() * 999999)::INTEGER::TEXT, 6, '0');
    
    -- Vérifier s'il existe déjà
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE user_id_display = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Éviter les boucles infinies
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Impossible de générer un ID unique après 100 tentatives';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le niveau utilisateur basé sur les points
CREATE OR REPLACE FUNCTION calculate_user_level(user_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF user_points >= 5000 THEN
    RETURN 'Diamond';
  ELSIF user_points >= 2000 THEN
    RETURN 'Gold';
  ELSIF user_points >= 500 THEN
    RETURN 'Silver';
  ELSE
    RETURN 'Bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 🛡️ POLITIQUES DE SÉCURITÉ
-- =====================================================

-- USERS : Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_DOCUMENTS : Gestion des documents personnels
CREATE POLICY "Users can manage own documents" ON public.user_documents
  FOR ALL USING (auth.uid() = user_id);

-- USER_SESSIONS : Gestion des sessions personnelles
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATIONS : Gestion des notifications personnelles
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour permettre l'insertion de notifications (par le système)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 🎯 DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Fonction pour créer un utilisateur de test
CREATE OR REPLACE FUNCTION create_test_user(
  test_phone TEXT,
  test_email TEXT DEFAULT NULL,
  test_name TEXT DEFAULT 'Utilisateur Test'
)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Générer un UUID pour le test
  user_uuid := uuid_generate_v4();
  
  -- Insérer dans users (simule un utilisateur auth.users)
  INSERT INTO public.users (
    id, phone, email, full_name, user_id_display, points
  ) VALUES (
    user_uuid, test_phone, test_email, test_name, 
    generate_user_display_id(), 150
  );
  
  -- Créer une notification de bienvenue
  INSERT INTO public.notifications (user_id, type, title, message) VALUES (
    user_uuid, 'welcome', 'Bienvenue sur Mossombi !', 
    'Votre compte a été créé avec succès. Explorez nos services !'
  );
  
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ✅ VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier que toutes les tables ont été créées
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'user_documents', 'user_sessions', 'notifications')) = 4,
         'Toutes les tables Phase 1 doivent être créées';
  
  RAISE NOTICE '✅ PHASE 1 - Migration terminée avec succès !';
  RAISE NOTICE '📊 Tables créées : users, user_documents, user_sessions, notifications';
  RAISE NOTICE '🔒 RLS activé sur toutes les tables';
  RAISE NOTICE '⚡ Index de performance créés';
  RAISE NOTICE '🔧 Fonctions utilitaires disponibles';
END $$;
