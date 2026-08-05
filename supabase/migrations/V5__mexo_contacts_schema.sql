-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V5__mexo_contacts_schema.sql
-- Description: User contact book and relational contact groups
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. CONTACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_contacts.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    linked_mexo_user_id UUID REFERENCES mexo_identity.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    display_name VARCHAR(200) NOT NULL,
    email CITEXT NOT NULL,
    phone VARCHAR(32),
    organization VARCHAR(128),
    job_title VARCHAR(128),
    notes TEXT,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON mexo_contacts.contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON mexo_contacts.contacts(owner_user_id, email);

-- ============================================================================
-- 2. CONTACT GROUPS & MEMBERSHIP
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_contacts.contact_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_owner_contact_group UNIQUE (owner_user_id, name)
);

CREATE TABLE IF NOT EXISTS mexo_contacts.contact_group_members (
    contact_group_id UUID NOT NULL REFERENCES mexo_contacts.contact_groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES mexo_contacts.contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contact_group_id, contact_id)
);
