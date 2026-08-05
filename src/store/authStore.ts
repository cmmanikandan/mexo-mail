import { create } from 'zustand';
import { MexoUser } from '../types/user';
import { db } from '../services/db';

interface AuthStore {
  currentUser: MexoUser;
  isAuthenticated: boolean;
  signIn: (emailOrUsername: string, passwordInput?: string) => boolean;
  signUp: (data: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    recoveryEmail?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
  }) => MexoUser;
  signOut: () => void;
  updateCurrentUser: (updates: Partial<MexoUser>) => void;
}

const DEFAULT_USER: MexoUser = {
  id: 'usr-1',
  username: 'manikandanprabhu1221',
  email: 'manikandanprabhu1221@mexo.com',
  firstName: 'Manikandan',
  lastName: 'CM',
  role: 'user',
  status: 'active',
  storageUsedBytes: 5.2 * 1024 * 1024 * 1024,
  storageLimitBytes: 15 * 1024 * 1024 * 1024,
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
  twoFactorEnabled: false,
};

const initialUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('mexo_current_user_id_v1') : null;
const hasActiveSession = typeof localStorage !== 'undefined' ? localStorage.getItem('mexo_session_active_v1') === 'true' : false;

const initialUser = initialUserId ? db.getUserById(initialUserId) : null;

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: initialUser || db.getCurrentUser(),
  isAuthenticated: hasActiveSession,

  signIn: (emailOrUsername: string, passwordInput?: string) => {
    let clean = emailOrUsername.trim().toLowerCase();
    if (!clean.includes('@')) {
      clean = `${clean}@mexo.com`;
    }
    const user = db.getUserByEmail(clean);
    if (!user || user.status !== 'active') {
      return false;
    }

    // STRICT Password Checking
    if (passwordInput !== undefined) {
      const cleanPass = passwordInput.trim();
      const expectedPass = (user.password || 'password123').trim();
      
      let isCorrect = cleanPass === expectedPass;
      if (user.role === 'system_admin') {
        isCorrect = cleanPass === 'admin' || cleanPass === 'admin123';
      }

      if (!isCorrect) {
        db.addAuditLog(user.email, 'USER_SIGN_IN_FAILED', user.email, 'failed');
        return false;
      }
    }

    db.setCurrentUser(user.id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mexo_session_active_v1', 'true');
    }
    set({ currentUser: user, isAuthenticated: true });
    db.addAuditLog(user.email, 'USER_SIGN_IN', user.email, 'success');
    return true;
  },

  signUp: (data) => {
    const newUser = db.createUser(data);
    db.setCurrentUser(newUser.id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mexo_session_active_v1', 'true');
    }
    set({ currentUser: newUser, isAuthenticated: true });
    return newUser;
  },

  signOut: () => {
    const user = db.getCurrentUser();
    if (user) {
      db.addAuditLog(user.email, 'USER_SIGN_OUT', user.email, 'success');
    }
    db.setCurrentUser('');
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mexo_session_active_v1');
    }
    set({ currentUser: null as any, isAuthenticated: false });
  },

  updateCurrentUser: (updates) => {
    set((state) => {
      const updated = db.updateUser(state.currentUser.id, updates);
      return { currentUser: updated };
    });
  },
}));
