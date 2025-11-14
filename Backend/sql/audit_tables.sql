-- =====================================================
-- TABLES D'AUDIT POUR MOSSOMBI
-- Stockage persistant des événements de sécurité
-- =====================================================

-- Table principale des événements d'audit
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Classification de l'événement
    category VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    action VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    description TEXT,
    
    -- Informations sur l'acteur
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    actor_type VARCHAR(20) DEFAULT 'user',
    
    -- Informations sur la cible
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    
    -- Contexte technique
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    status_code INTEGER,
    response_time INTEGER,
    request_size INTEGER,
    response_size INTEGER,
    
    -- Résultat de l'action
    success BOOLEAN DEFAULT true,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Informations de sécurité
    risk_score INTEGER DEFAULT 0,
    is_suspicious BOOLEAN DEFAULT false,
    security_flags TEXT[],
    geolocation JSONB,
    
    -- Données métier et sensibles
    business_data JSONB,
    sensitive_data TEXT, -- Chiffré
    
    -- Métadonnées système
    server_name VARCHAR(100),
    environment VARCHAR(20),
    
    -- Index pour les performances
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(category);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_ip_address ON audit_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_events_suspicious ON audit_events(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_resource ON audit_events(resource_type, resource_id);

-- Index composé pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_events_search ON audit_events(timestamp DESC, category, severity);

-- Table des statistiques d'audit (pour les performances)
CREATE TABLE IF NOT EXISTS audit_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    event_count INTEGER DEFAULT 0,
    suspicious_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, category, severity)
);

-- Index pour les statistiques
CREATE INDEX IF NOT EXISTS idx_audit_statistics_date ON audit_statistics(date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_statistics_category ON audit_statistics(category);

-- Table des IPs bloquées (pour référence croisée)
CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address INET NOT NULL UNIQUE,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    reason TEXT NOT NULL,
    block_count INTEGER DEFAULT 1,
    is_permanent BOOLEAN DEFAULT false,
    unblocked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    unblocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les IPs bloquées
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(blocked_until) WHERE blocked_until > NOW() OR is_permanent = true;

-- Table des sessions suspectes
CREATE TABLE IF NOT EXISTS suspicious_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 0,
    suspicious_activities TEXT[],
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les sessions suspectes
CREATE INDEX IF NOT EXISTS idx_suspicious_sessions_user ON suspicious_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_sessions_ip ON suspicious_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_sessions_score ON suspicious_sessions(risk_score DESC);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer les tables (appelée par le service)
CREATE OR REPLACE FUNCTION create_audit_tables()
RETURNS VOID AS $$
BEGIN
    -- Les tables sont déjà créées ci-dessus
    RAISE NOTICE 'Tables d''audit initialisées avec succès';
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les anciens logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_events 
    WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques rapides
CREATE OR REPLACE FUNCTION get_audit_quick_stats(period_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    total_events BIGINT,
    critical_events BIGINT,
    suspicious_events BIGINT,
    blocked_ips BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_events,
        COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_events,
        COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) as blocked_ips,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users
    FROM audit_events 
    WHERE timestamp >= NOW() - INTERVAL '1 hour' * period_hours;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques quotidiennes
CREATE OR REPLACE FUNCTION update_daily_audit_stats()
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_statistics (date, category, severity, event_count, suspicious_count)
    SELECT 
        DATE(timestamp) as date,
        category,
        severity,
        COUNT(*) as event_count,
        COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_count
    FROM audit_events 
    WHERE DATE(timestamp) = CURRENT_DATE
    GROUP BY DATE(timestamp), category, severity
    ON CONFLICT (date, category, severity) 
    DO UPDATE SET 
        event_count = EXCLUDED.event_count,
        suspicious_count = EXCLUDED.suspicious_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour les statistiques automatiquement
CREATE OR REPLACE FUNCTION trigger_update_audit_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les statistiques pour la date de l'événement
    INSERT INTO audit_statistics (date, category, severity, event_count, suspicious_count)
    VALUES (
        DATE(NEW.timestamp),
        NEW.category,
        NEW.severity,
        1,
        CASE WHEN NEW.is_suspicious THEN 1 ELSE 0 END
    )
    ON CONFLICT (date, category, severity) 
    DO UPDATE SET 
        event_count = audit_statistics.event_count + 1,
        suspicious_count = audit_statistics.suspicious_count + CASE WHEN NEW.is_suspicious THEN 1 ELSE 0 END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS audit_stats_trigger ON audit_events;
CREATE TRIGGER audit_stats_trigger
    AFTER INSERT ON audit_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_audit_stats();

-- =====================================================
-- VUES UTILES
-- =====================================================

-- Vue des événements récents
CREATE OR REPLACE VIEW recent_audit_events AS
SELECT 
    event_id,
    timestamp,
    category,
    action,
    severity,
    description,
    user_id,
    ip_address,
    success,
    is_suspicious,
    risk_score
FROM audit_events 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Vue des activités suspectes
CREATE OR REPLACE VIEW suspicious_activities AS
SELECT 
    event_id,
    timestamp,
    category,
    action,
    description,
    user_id,
    ip_address,
    risk_score,
    security_flags
FROM audit_events 
WHERE is_suspicious = true
ORDER BY timestamp DESC, risk_score DESC;

-- Vue des statistiques par heure
CREATE OR REPLACE VIEW hourly_audit_stats AS
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    category,
    COUNT(*) as event_count,
    COUNT(*) FILTER (WHERE severity = 'CRITICAL') as critical_count,
    COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious_count,
    AVG(risk_score) as avg_risk_score
FROM audit_events 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp), category
ORDER BY hour DESC, category;

-- =====================================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- =====================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_sessions ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (accès complet)
CREATE POLICY admin_audit_access ON audit_events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_level = 'Admin'
        )
    );

-- Politique pour les utilisateurs (accès à leurs propres données uniquement)
CREATE POLICY user_audit_access ON audit_events
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE audit_events IS 'Table principale des événements d''audit pour la sécurité et la conformité';
COMMENT ON TABLE audit_statistics IS 'Statistiques agrégées des événements d''audit pour les performances';
COMMENT ON TABLE blocked_ips IS 'Liste des adresses IP bloquées par le système de sécurité';
COMMENT ON TABLE suspicious_sessions IS 'Sessions utilisateur marquées comme suspectes';

COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Nettoie les anciens logs d''audit selon la période de rétention spécifiée';
COMMENT ON FUNCTION get_audit_quick_stats(INTEGER) IS 'Retourne des statistiques rapides sur les événements d''audit';
COMMENT ON FUNCTION update_daily_audit_stats() IS 'Met à jour les statistiques quotidiennes d''audit';

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insérer un événement de test pour vérifier le fonctionnement
INSERT INTO audit_events (
    event_id,
    category,
    action,
    severity,
    description,
    server_name,
    environment
) VALUES (
    'init-' || extract(epoch from now()),
    'SYSTEM',
    'audit_system_initialized',
    'LOW',
    'Système d''audit initialisé avec succès',
    'mossombi-backend',
    'development'
) ON CONFLICT (event_id) DO NOTHING;
