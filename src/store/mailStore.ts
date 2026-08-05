import { create } from 'zustand';
import { Message, Thread, Label } from '../types/mail';
import { db } from '../services/db';
import { useUIStore } from './uiStore';

export type MailFolder =
  | 'inbox'
  | 'starred'
  | 'snoozed'
  | 'important'
  | 'sent'
  | 'scheduled'
  | 'drafts'
  | 'archive'
  | 'all'
  | 'spam'
  | 'trash'
  | 'search';

export type ReadingPanePosition = 'off' | 'right' | 'below';

interface MailStore {
  currentFolder: MailFolder;
  activeLabelId?: string;
  activeGroupId?: string;
  searchQuery: string;
  selectedMessageIds: string[];
  activeThreadId?: string;
  readingPane: ReadingPanePosition;
  density: 'default' | 'comfortable' | 'compact';
  undoQueue: { message: Message; timer: NodeJS.Timeout; durationSec: number } | null;
  lastUpdated: number;
  
  setCurrentFolder: (folder: MailFolder, labelId?: string, groupId?: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMessageIds: (ids: string[]) => void;
  toggleSelectMessage: (id: string) => void;
  selectAllMessages: (allIds: string[]) => void;
  clearSelection: () => void;
  setActiveThreadId: (threadId?: string) => void;
  setReadingPane: (position: ReadingPanePosition) => void;
  setDensity: (density: 'default' | 'comfortable' | 'compact') => void;
  
  // Quick Actions
  toggleStar: (messageId: string) => void;
  toggleImportant: (messageId: string) => void;
  markAsRead: (messageIds: string[], isRead: boolean) => void;
  archiveMessages: (messageIds: string[]) => void;
  unarchiveMessages: (messageIds: string[]) => void;
  deleteMessages: (messageIds: string[]) => void;
  restoreFromTrash: (messageIds: string[]) => void;
  permanentlyDeleteMessages: (messageIds: string[]) => void;
  markSpam: (messageIds: string[], isSpam: boolean) => void;
  applyLabelToMessages: (messageIds: string[], labelId: string) => void;
  removeLabelFromMessage: (messageId: string, labelId: string) => void;
  snoozeMessages: (messageIds: string[], untilIso: string) => void;
  emptyTrash: () => void;
  triggerRefresh: () => void;
}

export const useMailStore = create<MailStore>((set, get) => ({
  currentFolder: 'inbox',
  activeLabelId: undefined,
  activeGroupId: undefined,
  searchQuery: '',
  selectedMessageIds: [],
  activeThreadId: undefined,
  readingPane: 'right',
  density: 'default',
  undoQueue: null,
  lastUpdated: Date.now(),

  triggerRefresh: () => set({ lastUpdated: Date.now() }),

  setCurrentFolder: (folder, labelId, groupId) =>
    set({
      currentFolder: folder,
      activeLabelId: labelId,
      activeGroupId: groupId,
      selectedMessageIds: [],
      activeThreadId: undefined,
      lastUpdated: Date.now(),
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedMessageIds: (ids) => set({ selectedMessageIds: ids }),

  toggleSelectMessage: (id) => {
    set((state) => {
      const exists = state.selectedMessageIds.includes(id);
      return {
        selectedMessageIds: exists
          ? state.selectedMessageIds.filter((mId) => mId !== id)
          : [...state.selectedMessageIds, id],
      };
    });
  },

  selectAllMessages: (allIds) => set({ selectedMessageIds: allIds }),

  clearSelection: () => set({ selectedMessageIds: [] }),

  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

  setReadingPane: (position) => set({ readingPane: position }),

  setDensity: (density) => set({ density }),

  toggleStar: (messageId) => {
    const messages = db.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      const newStar = !msg.userState.isStarred;
      db.updateMessageState(messageId, { isStarred: newStar });
      set({ lastUpdated: Date.now() });
    }
  },

  toggleImportant: (messageId) => {
    const messages = db.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      const newImp = !msg.userState.isImportant;
      db.updateMessageState(messageId, { isImportant: newImp });
      set({ lastUpdated: Date.now() });
    }
  },

  markAsRead: (messageIds, isRead) => {
    messageIds.forEach((id) => db.updateMessageState(id, { isRead }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });
  },

  archiveMessages: (messageIds) => {
    const messages = db.getMessages();
    const previousStates = messageIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      return { id, state: msg ? { ...msg.userState } : null };
    });

    messageIds.forEach((id) => db.updateMessageState(id, { isArchived: true }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });

    useUIStore.getState().addToast({
      message: messageIds.length > 1 ? `${messageIds.length} conversations archived.` : 'Conversation archived.',
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        previousStates.forEach(({ id, state }) => {
          if (state) db.updateMessageState(id, state);
        });
        set({ lastUpdated: Date.now() });
        useUIStore.getState().addToast({ message: 'Action undone.', type: 'info' });
      },
    });
  },

