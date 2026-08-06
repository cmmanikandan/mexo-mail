-- V12__phase2_smart_features.sql
-- Add Phase 2 columns to message_states and messages tables

ALTER TABLE public.message_states
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'primary';

CREATE INDEX IF NOT EXISTS idx_message_states_pinned ON public.message_states(user_id, is_pinned);
CREATE INDEX IF NOT EXISTS idx_messages_scheduled_at ON public.messages(scheduled_at);

-- User settings table for signatures, vacation responder, rules
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  signature TEXT DEFAULT '',
  enable_signature_on_reply BOOLEAN DEFAULT FALSE,
  enable_vacation_responder BOOLEAN DEFAULT FALSE,
  vacation_subject TEXT DEFAULT '',
  vacation_message TEXT DEFAULT '',
  vacation_start_date TIMESTAMPTZ,
  vacation_end_date TIMESTAMPTZ,
  smart_categories_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
