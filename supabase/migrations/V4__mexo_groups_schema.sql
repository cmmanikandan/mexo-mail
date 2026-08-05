-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V4__mexo_groups_schema.sql
-- Description: MEXO Groups distribution identity model & group memberships
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. GROUPS (Distribution Identity Model)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_groups.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    group_address CITEXT UNIQUE NOT NULL,
    description TEXT,
    avatar_object_id UUID REFERENCES mexo_storage.objects(id) ON DELETE SET NULL,
    privacy VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    join_policy VARCHAR(32) NOT NULL DEFAULT 'INVITE_ONLY',
    send_policy VARCHAR(32) NOT NULL DEFAULT 'MEMBERS_ONLY',
    member_visibility VARCHAR(32) NOT NULL DEFAULT 'MEMBERS_ONLY',
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_normalized_address ON mexo_groups.groups (LOWER(group_address));

-- ============================================================================
-- 2. GROUP MEMBERS (Local Group Roles: OWNER, MANAGER, MEMBER)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_groups.group_members (
    group_id UUID NOT NULL REFERENCES mexo_groups.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID REFERENCES mexo_identity.users(id),
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT check_group_role CHECK (role IN ('OWNER', 'MANAGER', 'MEMBER'))
);
