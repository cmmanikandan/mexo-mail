-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V15__mexo_mail_attachments_storage.sql
-- Description: Private Supabase Storage bucket for MEXO Mail attachments & RLS
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- 1. Create storage bucket mexo-mail-attachments if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mexo-mail-attachments',
  'mexo-mail-attachments',
  false,
  52428800, -- 50MB
  NULL
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage RLS policies for storage.objects
DROP POLICY IF EXISTS "Allow mexo mail attachments upload" ON storage.objects;
CREATE POLICY "Allow mexo mail attachments upload" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'mexo-mail-attachments');

DROP POLICY IF EXISTS "Allow mexo mail attachments read" ON storage.objects;
CREATE POLICY "Allow mexo mail attachments read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'mexo-mail-attachments');

DROP POLICY IF EXISTS "Allow mexo mail attachments delete" ON storage.objects;
CREATE POLICY "Allow mexo mail attachments delete" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'mexo-mail-attachments');

-- 3. Security Definer Helper Function to ensure bucket exists
CREATE OR REPLACE FUNCTION public.ensure_mexo_mail_storage_bucket()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('mexo-mail-attachments', 'mexo-mail-attachments', false, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_mexo_mail_storage_bucket TO anon, authenticated;
