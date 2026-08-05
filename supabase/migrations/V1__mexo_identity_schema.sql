-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V1__mexo_identity_schema.sql
-- Description: Creates schemas and central identity tables for MEXO Account
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- Create Logical PostgreSQL Schemas
CREATE SCHEMA IF NOT EXISTS mexo_identity;
CREATE SCHEMA IF NOT EXISTS mexo_mail;
CREATE SCHEMA IF NOT EXISTS mexo_groups;
CREATE SCHEMA IF NOT EXISTS mexo_contacts;
CREATE SCHEMA IF NOT EXISTS mexo_storage;
CREATE SCHEMA IF NOT EXISTS mexo_notifications;
CREATE SCHEMA IF NOT EXISTS mexo_security;
CREATE SCHEMA IF NOT EXISTS mexo_admin;

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- 1. RESERVED USERNAMES
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.reserved_usernames (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT UNIQUE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- 2. CENTRAL USERS IDENTITY
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username CITEXT UNIQUE NOT NULL,
    primary_address CITEXT UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT check_user_status CHECK (status IN ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DISABLED', 'PENDING'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_normalized_username ON mexo_identity.users (LOWER(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_normalized_address ON mexo_identity.users (LOWER(primary_address));

-- ============================================================================
-- 3. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.profiles (
    user_id UUID PRIMARY KEY REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    avatar_object_id UUID,
    phone VARCHAR(32),
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    locale VARCHAR(16) NOT NULL DEFAULT 'en-US',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. CREDENTIALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    credential_type VARCHAR(32) NOT NULL DEFAULT 'PASSWORD',
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_credential_type UNIQUE (user_id, credential_type)
);

-- ============================================================================
-- 5. RECOVERY METHODS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.recovery_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    value VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_recovery_type CHECK (type IN ('EMAIL', 'PHONE'))
);

-- ============================================================================
-- 6. GLOBAL ROLES & USER ROLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mexo_identity.user_roles (
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES mexo_identity.roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- 7. SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(128),
    device_type VARCHAR(64),
    browser VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
);

-- ============================================================================
-- 8. PRODUCTS & USER PRODUCT ACCESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_key VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mexo_identity.user_products (
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES mexo_identity.products(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    first_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- ============================================================================
-- 9. USER GENERAL SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_identity.user_settings (
    user_id UUID PRIMARY KEY REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    language VARCHAR(16) NOT NULL DEFAULT 'en-US',
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    theme VARCHAR(16) NOT NULL DEFAULT 'SYSTEM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
