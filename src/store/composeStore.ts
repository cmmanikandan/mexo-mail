import { create } from 'zustand';
import { Attachment } from '../types/mail';
import { db } from '../services/db';
import { useAuthStore } from './authStore';

export interface ComposeInstance {
  id: string; // Unique compose window ID
  draftId?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  attachments: Attachment[];
  isMinimized: boolean;
  isMaximized: boolean;
  isSaving: boolean;
  isSending?: boolean;
  lastSavedAt?: string;
}

interface ComposeStore {
  instances: ComposeInstance[];
  activeInstanceId?: string;
  
  openCompose: (initialData?: Partial<ComposeInstance>) => void;
  closeCompose: (id: string, discardDraft?: boolean) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateCompose: (id: string, updates: Partial<ComposeInstance>) => void;
  saveComposeDraft: (id: string) => void;
}

export const useComposeStore = create<ComposeStore>((set, get) => ({
  instances: [],
  activeInstanceId: undefined,

  openCompose: (initialData) => {
    const id = `cmp-${Date.now()}`;
    const newInstance: ComposeInstance = {
      id,
      to: initialData?.to || [],
      cc: initialData?.cc || [],
      bcc: initialData?.bcc || [],
      subject: initialData?.subject || '',
      bodyHtml: initialData?.bodyHtml || '',
      attachments: initialData?.attachments || [],
      isMinimized: false,
      isMaximized: false,
      isSaving: false,
      isSending: false,
      draftId: initialData?.draftId,
    };
    set((state) => ({
      instances: [...state.instances, newInstance],
      activeInstanceId: id,
    }));
  },

  closeCompose: (id, discardDraft = false) => {
    const inst = get().instances.find((i) => i.id === id);
    if (inst) {
      if (discardDraft) {
        if (inst.draftId) db.deleteDraft(inst.draftId);
      } else {
        get().saveComposeDraft(id);
      }
    }
    set((state) => ({
      instances: state.instances.filter((i) => i.id !== id),
      activeInstanceId: state.instances.length > 1 ? state.instances[0].id : undefined,
    }));
  },

  toggleMinimize: (id) => {
    set((state) => ({
      instances: state.instances.map((i) => (i.id === id ? { ...i, isMinimized: !i.isMinimized } : i)),
    }));
  },

  toggleMaximize: (id) => {
    set((state) => ({
      instances: state.instances.map((i) => (i.id === id ? { ...i, isMaximized: !i.isMaximized } : i)),
    }));
  },

  updateCompose: (id, updates) => {
    set((state) => ({
      instances: state.instances.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  },

  saveComposeDraft: (id) => {
    const inst = get().instances.find((i) => i.id === id);
    if (!inst) return;

    const hasMeaningfulContent =
      inst.to.length > 0 ||
      inst.subject.trim().length > 0 ||
      inst.bodyHtml.replace(/<[^>]*>?/gm, '').trim().length > 0 ||
      inst.attachments.length > 0;

    if (!hasMeaningfulContent) return;

    const draftId = inst.draftId || `drf-${Date.now()}`;
    get().updateCompose(id, { draftId, isSaving: true });
    
    const currentUser = useAuthStore.getState().currentUser;
    const userEmail = currentUser?.email || 'user@mexo.com';
    const userId = currentUser?.id || 'system-user';

    db.saveDraft(userId, {
      id: draftId,
      userEmail,
      to: inst.to,
      cc: inst.cc,
      bcc: inst.bcc,
      subject: inst.subject,
      bodyHtml: inst.bodyHtml,
      attachments: inst.attachments,
      lastSavedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      get().updateCompose(id, {
        isSaving: false,
        lastSavedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }, 200);
  },
}));
