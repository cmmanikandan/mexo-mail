-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V6__mexo_platform_schema.sql
-- Description: Notifications, Security Audit, Login Activity & Admin Audit Logs
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_notifications.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    reference_type VARCHAR(64),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON mexo_notifications.notifications(user_id, is_read, created_at DESC);

-- ============================================================================
-- 2. SECURITY EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_security.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES mexo_identity.users(id) ON DELETE SET NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL DEFAULT 'INFO',
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_metadata JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON mexo_security.security_events(user_id, created_at DESC);

-- ============================================================================
-- 3. LOGIN ACTIVITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_security.login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES mexo_identity.users(id) ON DELETE SET NULL,
    attempted_identifier VARCHAR(255) NOT NULL,
    result VARCHAR(32) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_activity_ip ON mexo_security.login_activity(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_user ON mexo_security.login_activity(user_id, created_at DESC);

-- ============================================================================
-- 4. SYSTEM ADMIN AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_admin.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID NOT NULL REFERENCES mexo_identity.users(id),
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id UUID,
    result VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON mexo_admin.audit_logs(actor_user_id, created_at DESC);
