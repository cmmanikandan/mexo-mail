-- V10: Send Mail Transaction & Idempotency Indexes
-- Creates an atomic SECURITY DEFINER function to execute mail delivery in one transaction.

-- 1. Ensure client_message_id column exists on messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS client_message_id TEXT;

-- 2. Create unique index for idempotency on (sender_user_id, client_message_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_sender_client_msg 
  ON public.messages(sender_user_id, client_message_id) 
  WHERE client_message_id IS NOT NULL;

-- 3. Ensure unique constraint on message_states for (message_id, user_id, folder)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'message_states_user_msg_folder_unique'
  ) THEN
    ALTER TABLE public.message_states 
      ADD CONSTRAINT message_states_user_msg_folder_unique 
      UNIQUE (message_id, user_id, folder);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Atomic Send Mail Transaction RPC
CREATE OR REPLACE FUNCTION public.send_mail_transaction(
  p_sender_id          UUID,
  p_sender_address     TEXT,
  p_recipients         TEXT[],
  p_subject            TEXT,
  p_body_html          TEXT,
  p_body_text          TEXT,
  p_client_message_id  TEXT DEFAULT NULL,
  p_draft_id           UUID DEFAULT NULL
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
  -- Normalize sender address
  v_clean_sender := LOWER(TRIM(p_sender_address));

  -- 1. Resolve Sender Profile UUID
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

  -- 2. Idempotency Check: if client_message_id exists for this sender, return existing
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

  -- 3. Resolve & Validate ALL Recipients BEFORE inserting
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

    -- Lookup user profile
    SELECT id, primary_address INTO v_recip_profile_id, v_recip_email
    FROM public.profiles
    WHERE LOWER(primary_address) = v_norm_recip
       OR LOWER(username) = v_norm_handle
    LIMIT 1;

    IF v_recip_profile_id IS NOT NULL THEN
      v_recipient_user_ids := array_append(v_recipient_user_ids, v_recip_profile_id);
      v_recipient_emails   := array_append(v_recipient_emails, v_recip_email);
    ELSE
      -- Lookup group
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

  -- 4. Create Master Message
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
    TRIM(p_client_message_id),
    'sent',
    NOW(),
    NOW()
  );

  -- 5. Insert Message Recipients Entries
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

  -- 6. Insert Sender Mailbox State (SENT folder)
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

  -- 7. Insert Recipient Mailbox States (INBOX folder)
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

  -- 8. Delete Source Draft
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
