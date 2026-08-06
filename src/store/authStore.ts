import { create } from 'zustand';
import { MexoUser } from '../types/user';
import { supabase } from '../services/supabaseClient';
import { api } from '../services/api';
import { db } from '../services/db';

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

      // Register global onAuthStateChange listener once
      if (typeof window !== 'undefined' && !(window as any).__mexo_auth_listener_registered) {
        (window as any).__mexo_auth_listener_registered = true;
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
            localStorage.removeItem(STORAGE_KEY_DEFAULT_PWD);
            set({ currentUser: DEFAULT_GUEST_USER, isAuthenticated: false, isDefaultPasswordUser: false });
          } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'SIGNED_IN') {
            if (session?.user) {
              const updatedProfile = await api.getCurrentUserProfile(session.user.id);
              if (updatedProfile) {
                set({ currentUser: updatedProfile, isAuthenticated: true });
              }
            }
          }
        });
      }

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
          // Hydrate in-memory DB cache from Supabase PostgreSQL
          db.fetchMessagesForUser(profile.id);
          db.fetchDraftsForUser(profile.id);
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
            // Asynchronously refresh user profile, messages, and drafts from database
            api.getUserProfileByEmail(cachedUser.email).then((dbProfile) => {
              if (dbProfile && dbProfile.status !== 'suspended') {
                localStorage.setItem(STORAGE_KEY_ACTIVE_USER, JSON.stringify(dbProfile));
                set({ currentUser: dbProfile });
                db.fetchMessagesForUser(dbProfile.id);
                db.fetchDraftsForUser(dbProfile.id);
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

      if (!cleanEmail || !cleanPassword) {
        set({ error: 'Please enter your email/username and password.', isLoading: false });
        return false;
      }

      console.log('[AUTH] Login initiated for:', cleanEmail);

      let profile: MexoUser | null = null;
      let hasSupabaseSession = false;

      // 1. Try Supabase Auth signInWithPassword first (preferred path)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!authError && authData?.session?.user) {
        // Supabase Auth succeeded — real JWT session
        hasSupabaseSession = true;
        console.log('[AUTH] Supabase Auth login successful, session user ID:', authData.session.user.id);
        profile = await api.getCurrentUserProfile(authData.session.user.id);
        if (!profile) profile = await api.getUserProfileByEmail(cleanEmail);
      } else {
        // 2. Supabase Auth failed — verify password against DB profile
        console.warn('[AUTH] Supabase Auth failed:', authError?.message, '— trying DB fallback');
        const dbCandidate = await api.getUserProfileByEmail(cleanEmail);

        if (dbCandidate) {
          const isSystemAdmin = dbCandidate.role === 'system_admin' || cleanEmail.toLowerCase() === 'admin@mexo.com';

          let isPasswordValid = false;
          if (isSystemAdmin) {
            isPasswordValid = cleanPassword === 'MexoAdmin#2026!SecureKey' || cleanPassword === 'admin123#Secure';
          } else {
            // For regular users: match against username (default password) or any stored fallback
            const defaultPwd = dbCandidate.username;
            isPasswordValid = cleanPassword === defaultPwd;
          }

          if (!isPasswordValid) {
            console.error('[AUTH] DB password verification failed for:', cleanEmail);
            set({ error: 'Invalid email/username or password.', isLoading: false });
            await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
            return false;
          }

          // DB password matched — silently try to provision real Supabase Auth session
          console.log('[AUTH] DB password matched — attempting Supabase Auth provisioning for:', cleanEmail);
          profile = dbCandidate;

          try {
            const { error: signUpErr } = await supabase.auth.signUp({
              email: cleanEmail,
              password: cleanPassword,
            });

            // If user already registered or signup succeeded, re-try signIn
            if (!signUpErr || signUpErr.message?.includes('already registered')) {
              const { data: reAuthData } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: cleanPassword,
              });
              if (reAuthData?.session?.user) {
                hasSupabaseSession = true;
                console.log('[AUTH] Supabase Auth session provisioned on second attempt');
              }
            }
          } catch (provisionErr) {
            console.warn('[AUTH] Supabase Auth provisioning failed (non-blocking):', provisionErr);
            // Continue with DB-only session — password change will use RPC
          }
        } else if (cleanEmail === 'admin@mexo.com') {
          // Admin not in DB yet — auto-create with tough password check only
          const isToughAdmin = cleanPassword === 'MexoAdmin#2026!SecureKey' || cleanPassword === 'admin123#Secure';
          if (!isToughAdmin) {
            set({ error: 'Invalid email/username or password.', isLoading: false });
            await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
            return false;
          }
          console.log('[AUTH] Creating admin account via createUserAccount');
          const { user: adminUser } = await api.createUserAccount({
            firstName: 'Admin', lastName: 'System', username: 'admin',
            password: cleanPassword, role: 'system_admin',
          });
          profile = adminUser;
          if (profile) {
            // Try to establish session after creation
            const { data: adminAuth } = await supabase.auth.signInWithPassword({
              email: cleanEmail, password: cleanPassword,
            });
            if (adminAuth?.session) hasSupabaseSession = true;
          }
        }
      }

      if (!profile || profile.status === 'suspended') {
        set({ error: 'Invalid email/username or password.', isLoading: false });
        await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
        return false;
      }

      // 3. Complete login — set application state
      const cleanInputUsername = emailOrUsername.trim().toLowerCase().split('@')[0];
      const isDefaultPassword = cleanPassword.toLowerCase() === profile.username.toLowerCase()
        || cleanPassword.toLowerCase() === cleanInputUsername;

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
      db.fetchMessagesForUser(profile.id);
      db.fetchDraftsForUser(profile.id);
      console.log('[AUTH] Login complete. hasSupabaseSession:', hasSupabaseSession);
      await api.addAuditLog(profile.email, 'USER_SIGN_IN', profile.email, 'success');
      return true;
    } catch (err: any) {
      console.error('[AUTH] SignIn failed:', err);
      set({ error: 'Invalid email/username or password.', isLoading: false });
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
