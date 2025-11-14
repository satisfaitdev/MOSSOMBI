-- =====================================================
-- SCHÉMA DE BASE DE DONNÉES MOSSOMBI - PROPOSITION
-- Basé sur l'analyse du frontend React Native
-- Version: 1.0.0 - 5 novembre 2025
-- =====================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 👤 TABLES UTILISATEURS & AUTHENTIFICATION
-- =====================================================

-- Table des profils utilisateurs (complète auth.users de Supabase)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Données d'authentification (du frontend)
  phone TEXT UNIQUE NOT NULL, -- Utilisé pour login/register
  email TEXT UNIQUE,
  full_name TEXT NOT NULL, -- "Utilisateur Mossombi" par défaut
  
  -- Données de profil (page edit profile)
  avatar_url TEXT,
  date_of_birth DATE, -- "01/01/1995" format
  address TEXT, -- "Kinshasa, RDC"
  
  -- Données système (page profile)
  user_id_display TEXT UNIQUE, -- "MSB-123456" format
  country_code TEXT DEFAULT 'CD', -- 🇨🇩
  user_level TEXT DEFAULT 'Bronze', -- Bronze, Silver, Gold
  points INTEGER DEFAULT 0, -- 1250 points
  
  -- Métadonnées
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 💰 TABLES PORTEFEUILLES & FINANCES
-- =====================================================

-- Table des portefeuilles (basée sur les transactions du frontend)
CREATE TABLE public.wallets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  wallet_type TEXT NOT NULL DEFAULT 'main', -- main, coins
  currency TEXT NOT NULL DEFAULT 'XAF', -- XAF pour FCFA, USD pour coins
  balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, wallet_type, currency)
);

-- Table des transactions (basée sur transactions.tsx)
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  
  -- Structure du frontend
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN (
    'purchase', 'withdrawal', 'deposit', 'recharge', 'transfer', 'refund'
  )),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XAF',
  description TEXT NOT NULL, -- "Recharge Mobile Money", "Achat Coins"
  
  -- Status et métadonnées
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  payment_method TEXT CHECK (payment_method IN (
    'mobile_money', 'bank_card', 'bank_transfer', 'cash'
  )),
  operator TEXT, -- 'orange', 'mtn' pour mobile money
  external_reference TEXT,
  
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des méthodes de paiement (basée sur recharge.tsx)
CREATE TABLE public.payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  method_type TEXT NOT NULL CHECK (method_type IN ('mobile_money', 'bank_card')),
  operator TEXT, -- 'orange', 'mtn', 'visa', 'mastercard'
  phone_number TEXT, -- Pour mobile money
  masked_number TEXT NOT NULL, -- "+243 XXX XXX XXX" ou "**** 1234"
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 🛍️ TABLES SERVICES & PRODUITS
-- =====================================================

-- Table des catégories de services
CREATE TABLE public.service_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des services (basée sur digital-services.tsx et coins.tsx)
CREATE TABLE public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  
  -- Données de base
  name TEXT NOT NULL, -- "Netflix Premium", "Pack Premium"
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- "Abonnement Netflix 1 mois - 4 écrans"
  short_description TEXT,
  
  -- Pricing (du frontend)
  price DECIMAL(15,2) NOT NULL CHECK (price >= 0), -- 15000 FCFA
  compare_at_price DECIMAL(15,2) CHECK (compare_at_price >= price), -- 20000 FCFA
  currency TEXT NOT NULL DEFAULT 'XAF',
  
  -- Spécifique aux services
  service_type TEXT NOT NULL CHECK (service_type IN (
    'digital_subscription', -- Netflix, Spotify
    'coins_package', -- Packs de coins
    'mobile_recharge',
    'other'
  )),
  duration_text TEXT, -- "1 mois"
  coins_value INTEGER DEFAULT 0, -- 1500000 coins pour les packs
  
  -- Métadonnées
  icon_name TEXT, -- 'film', 'music', 'wifi'
  is_exclusive BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 🎫 TABLES ÉVÉNEMENTS & BILLETTERIE
-- =====================================================