  unarchiveMessages: (messageIds) => {
    const messages = db.getMessages();
    const previousStates = messageIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      return { id, state: msg ? { ...msg.userState } : null };
    });

    messageIds.forEach((id) => db.updateMessageState(id, { isArchived: false }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });

    useUIStore.getState().addToast({
      message: messageIds.length > 1 ? `${messageIds.length} conversations moved to Inbox.` : 'Moved to Inbox.',
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        previousStates.forEach(({ id, state }) => {
          if (state) db.updateMessageState(id, state);
        });
        set({ lastUpdated: Date.now() });
        useUIStore.getState().addToast({ message: 'Action undone.', type: 'info' });
      },
    });
  },

  deleteMessages: (messageIds) => {
    const messages = db.getMessages();
    const allDrafts = db.getDrafts();
    const previousStates = messageIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      return { id, state: msg ? { ...msg.userState } : null };
    });

    messageIds.forEach((id) => {
      const isDraft = allDrafts.some((d) => d.id === id) || id.startsWith('drf-') || id.startsWith('d-');
      if (isDraft) {
        db.deleteDraft(id);
      } else {
        db.updateMessageState(id, { isDeleted: true });
      }
    });
    set({ selectedMessageIds: [], lastUpdated: Date.now() });

    useUIStore.getState().addToast({
      message: messageIds.length > 1 ? `${messageIds.length} conversations moved to Trash.` : 'Conversation moved to Trash.',
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        previousStates.forEach(({ id, state }) => {
          if (state) db.updateMessageState(id, state);
        });
        set({ lastUpdated: Date.now() });
        useUIStore.getState().addToast({ message: 'Action undone.', type: 'info' });
      },
    });
  },

  restoreFromTrash: (messageIds) => {
    const messages = db.getMessages();
    const previousStates = messageIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      return { id, state: msg ? { ...msg.userState } : null };
    });

    messageIds.forEach((id) => db.updateMessageState(id, { isDeleted: false, isArchived: false, isSpam: false }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });

    useUIStore.getState().addToast({
      message: messageIds.length > 1 ? `${messageIds.length} conversations restored to Inbox.` : 'Restored to Inbox.',
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        previousStates.forEach(({ id, state }) => {
          if (state) db.updateMessageState(id, state);
        });
        set({ lastUpdated: Date.now() });
        useUIStore.getState().addToast({ message: 'Action undone.', type: 'info' });
      },
    });
  },

  permanentlyDeleteMessages: (messageIds) => {
    messageIds.forEach((id) => db.deleteMessagePermanently(id));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });
  },

  markSpam: (messageIds, isSpam) => {
    const messages = db.getMessages();
    const previousStates = messageIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      return { id, state: msg ? { ...msg.userState } : null };
    });

    messageIds.forEach((id) => db.updateMessageState(id, { isSpam, isArchived: true }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });

    useUIStore.getState().addToast({
      message: isSpam ? 'Reported as Spam.' : 'Unmarked as Spam.',
      actionLabel: 'Undo',
      duration: 5000,
      onAction: () => {
        previousStates.forEach(({ id, state }) => {
          if (state) db.updateMessageState(id, state);
        });
        set({ lastUpdated: Date.now() });
        useUIStore.getState().addToast({ message: 'Action undone.', type: 'info' });
      },
    });
  },

  applyLabelToMessages: (messageIds, labelId) => {
    const messages = db.getMessages();
    messageIds.forEach((id) => {
      const msg = messages.find((m) => m.id === id);
      if (msg) {
        const labels = msg.userState.labels || [];
        // Toggle: remove if already applied, add if not present
        const updated = labels.includes(labelId)
          ? labels.filter((l) => l !== labelId)
          : [...labels, labelId];
        db.updateMessageState(id, { labels: updated });
      }
    });
    set({ selectedMessageIds: [], lastUpdated: Date.now() });
  },

  removeLabelFromMessage: (messageId, labelId) => {
    const messages = db.getMessages();
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      const labels = (msg.userState.labels || []).filter((l) => l !== labelId);
      db.updateMessageState(messageId, { labels });
      set({ lastUpdated: Date.now() });
    }
  },

  snoozeMessages: (messageIds, untilIso) => {
    messageIds.forEach((id) => db.updateMessageState(id, { snoozedUntil: untilIso }));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });
  },

  emptyTrash: () => {
    const messages = db.getMessages();
    messages.filter((m) => m.userState.isDeleted).forEach((m) => db.deleteMessagePermanently(m.id));
    set({ selectedMessageIds: [], lastUpdated: Date.now() });
  },
}));
