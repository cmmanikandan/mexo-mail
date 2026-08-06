-- V13__mexo_ecosystem_accounts.sql
-- Prepare MEXO Account system for multi-product ecosystem (MEXO Mail + MEXO Forms)

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS app_name VARCHAR(64) DEFAULT 'mexo_mail';

-- Ensure public.profiles table policies support cross-application platform reads for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view public profiles across MEXO Ecosystem'
  ) THEN
    CREATE POLICY "Authenticated users can view public profiles across MEXO Ecosystem"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
