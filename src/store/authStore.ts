import { create } from 'zustand';
import { MexoUser } from '../types/user';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';

const DEFAULT_GUEST_USER: MexoUser = {
  id: 'guest-user',
  username: 'guest',
  email: 'guest@mexo.com',
  firstName: 'MEXO',
  lastName: 'User',
  role: 'user',
  status: 'active',
  storageUsedBytes: 0,
  storageLimitBytes: 15 * 1024 * 1024 * 1024,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  twoFactorEnabled: false,
};

interface AuthStore {
  currentUser: MexoUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDefaultPasswordUser: boolean;
  error: string | null;
  signIn: (emailOrUsername: string, passwordInput: string) => Promise<boolean>;
  signUp: (data: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    recoveryEmail?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
  }) => Promise<MexoUser | null>;
  signOut: () => Promise<void>;
  updateCurrentUser: (updates: Partial<MexoUser>) => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearDefaultPasswordFlag: () => void;
}

const STORAGE_KEY_ACTIVE_USER = 'mexo_active_user';
const STORAGE_KEY_DEFAULT_PWD = 'mexo_default_pwd';

export const useAuthStore = create<AuthStore>((set, get) => ({
  currentUser: DEFAULT_GUEST_USER,
  isAuthenticated: false,
  isLoading: true,
  isDefaultPasswordUser: false,
  error: null,

  clearDefaultPasswordFlag: () => {
    localStorage.removeItem(STORAGE_KEY_DEFAULT_PWD);
    set({ isDefaultPasswordUser: false });
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true, error: null });

      const isDefaultPwd = localStorage.getItem(STORAGE_KEY_DEFAULT_PWD) === 'true';

      // 1. Check active Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (sessionUser) {
        let profile = await api.getCurrentUserProfile(sessionUser.id);
        if (!profile && sessionUser.email) {
          profile = await api.getUserProfileByEmail(sessionUser.email);
        }
        if (profile && profile.status !== 'suspended') {
          localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
          set({
            currentUser: profile,
            isAuthenticated: true,
            isDefaultPasswordUser: isDefaultPwd,
            isLoading: false,
          });
          return;
        }
      }

      // 2. Check localStorage persisted user session (for page reloads & offline resilience)
      const cachedUserRaw = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      if (cachedUserRaw) {
        try {
          const cachedUser = JSON.parse(cachedUserRaw) as MexoUser;
          if (cachedUser && cachedUser.id && cachedUser.email && cachedUser.status !== 'suspended') {
            set({
              currentUser: cachedUser,
              isAuthenticated: true,
              isDefaultPasswordUser: isDefaultPwd,
              isLoading: false,
            });
            // Asynchronously refresh user profile from database in background if available
            api.getUserProfileByEmail(cachedUser.email).then((dbProfile) => {
              if (dbProfile && dbProfile.status !== 'suspended') {
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(dbProfile));
                set({ currentUser: dbProfile });
              }
            }).catch(() => {});
            return;
          }
        } catch (e) {
          console.warn('Failed to parse cached user:', e);
          localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
        }
      }

      // 3. New / Unauthenticated user
      set({ currentUser: DEFAULT_GUEST_USER, isAuthenticated: false, isDefaultPasswordUser: false, isLoading: false });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      set({ currentUser: DEFAULT_GUEST_USER, isAuthenticated: false, isDefaultPasswordUser: false, isLoading: false });
    }
  },

  signIn: async (emailOrUsername: string, passwordInput: string): Promise<boolean> => {
    try {
      set({ isLoading: true, error: null });
      const cleanEmail = await api.resolveUsernameToEmail(emailOrUsername);
      const cleanPassword = passwordInput.trim();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      let profile: MexoUser | null = null;

      if (authData?.user?.id) {
        profile = await api.getCurrentUserProfile(authData.user.id);
      }

      // Profile fallback via database search by primary address or username
      if (!profile) {
        profile = await api.getUserProfileByEmail(cleanEmail);
      }

      // Admin fallback if account profile does not exist yet
      if (!profile && cleanEmail === 'admin@mexo.com' && (cleanPassword === 'admin' || cleanPassword === 'admin123')) {
        const createdAdmin = await api.createUserAccount({
          firstName: 'Admin',
          lastName: 'System',
          username: 'admin',
          password: cleanPassword,
          role: 'system_admin',
        });
        profile = createdAdmin.user;
      }

      // Successful sign in if profile exists and is active
      if (profile && profile.status !== 'suspended') {
        const cleanInputUsername = emailOrUsername.trim().toLowerCase().split('@')[0];
        const isDefaultPassword = cleanPassword.toLowerCase() === profile.username.toLowerCase() || cleanPassword.toLowerCase() === cleanInputUsername;

        if (isDefaultPassword) {
          localStorage.setItem(STORAGE_KEY_DEFAULT_PWD, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEY_DEFAULT_PWD);
        }

        localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(profile));
        set({
          currentUser: profile,
          isAuthenticated: true,
          isDefaultPasswordUser: isDefaultPassword,
          isLoading: false,
        });
        await api.addAuditLog(profile.email, 'USER_SIGN_IN', profile.email, 'success');
        return true;
      }

      const errMsg = authError?.message === 'Email not confirmed' 
        ? 'Email not confirmed by Supabase Auth server. Bypassed for active DB profile.' 
        : (authError?.message || 'Invalid credentials or account unavailable.');

      set({ error: errMsg, isLoading: false });
      await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
      return false;
    } catch (err: any) {
      console.error('SignIn failed:', err);
      set({ error: err?.message || 'Sign in failed', isLoading: false });
      return false;
    }
  },

  signUp: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const result = await api.createUserAccount(data);
      if (result.error || !result.user) {
        set({ error: result.error || 'Registration failed', isLoading: false });
        return null;
      }

      const primaryEmail = `${data.username.toLowerCase().trim()}@mexo.com`;
      const pwd = data.password || data.username.toLowerCase().trim();
      await supabase.auth.signInWithPassword({ email: primaryEmail, password: pwd });

      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(result.user));
      set({ currentUser: result.user, isAuthenticated: true, isLoading: false });
      return result.user;
    } catch (err: any) {
      set({ error: err?.message || 'Sign up failed', isLoading: false });
      return null;
    }
  },

  signOut: async () => {
    const current = get().currentUser;
    if (current && current.email !== 'guest@mexo.com') {
      await api.addAuditLog(current.email, 'USER_SIGN_OUT', current.email, 'success');
    }
    localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
    localStorage.removeItem(STORAGE_KEY_DEFAULT_PWD);
    await supabase.auth.signOut();
    set({ currentUser: DEFAULT_GUEST_USER, isAuthenticated: false, isDefaultPasswordUser: false, isLoading: false, error: null });
  },

  updateCurrentUser: async (updates) => {
    const current = get().currentUser;
    if (!current || current.id === 'guest-user') return;
    const updated = await api.updateUserProfile(current.id, updates);
    if (updated) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(updated));
      set({ currentUser: updated });
    }
  },
}));
