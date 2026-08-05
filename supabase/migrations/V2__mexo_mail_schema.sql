-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V2__mexo_mail_schema.sql
-- Description: Creates MEXO Mail relational schema (messages, recipients, states)
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. THREADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_normalized VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. MESSAGES (Single Message Store Model)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES mexo_mail.threads(id) ON DELETE CASCADE,
    sender_user_id UUID NOT NULL REFERENCES mexo_identity.users(id),
    sender_address VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    message_type VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- STANDARD, GROUP_DISTRIBUTION, SYSTEM_ALERT
    reply_to_message_id UUID REFERENCES mexo_mail.messages(id),
    status VARCHAR(32) NOT NULL DEFAULT 'SENT', -- SENT, SCHEDULED, DRAFT
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. MESSAGE RECIPIENTS (Normalized Recipient Delivery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.message_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES mexo_identity.users(id),
    recipient_address VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(8) NOT NULL, -- TO, CC, BCC
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'DELIVERED', -- DELIVERED, PENDING, FAILED
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_recipient_type CHECK (recipient_type IN ('TO', 'CC', 'BCC'))
);

-- ============================================================================
-- 4. RECIPIENT-SPECIFIC MAIL STATE (Independent Mailbox View)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.message_states (
    message_id UUID NOT NULL REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    folder VARCHAR(32) NOT NULL DEFAULT 'inbox', -- inbox, sent, draft, trash, spam, archive
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- ============================================================================
-- 5. STARS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.stars (
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

-- ============================================================================
-- 6. DRAFTS & DRAFT RECIPIENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    thread_id UUID REFERENCES mexo_mail.threads(id) ON DELETE SET NULL,
    subject VARCHAR(500) DEFAULT '',
    body_html TEXT DEFAULT '',
    body_text TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mexo_mail.draft_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES mexo_mail.drafts(id) ON DELETE CASCADE,
    recipient_reference VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(8) NOT NULL, -- TO, CC, BCC
    CONSTRAINT check_draft_recipient_type CHECK (recipient_type IN ('TO', 'CC', 'BCC'))
);

-- ============================================================================
-- 7. SCHEDULED MAIL
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    draft_id UUID NOT NULL REFERENCES mexo_mail.drafts(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, PROCESSING, SENT, CANCELLED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- ============================================================================
-- 8. SNOOZES
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.snoozes (
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    snoozed_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, message_id)
);

-- ============================================================================
-- 9. LABELS & MESSAGE LABELS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    parent_label_id UUID REFERENCES mexo_mail.labels(id) ON DELETE CASCADE,
    color VARCHAR(32) DEFAULT '#0878e8',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_owner_label_name UNIQUE (owner_user_id, name)
);

CREATE TABLE IF NOT EXISTS mexo_mail.message_labels (
    message_id UUID NOT NULL REFERENCES mexo_mail.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES mexo_mail.labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id, label_id)
);

-- ============================================================================
-- 10. FILTERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. SIGNATURES & BLOCKED SENDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    content_html TEXT NOT NULL,
    is_default_new BOOLEAN NOT NULL DEFAULT FALSE,
    is_default_reply BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mexo_mail.blocked_senders (
    owner_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_user_id, blocked_user_id)
);

-- ============================================================================
-- 12. MAIL SPECIFIC SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mexo_mail.mail_settings (
    user_id UUID PRIMARY KEY REFERENCES mexo_identity.users(id) ON DELETE CASCADE,
    conversation_view BOOLEAN NOT NULL DEFAULT TRUE,
    inbox_density VARCHAR(16) NOT NULL DEFAULT 'DEFAULT', -- COMPACT, DEFAULT, COMFORTABLE
    reading_pane VARCHAR(16) NOT NULL DEFAULT 'RIGHT', -- OFF, RIGHT, BOTTOM
    undo_send_seconds INT NOT NULL DEFAULT 10,
    default_reply_behavior VARCHAR(16) NOT NULL DEFAULT 'REPLY', -- REPLY, REPLY_ALL
    keyboard_shortcuts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    vacation_responder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    vacation_subject VARCHAR(255),
    vacation_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