-- Table des événements (basée sur billetterie.tsx)
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Données de base
  name TEXT NOT NULL, -- "Concert Fally Ipupa"
  slug TEXT NOT NULL UNIQUE,
  description TEXT, -- "Concert exceptionnel de Fally Ipupa à Kinshasa"
  short_description TEXT,
  
  -- Détails événement
  event_type TEXT NOT NULL CHECK (event_type IN (
    'concert', 'festival', 'sport', 'theater', 'conference'
  )),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL, -- "2025-11-15"
  venue_name TEXT NOT NULL, -- "Stade des Martyrs"
  venue_location TEXT NOT NULL, -- "Kinshasa"
  venue_coordinates POINT,
  
  -- Pricing et métadonnées
  base_price DECIMAL(15,2) NOT NULL CHECK (base_price >= 0), -- 50000
  compare_at_price DECIMAL(15,2),
  currency TEXT NOT NULL DEFAULT 'XAF',
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5), -- 4.9
  capacity INTEGER,
  
  -- Status
  is_exclusive BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sale_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sale_end_date TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des achats/commandes (pour tous les services)
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Référence au produit/service
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  
  -- Détails commande
  order_number TEXT NOT NULL UNIQUE, -- "MSB-ORD-123456"
  order_type TEXT NOT NULL CHECK (order_type IN (
    'service_subscription', 'coins_purchase', 'event_ticket'
  )),
  
  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  
  -- Status et livraison
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
  )),
  delivery_info JSONB, -- Codes d'activation, QR codes, etc.
  expires_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 📱 TABLES NOTIFICATIONS & SYSTÈME
-- =====================================================

-- Table des notifications (basée sur profile.tsx)
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  type TEXT NOT NULL CHECK (type IN (
    'transaction', 'order', 'security', 'marketing', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'audit
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 📊 INDEX POUR PERFORMANCE
-- =====================================================

-- Index utilisateurs
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_user_id_display ON public.users(user_id_display);

-- Index portefeuilles et transactions
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category);

-- Index services et commandes
CREATE INDEX idx_services_category_id ON public.services(category_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);
CREATE INDEX idx_services_service_type ON public.services(service_type);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_type ON public.orders(order_type);

-- Index événements
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_is_active ON public.events(is_active);

-- Index notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);

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

CREATE TRIGGER update_wallets_updated_at 
  BEFORE UPDATE ON public.wallets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON public.services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON public.events 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 🔒 ROW LEVEL SECURITY (RLS) - CONFIGURATION DE BASE
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques de base (les utilisateurs voient leurs propres données)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallets" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own payment methods" ON public.payment_methods
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Services et événements publics (lecture seule)
CREATE POLICY "Services are publicly readable" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Events are publicly readable" ON public.events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service categories are publicly readable" ON public.service_categories
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 📝 DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Catégories de services
INSERT INTO public.service_categories (name, slug, description, icon) VALUES
('Streaming', 'streaming', 'Services de streaming vidéo et audio', 'film'),
('Coins & Gaming', 'coins', 'Packs de coins et gaming', 'gamepad-2'),
('Sécurité', 'security', 'VPN et services de sécurité', 'shield'),
('Concerts', 'concerts', 'Concerts et spectacles', 'music'),
('Sports', 'sports', 'Événements sportifs', 'trophy'),
('Festivals', 'festivals', 'Festivals et événements culturels', 'calendar');

-- Services de test
INSERT INTO public.services (name, slug, description, price, compare_at_price, service_type, duration_text, icon_name, is_exclusive, category_id) VALUES
('Netflix Premium', 'netflix-premium', 'Abonnement Netflix 1 mois - 4 écrans', 15000, 20000, 'digital_subscription', '1 mois', 'film', true, (SELECT id FROM public.service_categories WHERE slug = 'streaming')),
('Spotify Premium', 'spotify-premium', 'Musique illimitée sans pub', 8000, NULL, 'digital_subscription', '1 mois', 'music', false, (SELECT id FROM public.service_categories WHERE slug = 'streaming')),
('Pack Premium Coins', 'pack-premium-coins', 'Pack de 1,500,000 coins', 97695, 130000, 'coins_package', NULL, 'coins', true, (SELECT id FROM public.service_categories WHERE slug = 'coins'));

-- Événements de test
INSERT INTO public.events (name, slug, description, event_type, event_date, venue_name, venue_location, base_price, compare_at_price, rating, is_exclusive) VALUES
('Concert Fally Ipupa', 'concert-fally-ipupa', 'Concert exceptionnel de Fally Ipupa à Kinshasa', 'concert', '2025-11-15 20:00:00+01', 'Stade des Martyrs', 'Kinshasa', 50000, 75000, 4.9, true),
('Festival Amani', 'festival-amani', 'Festival de musique et culture congolaise', 'festival', '2025-12-01 18:00:00+01', 'Centre culturel', 'Goma', 30000, 40000, 4.7, true),
('Match TP Mazembe', 'match-tp-mazembe', 'Match de football - TP Mazembe vs AS Vita Club', 'sport', '2025-10-20 15:00:00+01', 'Stade TP Mazembe', 'Lubumbashi', 15000, NULL, 4.5, false);
