import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface UIStore {
  isSidebarExpanded: boolean;
  isMobileDrawerOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toasts: Toast[];
  
  // Dialog visibility states
  isCreateGroupOpen: boolean;
  isCreateContactOpen: boolean;
  isAdvancedSearchOpen: boolean;
  isKeyboardShortcutsOpen: boolean;

  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  setCreateGroupOpen: (open: boolean) => void;
  setCreateContactOpen: (open: boolean) => void;
  setAdvancedSearchOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarExpanded: true,
  isMobileDrawerOpen: false,
  theme: 'light',
  toasts: [],

  isCreateGroupOpen: false,
  isCreateContactOpen: false,
  isAdvancedSearchOpen: false,
  isKeyboardShortcutsOpen: false,

  toggleSidebar: () => set((state) => ({ isSidebarExpanded: !state.isSidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ isSidebarExpanded: expanded }),
  toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  
  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  addToast: (toast) => {
    const id = `tst-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    const duration = toast.duration || 4000;
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setCreateGroupOpen: (open) => set({ isCreateGroupOpen: open }),
  setCreateContactOpen: (open) => set({ isCreateContactOpen: open }),
  setAdvancedSearchOpen: (open) => set({ isAdvancedSearchOpen: open }),
  setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),
}));
