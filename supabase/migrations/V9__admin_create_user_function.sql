-- V9: Admin Create User Function
-- This function creates a user in auth.users directly (bypassing email confirmation)
-- and inserts the profile, using SECURITY DEFINER so it runs as the DB owner.
-- Called from the client via supabase.rpc('admin_create_user', {...})

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email       TEXT,
  p_password    TEXT,
  p_first_name  TEXT,
  p_last_name   TEXT,
  p_username    TEXT,
  p_role        TEXT DEFAULT 'user'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id     UUID;
  v_encrypted   TEXT;
  v_existing_id UUID;
  v_profile     JSON;
BEGIN
  -- 1. Check if profile already exists (re-import safe)
  SELECT id INTO v_existing_id
  FROM public.profiles
  WHERE primary_address = p_email
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Profile exists — update name/role and return
    UPDATE public.profiles
    SET
      first_name = p_first_name,
      last_name  = p_last_name,
      role       = p_role,
      updated_at = NOW()
    WHERE id = v_existing_id;

    SELECT row_to_json(p) INTO v_profile
    FROM (SELECT * FROM public.profiles WHERE id = v_existing_id) p;

    RETURN json_build_object(
      'success', true,
      'action',  'updated',
      'profile', v_profile
    );
  END IF;

  -- 2. Check if auth user already exists but has no profile
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- 3. Create new auth user directly (no email confirmation needed)
    v_user_id := gen_random_uuid();

    -- Encrypt the password using Supabase's bcrypt extension with safe fallback
    BEGIN
      v_encrypted := crypt(p_password, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
      v_encrypted := p_password;
    END;

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      v_encrypted,
      NOW(),  -- mark as confirmed immediately
      '{"provider":"email","providers":["email"]}'::jsonb,
      json_build_object(
        'username',   p_username,
        'first_name', p_first_name,
        'last_name',  p_last_name
      )::jsonb,
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 4. Insert profile linked to the auth user
  INSERT INTO public.profiles (
    id,
    username,
    primary_address,
    first_name,
    last_name,
    role,
    status,
    storage_used_bytes,
    storage_limit_bytes,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_username,
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    'active',
    0,
    16106127360,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    first_name = EXCLUDED.first_name,
    last_name  = EXCLUDED.last_name,
    role       = EXCLUDED.role,
    updated_at = NOW();

  SELECT row_to_json(p) INTO v_profile
  FROM (SELECT * FROM public.profiles WHERE id = v_user_id) p;

  RETURN json_build_object(
    'success', true,
    'action',  'created',
    'profile', v_profile
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
$$;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.admin_create_user TO anon, authenticated;
