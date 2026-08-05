import { useEffect } from 'react';
import { useMailStore, MailFolder } from '../store/mailStore';
import { useAuthStore } from '../store/authStore';
import { db } from '../services/db';

const FOLDER_LABELS: Record<MailFolder, string> = {
  inbox: 'Inbox',
  starred: 'Starred',
  snoozed: 'Snoozed',
  important: 'Important',
  sent: 'Sent',
  scheduled: 'Scheduled',
  drafts: 'Drafts',
  archive: 'Archive',
  all: 'All Mail',
  spam: 'Spam',
  trash: 'Trash',
  search: 'Search Results',
};

const APP_NAME = 'MEXO Mail';

/**
 * usePageTitle – Sets document.title dynamically, Gmail-style.
 *
 * Examples:
 *   Inbox (3) – MEXO Mail
 *   Starred – MEXO Mail
 *   Drafts (2) – MEXO Mail
 *   Search Results – MEXO Mail
 *   Manikandan CM – Account – MEXO Mail
 */
export function usePageTitle(customTitle?: string) {
  const { currentFolder, activeLabelId, lastUpdated } = useMailStore();
  const { currentUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (customTitle) {
      document.title = `${customTitle} – ${APP_NAME}`;
      return;
    }

    if (!isAuthenticated) {
      document.title = APP_NAME;
      return;
    }

    try {
      const messages = db.getMessagesForUser(currentUser.email);
      const now = Date.now();

      if (activeLabelId) {
        const label = db.getLabels().find((l) => l.id === activeLabelId);
        const labelName = label?.name || 'Label';
        document.title = `${labelName} – ${APP_NAME}`;
        return;
      }

      // Count badge for inbox (unread), drafts (total drafts)
      let badge = '';

      if (currentFolder === 'inbox') {
        const unreadCount = messages.filter((m) => {
          const st = m.userState;
          const isSnoozedActive = st.snoozedUntil ? new Date(st.snoozedUntil).getTime() > now : false;
          return !st.isRead && !st.isArchived && !st.isDeleted && !st.isSpam && !isSnoozedActive;
        }).length;
        if (unreadCount > 0) badge = ` (${unreadCount})`;
      } else if (currentFolder === 'drafts') {
        const drafts = db.getDraftsForUser(currentUser.email);
        if (drafts.length > 0) badge = ` (${drafts.length})`;
      } else if (currentFolder === 'spam') {
        const spamCount = messages.filter((m) => m.userState.isSpam && !m.userState.isDeleted).length;
        if (spamCount > 0) badge = ` (${spamCount})`;
      }

      const folderLabel = FOLDER_LABELS[currentFolder] || currentFolder;
      document.title = `${folderLabel}${badge} – ${APP_NAME}`;
    } catch {
      document.title = APP_NAME;
    }
  }, [customTitle, currentFolder, activeLabelId, isAuthenticated, lastUpdated, currentUser?.email]);
}
