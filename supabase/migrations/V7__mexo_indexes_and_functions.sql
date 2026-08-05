-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V7__mexo_indexes_and_functions.sql
-- Description: Composite performance indexes, full-text search & group dispatch functions
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- ============================================================================
-- 1. PERFORMANCE INDEXES FOR MAILBOX QUERIES
-- ============================================================================
-- Fast inbox fetch & cursor pagination index
CREATE INDEX IF NOT EXISTS idx_message_states_user_folder_created 
ON mexo_mail.message_states (user_id, folder, is_deleted, updated_at DESC);

-- Fast message recipient lookup index
CREATE INDEX IF NOT EXISTS idx_message_recipients_user_message 
ON mexo_mail.message_recipients (recipient_user_id, message_id);

-- Sender lookup index
CREATE INDEX IF NOT EXISTS idx_messages_sender_created 
ON mexo_mail.messages (sender_user_id, created_at DESC);

-- Thread lookup index
CREATE INDEX IF NOT EXISTS idx_messages_thread_sent 
ON mexo_mail.messages (thread_id, sent_at ASC);

-- Full Text Search Index on Subject and Text Body
CREATE INDEX IF NOT EXISTS idx_messages_fts 
ON mexo_mail.messages USING gin(to_tsvector('english', subject || ' ' || body_text));

-- ============================================================================
-- 2. AUTOMATIC UPDATED_AT TRIGGER FUNCTION (Idempotent)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop Triggers If Exists Before Creation
DROP TRIGGER IF EXISTS update_users_updated_at ON mexo_identity.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON mexo_identity.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON mexo_identity.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON mexo_identity.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_threads_updated_at ON mexo_mail.threads;
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON mexo_mail.threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON mexo_groups.groups;
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON mexo_groups.groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. STORED FUNCTION: DISPATCH GROUP MESSAGE (Idempotent)
-- ============================================================================
CREATE OR REPLACE FUNCTION mexo_groups.dispatch_group_message(
    p_message_id UUID,
    p_group_address CITEXT
) RETURNS INT AS $$
DECLARE
    v_group_id UUID;
    v_member RECORD;
    v_count INT := 0;
BEGIN
    SELECT id INTO v_group_id FROM mexo_groups.groups WHERE LOWER(group_address) = LOWER(p_group_address);
    IF v_group_id IS NULL THEN
        RAISE EXCEPTION 'Group address % not found', p_group_address;
    END IF;

    FOR v_member IN 
        SELECT user_id FROM mexo_groups.group_members WHERE group_id = v_group_id AND status = 'ACTIVE'
    LOOP
        INSERT INTO mexo_mail.message_recipients (message_id, recipient_user_id, recipient_address, recipient_type, delivery_status)
        SELECT p_message_id, v_member.user_id, u.primary_address, 'TO', 'DELIVERED'
        FROM mexo_identity.users u WHERE u.id = v_member.user_id;

        INSERT INTO mexo_mail.message_states (message_id, user_id, folder, is_read)
        VALUES (p_message_id, v_member.user_id, 'inbox', FALSE)
        ON CONFLICT (message_id, user_id) DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
