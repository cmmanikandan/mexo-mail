-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V3__mexo_storage_schema.sql
-- Description: Storage object metadata and deduplicated attachment references
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. STORAGE OBJECT METADATA
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_storage.objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id),
    bucket VARCHAR(64) NOT NULL,
    object_path VARCHAR(500) NOT NULL UNIQUE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(128),
    scan_status VARCHAR(32) NOT NULL DEFAULT 'PASSED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_storage_owner_bucket ON mexo_storage.objects(owner_user_id, bucket);
CREATE INDEX IF NOT EXISTS idx_storage_checksum ON mexo_storage.objects(checksum);

-- ============================================================================
-- 2. ATTACHMENT REFERENCES (Deduplicated Attachment Pointer Architecture)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.attachment_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attachment_object_id UUID NOT NULL REFERENCES mexo_storage.objects(id) ON DELETE CASCADE,
    message_id UUID REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES mexo_mail.drafts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_attachment_parent CHECK (
        (message_id IS NOT NULL AND draft_id IS NULL) OR
        (message_id IS NULL AND draft_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_attachment_message ON mexo_mail.attachment_references(message_id);
CREATE INDEX IF NOT EXISTS idx_attachment_draft ON mexo_mail.attachment_references(draft_id);
