import { supabase } from './supabaseClient';
import { MexoUser } from '../types/user';

export const mexoPlatformAuth = {
  /** Validate active Supabase auth session */
  async validateSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return session;
  },

  /** Reusable session verification and recovery function */
  async ensureAuthenticatedSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (data?.session) {
      return data.session;
    }

    // Attempt refresh/recovery if session expired or transiently missing
    const refreshResult = await supabase.auth.refreshSession();
    if (refreshResult.error || !refreshResult.data?.session) {
      throw new Error('SESSION_EXPIRED');
    }

    return refreshResult.data.session;
  },

  /** Retrieve central MEXO Account profile by User ID */
  async getCurrentProfile(userId: string): Promise<MexoUser | null> {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !profile) return null;

    return {
      id: profile.id,
      email: profile.primary_address || '',
      username: profile.username || '',
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      avatarUrl: profile.avatar_url || undefined,
      recoveryEmail: profile.recovery_email || undefined,
      dob: profile.dob || undefined,
      gender: profile.gender || undefined,
      role: profile.role || 'user',
      status: 'active',
      lastActiveAt: new Date().toISOString(),
      twoFactorEnabled: false,
      storageUsedBytes: profile.storage_used_bytes || 0,
      storageLimitBytes: profile.storage_limit_bytes || 16106127360,
      createdAt: profile.created_at || new Date().toISOString(),
    };
  },

  /** Sign out from current MEXO Account */
  async signOut() {
    await supabase.auth.signOut();
  },
};
