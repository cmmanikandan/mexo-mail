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
  CONSTRAINT message_states_user_msg_unique UNIQUE(message_id, user_id)
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
CREATE POLICY "Public Profiles Access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Messages Access" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Recipients Access" ON public.message_recipients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public States Access" ON public.message_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Groups Access" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Group Members Access" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Contacts Access" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Labels Access" ON public.labels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Drafts Access" ON public.drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Audit Logs Access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Settings Access" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);
