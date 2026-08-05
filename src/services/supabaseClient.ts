import { createClient } from '@supabase/supabase-js';

const meta = import.meta as { env?: Record<string, string> };

const supabaseUrl = meta.env?.VITE_SUPABASE_URL || 'https://vnbixduiwsvepvtybygy.supabase.co';
const supabaseAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_i8Axi6FQTIKNHQUiYWaHKw_PUVgNo6H';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const SUPABASE_PROJECT_REF = meta.env?.VITE_SUPABASE_PROJECT_REF || 'vnbixduiwsvepvtybygy';
