import { create } from 'zustand';

export interface MailToastItem {
  id: string;
  senderName: string;
  subject: string;
}

interface MailToastStore {
  toasts: MailToastItem[];
  showToast: (item: MailToastItem) => void;
  dismissToast: (id: string) => void;
}

export const useMailToastStore = create<MailToastStore>((set) => ({
  toasts: [],

  showToast: (item) => {
    set((state) => {
      // Avoid duplicate toasts for the same message
      if (state.toasts.some((t) => t.id === item.id)) return state;
      return { toasts: [...state.toasts, item] };
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== item.id) }));
    }, 5000);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
