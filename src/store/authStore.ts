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
      let sessionUser: any = null;

      // 1. Try Supabase Auth authentication first
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      // 2. If Supabase Auth fails (user account not registered in Auth server yet), verify candidate profile & auto-register in Supabase Auth
      if (authError || !authData?.session) {
        console.warn('[AUTH] Primary Supabase signInWithPassword status:', authError?.message);

        const dbCandidate = await api.getUserProfileByEmail(cleanEmail);
        if (dbCandidate) {
          const isSystemAdmin = dbCandidate.role === 'system_admin' || cleanEmail.toLowerCase() === 'admin@mexo.com';
          const expectedPassword = isSystemAdmin
            ? 'MexoAdmin#2026!SecureKey'
            : (dbCandidate.password || dbCandidate.username);

          const isPasswordValid = isSystemAdmin
            ? (cleanPassword === 'MexoAdmin#2026!SecureKey' || cleanPassword === 'admin123#Secure')
            : (cleanPassword === expectedPassword || cleanPassword === dbCandidate.username);

          if (!isPasswordValid) {
            console.error('[AUTH] Password verification failed for:', cleanEmail);
            set({ error: 'Invalid email/username or password.', isLoading: false });
            await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
            return false;
          }

          // Password matched! Register/auto-provision real Supabase Auth user identity
          console.log('[AUTH] Provisioning Supabase Auth user session for:', cleanEmail);
          const { error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
          });

          if (!signUpErr || signUpErr.message.includes('already registered')) {
            const { data: reAuthData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: cleanPassword,
            });
            if (reAuthData?.session) {
              authData = reAuthData;
            }
          }
        }
      }

      // 3. Admin auto-creation fallback with tough password ONLY
      if ((!authData?.session) && cleanEmail === 'admin@mexo.com') {
        const isToughAdminMatch = cleanPassword === 'MexoAdmin#2026!SecureKey' || cleanPassword === 'admin123#Secure';
        if (isToughAdminMatch) {
          await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword });
          const { data: adminAuthData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });
          if (adminAuthData?.session) {
            authData = adminAuthData;
          }
          const createdAdmin = await api.createUserAccount({
            firstName: 'Admin',
            lastName: 'System',
            username: 'admin',
            password: cleanPassword,
            role: 'system_admin',
          });
          profile = createdAdmin.user;
        }
      }

      // 4. Verify real Supabase Auth session exists
      const { data: sessionRes } = await supabase.auth.getSession();
      const currentSession = sessionRes?.session || authData?.session;

      if (!currentSession?.user) {
        console.error('[AUTH] Login failed: No valid Supabase Auth session established.');
        set({ error: 'Invalid email/username or password.', isLoading: false });
        await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
        return false;
      }

      sessionUser = currentSession.user;
      console.log('[AUTH] Login successful! Session exists: true | Auth user ID:', sessionUser.id);

      // 5. Retrieve user profile
      if (!profile) {
        profile = await api.getCurrentUserProfile(sessionUser.id);
      }
      if (!profile && sessionUser.email) {
        profile = await api.getUserProfileByEmail(sessionUser.email);
      }

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
        db.fetchMessagesForUser(profile.id);
        db.fetchDraftsForUser(profile.id);
        await api.addAuditLog(profile.email, 'USER_SIGN_IN', profile.email, 'success');
        return true;
      }

      set({ error: 'Invalid email/username or password.', isLoading: false });
      await api.addAuditLog(cleanEmail, 'USER_SIGN_IN_FAILED', cleanEmail, 'failed');
      return false;
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
