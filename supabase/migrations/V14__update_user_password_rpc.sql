-- V14: Update User Password RPC
-- Allows updating auth.users encrypted_password for the currently authenticated user
-- Uses SECURITY DEFINER to run as DB owner and update auth.users directly
-- auth.uid() returns the JWT user ID, so only authenticated users can update their own password

CREATE OR REPLACE FUNCTION public.update_user_password(
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS \$\$
DECLARE
  v_user_id     UUID;
  v_encrypted   TEXT;
BEGIN
  -- 1. Get the current authenticated user ID from JWT
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Not authenticated'
    );
  END IF;

  -- 2. Validate password length
  IF length(p_new_password) < 8 THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Password must be at least 8 characters'
    );
  END IF;

  -- 3. Encrypt the password using bcrypt
  BEGIN
    v_encrypted := crypt(p_new_password, gen_salt('bf'));
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Failed to encrypt password: ' || SQLERRM
    );
  END;

  -- 4. Update auth.users encrypted_password for this user
  UPDATE auth.users
  SET
    encrypted_password  = v_encrypted,
    updated_at          = NOW(),
    password_changed_at = NOW()
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error',   'User not found in auth system'
    );
  END IF;

  -- 5. Update profile timestamp
  UPDATE public.profiles
  SET updated_at = NOW()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'action',  'password_updated'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error',   SQLERRM
  );
END;
\$\$;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION public.update_user_password TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_password FROM anon;
