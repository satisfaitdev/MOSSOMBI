-- =====================================================
-- TABLES SUPABASE POUR MOSSOMBI
-- Créer ces tables dans votre dashboard Supabase
-- =====================================================

-- 1. TABLE NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('welcome', 'verification', 'security', 'profile_update', 'system', 'transaction', 'order', 'marketing')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 2. TABLE SAC À DOS (BACKPACK)
CREATE TABLE IF NOT EXISTS user_backpack (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('achievement', 'reward', 'badge', 'item')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  metadata JSONB DEFAULT '{}',
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ NULL,
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour le sac à dos
CREATE INDEX idx_backpack_user_id ON user_backpack(user_id);
CREATE INDEX idx_backpack_category ON user_backpack(category);
CREATE INDEX idx_backpack_rarity ON user_backpack(rarity);
CREATE INDEX idx_backpack_is_used ON user_backpack(is_used);

-- 3. TABLE PORTEFEUILLES
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'CDF',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  last_transaction_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les portefeuilles
CREATE INDEX idx_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_wallets_status ON user_wallets(status);

-- 4. TABLE TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_id VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('recharge', 'payment', 'transfer', 'withdrawal', 'refund', 'bonus')),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL NULL,
  payment_method VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_amount ON transactions(amount);

-- 5. TABLE HISTORIQUE DES POINTS
CREATE TABLE IF NOT EXISTS user_points_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('login', 'purchase', 'referral', 'achievement', 'bonus')),
  points_before INTEGER NOT NULL DEFAULT 0,
  points_after INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour l'historique des points
CREATE INDEX idx_points_history_user_id ON user_points_history(user_id);
CREATE INDEX idx_points_history_category ON user_points_history(category);
CREATE INDEX idx_points_history_created_at ON user_points_history(created_at DESC);

-- 6. TABLE SESSIONS UTILISATEUR
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les sessions
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- =====================================================
-- FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_backpack_updated_at BEFORE UPDATE ON user_backpack FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un portefeuille
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'CDF');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer un portefeuille à l'inscription
CREATE TRIGGER create_wallet_on_user_creation 
    AFTER INSERT ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_user_wallet();

-- =====================================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_backpack ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour sac à dos
CREATE POLICY "Users can view their own backpack" ON user_backpack
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own backpack items" ON user_backpack
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backpack items" ON user_backpack
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour portefeuilles
CREATE POLICY "Users can view their own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = recipient_id);

-- Politiques pour historique des points
CREATE POLICY "Users can view their own points history" ON user_points_history
    FOR SELECT USING (auth.uid() = user_id);

-- Politiques pour sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- DONNÉES INITIALES (OPTIONNEL)
-- =====================================================

-- Insérer quelques notifications de bienvenue pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_welcome_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Notification de bienvenue
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        NEW.id,
        'welcome',
        'Bienvenue sur Mossombi ! 🎉',
        'Félicitations ! Votre compte a été créé avec succès. Explorez toutes nos fonctionnalités.',
        '{"icon": "🎉", "action_url": "/profile"}'
    );
    
    -- Notification de vérification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        NEW.id,
        'verification',
        'Compte vérifié ✅',
        'Votre numéro de téléphone a été vérifié avec succès.',
        '{"icon": "✅"}'
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer les notifications de bienvenue
CREATE TRIGGER create_welcome_notifications_on_user_creation 
    AFTER INSERT ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_welcome_notifications();

-- Insérer un item de bienvenue dans le sac à dos
CREATE OR REPLACE FUNCTION create_welcome_backpack_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Badge de première connexion
    INSERT INTO user_backpack (user_id, name, description, category, rarity, metadata)
    VALUES (
        NEW.id,
        'Badge Première Connexion',
        'Félicitations pour votre première connexion !',
        'achievement',
        'common',
        '{"icon": "🏆", "points_value": 50}'
    );
    
    -- Points de bienvenue
    INSERT INTO user_backpack (user_id, name, description, category, rarity, metadata)
    VALUES (
        NEW.id,
        'Points de Bienvenue',
        '100 points offerts à l''inscription',
        'reward',
        'common',
        '{"icon": "🎁", "points_value": 100, "usable": true}'
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer les items de bienvenue
CREATE TRIGGER create_welcome_backpack_on_user_creation 
    AFTER INSERT ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_welcome_backpack_items();

-- =====================================================
-- VUES UTILES (OPTIONNEL)
-- =====================================================

-- Vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.full_name,
    u.points,
    u.user_level,
    w.balance as wallet_balance,
    (SELECT COUNT(*) FROM notifications n WHERE n.user_id = u.id AND n.is_read = false) as unread_notifications,
    (SELECT COUNT(*) FROM user_backpack b WHERE b.user_id = u.id) as backpack_items,
    (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id AND t.status = 'completed') as completed_transactions,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN user_wallets w ON u.id = w.user_id;

-- Vue pour les transactions récentes
CREATE OR REPLACE VIEW recent_transactions AS
SELECT 
    t.*,
    u.full_name as user_name,
    ru.full_name as recipient_name
FROM transactions t
LEFT JOIN users u ON t.user_id = u.id
LEFT JOIN users ru ON t.recipient_id = ru.id
ORDER BY t.created_at DESC;

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================

-- Ce script crée toutes les tables nécessaires pour votre application Mossombi
-- Exécutez ce script dans votre dashboard Supabase > SQL Editor
-- Assurez-vous que la table 'users' existe déjà avant d'exécuter ce script
