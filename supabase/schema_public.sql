-- MEXO MAIL Public Schema Migration & Database Definition
-- Run this script in the Supabase SQL Editor for project `vnbixduiwsvepvtybygy`

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  primary_address TEXT UNIQUE NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'system_admin', 'admin', 'user'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  storage_limit_bytes BIGINT NOT NULL DEFAULT 16106127360, -- 15 GB
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sender_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_address TEXT NOT NULL,
  subject TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  body_text TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  client_message_id TEXT,
  message_type TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MESSAGE RECIPIENTS TABLE
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_address TEXT NOT NULL,
  recipient_type TEXT NOT NULL DEFAULT 'to', -- 'to', 'cc', 'bcc'
  delivery_status TEXT DEFAULT 'delivered',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGE STATES TABLE (Mailbox folder view per user)
CREATE TABLE IF NOT EXISTS public.message_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder TEXT NOT NULL DEFAULT 'inbox', -- 'inbox', 'sent', 'drafts', 'trash', 'archive', 'spam'
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  starred BOOLEAN NOT NULL DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT message_states_user_msg_folder_unique UNIQUE(message_id, user_id, folder)
);

-- 5. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  group_address TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  privacy TEXT DEFAULT 'private',
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GROUP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'manager', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT group_members_group_user_unique UNIQUE(group_id, user_id)
);

-- 7. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT DEFAULT '',
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  job_title TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LABELS TABLE
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0878e8',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DRAFTS TABLE
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_recipients TEXT[] DEFAULT '{}',
  cc_recipients TEXT[] DEFAULT '{}',
  bcc_recipients TEXT[] DEFAULT '{}',
  subject TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  last_saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  result TEXT DEFAULT 'success',
  ip_address TEXT DEFAULT '127.0.0.1'
);

