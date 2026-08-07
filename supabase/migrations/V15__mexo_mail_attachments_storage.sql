-- ============================================================================
-- MEXO ECOSYSTEM MASTER DATABASE ARCHITECTURE
-- Migration: V15__mexo_mail_attachments_storage.sql
-- Description: Storage buckets (mail-attachments & mexo-mail-attachments) & RLS Policies
-- Engine: Supabase PostgreSQL (Idempotent)
-- ============================================================================

-- 1. Create storage buckets mail-attachments & mexo-mail-attachments if not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('mail-attachments', 'mail-attachments', false, 52428800, NULL),
  ('mexo-mail-attachments', 'mexo-mail-attachments', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Storage RLS policies for storage.objects
DROP POLICY IF EXISTS "Allow mail attachments upload" ON storage.objects;
CREATE POLICY "Allow mail attachments upload" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id IN ('mail-attachments', 'mexo-mail-attachments'));

DROP POLICY IF EXISTS "Allow mail attachments read" ON storage.objects;
CREATE POLICY "Allow mail attachments read" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('mail-attachments', 'mexo-mail-attachments'));

DROP POLICY IF EXISTS "Allow mail attachments delete" ON storage.objects;
CREATE POLICY "Allow mail attachments delete" ON storage.objects
FOR DELETE TO public
USING (bucket_id IN ('mail-attachments', 'mexo-mail-attachments'));

-- 3. Security Definer Helper Function to create bucket programmatically
CREATE OR REPLACE FUNCTION public.ensure_mexo_mail_storage_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES 
    ('mail-attachments', 'mail-attachments', false, 52428800),
    ('mexo-mail-attachments', 'mexo-mail-attachments', false, 52428800)
  ON CONFLICT (id) DO UPDATE SET public = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_mexo_mail_storage_buckets TO anon, authenticated;