-- 11. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_primary_address ON public.profiles(primary_address);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_sender_client_msg ON public.messages(sender_user_id, client_message_id) WHERE client_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_recipients_user ON public.message_recipients(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_message_states_user_folder ON public.message_states(user_id, folder, is_deleted);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON public.contacts(owner_user_id);

-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC ACCESS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES: Allow authenticated & anon full access for MEXO Client application
DROP POLICY IF EXISTS "Public Profiles Access" ON public.profiles;
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Messages Access" ON public.messages;
CREATE POLICY "Public Messages Access" ON public.messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Recipients Access" ON public.message_recipients;
CREATE POLICY "Public Recipients Access" ON public.message_recipients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public States Access" ON public.message_states;
CREATE POLICY "Public States Access" ON public.message_states FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Groups Access" ON public.groups;
CREATE POLICY "Public Groups Access" ON public.groups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Group Members Access" ON public.group_members;
CREATE POLICY "Public Group Members Access" ON public.group_members FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Contacts Access" ON public.contacts;
CREATE POLICY "Public Contacts Access" ON public.contacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Labels Access" ON public.labels;
CREATE POLICY "Public Labels Access" ON public.labels FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Drafts Access" ON public.drafts;
CREATE POLICY "Public Drafts Access" ON public.drafts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Audit Logs Access" ON public.audit_logs;
CREATE POLICY "Public Audit Logs Access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Settings Access" ON public.user_settings;
CREATE POLICY "Public Settings Access" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

-- 12. ATOMIC SEND MAIL TRANSACTION RPC
CREATE OR REPLACE FUNCTION public.send_mail_transaction(
  p_sender_id          UUID,
  p_sender_address     TEXT,
  p_recipients         TEXT[],
  p_subject            TEXT,
  p_body_html          TEXT,
  p_body_text          TEXT,
  p_client_message_id  TEXT DEFAULT NULL,
  p_draft_id           UUID DEFAULT NULL,
  p_attachments        JSONB DEFAULT '[]'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_sender_uuid        UUID;
  v_clean_sender       TEXT;
  v_message_id         UUID;
  v_thread_id          UUID;
  v_recip_raw          TEXT;
  v_norm_recip         TEXT;
  v_norm_handle        TEXT;
  v_recip_profile_id   UUID;
  v_recip_email        TEXT;
  v_recipient_user_ids UUID[] := '{}';
  v_recipient_emails   TEXT[] := '{}';
  v_existing_msg_id    UUID;
  v_group_id           UUID;
  v_group_member       RECORD;
BEGIN
  v_clean_sender := LOWER(TRIM(p_sender_address));

  IF p_sender_id IS NOT NULL THEN
    v_sender_uuid := p_sender_id;
  ELSE
    SELECT id INTO v_sender_uuid
    FROM public.profiles
    WHERE LOWER(primary_address) = v_clean_sender
       OR LOWER(username) = LOWER(SPLIT_PART(v_clean_sender, '@', 1))
    LIMIT 1;
  END IF;

  IF v_sender_uuid IS NULL THEN
    RAISE EXCEPTION 'Sender account not found for address %', p_sender_address;
  END IF;

  IF p_client_message_id IS NOT NULL AND LENGTH(TRIM(p_client_message_id)) > 0 THEN
    SELECT id INTO v_existing_msg_id
    FROM public.messages
    WHERE sender_user_id = v_sender_uuid
      AND client_message_id = TRIM(p_client_message_id)
    LIMIT 1;

    IF v_existing_msg_id IS NOT NULL THEN
      RETURN json_build_object(
        'success', true,
        'idempotent', true,
        'message_id', v_existing_msg_id
      );
    END IF;
  END IF;

  IF array_length(p_recipients, 1) IS NULL OR array_length(p_recipients, 1) = 0 THEN
    RAISE EXCEPTION 'At least one recipient is required';
  END IF;

  FOREACH v_recip_raw IN ARRAY p_recipients
  LOOP
    v_norm_recip := LOWER(TRIM(v_recip_raw));
    IF v_norm_recip NOT LIKE '%@%' THEN
      v_norm_recip := v_norm_recip || '@mexo.com';
    END IF;
    v_norm_handle := SPLIT_PART(v_norm_recip, '@', 1);

    v_recip_profile_id := NULL;
    v_recip_email := NULL;

    SELECT id, primary_address INTO v_recip_profile_id, v_recip_email
    FROM public.profiles
    WHERE LOWER(primary_address) = v_norm_recip
       OR LOWER(username) = v_norm_handle
    LIMIT 1;

    IF v_recip_profile_id IS NOT NULL THEN
      v_recipient_user_ids := array_append(v_recipient_user_ids, v_recip_profile_id);
      v_recipient_emails   := array_append(v_recipient_emails, v_recip_email);
    ELSE
      SELECT id, group_address INTO v_group_id, v_recip_email
      FROM public.groups
      WHERE LOWER(group_address) = v_norm_recip
         OR LOWER(slug) = v_norm_handle
      LIMIT 1;

      IF v_group_id IS NOT NULL THEN
        FOR v_group_member IN 
          SELECT gm.user_id, p.primary_address 
          FROM public.group_members gm
          JOIN public.profiles p ON gm.user_id = p.id
          WHERE gm.group_id = v_group_id
        LOOP
          v_recipient_user_ids := array_append(v_recipient_user_ids, v_group_member.user_id);
          v_recipient_emails   := array_append(v_recipient_emails, v_group_member.primary_address);
        END LOOP;
      ELSE
        RAISE EXCEPTION 'Recipient not found: %', v_recip_raw;
      END IF;
    END IF;
  END LOOP;

  v_message_id := gen_random_uuid();
  v_thread_id  := gen_random_uuid();

  INSERT INTO public.messages (
    id,
    thread_id,
    sender_user_id,
    sender_address,
    subject,
    body_html,
    body_text,
    attachments,
    client_message_id,
    status,
    sent_at,
    created_at
  ) VALUES (
    v_message_id,
    v_thread_id,
    v_sender_uuid,
    v_clean_sender,
    COALESCE(p_subject, '(No Subject)'),
    COALESCE(p_body_html, ''),
    COALESCE(p_body_text, ''),
    COALESCE(p_attachments, '[]'::jsonb),
    TRIM(p_client_message_id),
    'sent',
    NOW(),
    NOW()
  );

  FOR i IN 1..array_length(v_recipient_user_ids, 1)
  LOOP
    INSERT INTO public.message_recipients (
      message_id,
      recipient_user_id,
      recipient_address,
      recipient_type,
      delivery_status,
      created_at
    ) VALUES (
      v_message_id,
      v_recipient_user_ids[i],
      v_recipient_emails[i],
      'to',
      'delivered',
      NOW()
    );
  END LOOP;

  INSERT INTO public.message_states (
    message_id,
    user_id,
    folder,
    is_read,
    is_archived,
    is_deleted,
    is_spam,
    is_important,
    starred,
    updated_at
  ) VALUES (
    v_message_id,
    v_sender_uuid,
    'sent',
    TRUE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    FALSE,
    NOW()
  )
  ON CONFLICT (message_id, user_id, folder) DO UPDATE SET updated_at = NOW();

  FOR i IN 1..array_length(v_recipient_user_ids, 1)
  LOOP
    INSERT INTO public.message_states (
      message_id,
      user_id,
      folder,
      is_read,
      is_archived,
      is_deleted,
      is_spam,
      is_important,
      starred,
      updated_at
    ) VALUES (
      v_message_id,
      v_recipient_user_ids[i],
      'inbox',
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      NOW()
    )
    ON CONFLICT (message_id, user_id, folder) DO UPDATE SET updated_at = NOW();
  END LOOP;

  IF p_draft_id IS NOT NULL THEN
    DELETE FROM public.drafts WHERE id = p_draft_id AND owner_user_id = v_sender_uuid;
  END IF;

  DELETE FROM public.drafts 
  WHERE owner_user_id = v_sender_uuid 
    AND LOWER(TRIM(subject)) = LOWER(TRIM(p_subject))
    AND LOWER(TRIM(subject)) != '';

  RETURN json_build_object(
    'success',            true,
    'message_id',         v_message_id,
    'sender_user_id',     v_sender_uuid,
    'recipient_user_ids', v_recipient_user_ids,
    'recipient_emails',   v_recipient_emails
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_mail_transaction TO anon, authenticated;

