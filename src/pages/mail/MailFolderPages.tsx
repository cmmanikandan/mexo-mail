import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { MailList } from '../../components/mail/MailList';
import { ThreadView } from '../../components/mail/ThreadView';
import { SearchFilterChips } from '../../components/mail/SearchFilterChips';
import { MobileSearchPage } from '../../components/mail/MobileSearchPage';
import { useMailStore, MailFolder } from '../../store/mailStore';
import { db } from '../../services/db';
import { useAuthStore } from '../../store/authStore';
import { filterMessagesByQuery } from '../../utils/SearchQueryParser';
import { Message, Thread } from '../../types/mail';

import { realtimeService } from '../../services/realtimeService';

import { AlertCircle, RefreshCw } from 'lucide-react';

export const MailFolderPage: React.FC<{ folderOverride?: MailFolder }> = ({ folderOverride }) => {
  const { folder: paramFolder } = useParams<{ folder: string }>();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const { currentFolder, activeLabelId, searchQuery, lastUpdated, triggerRefresh } = useMailStore();
  const { currentUser, isLoading: isAuthLoading } = useAuthStore();

  const activeFolder = folderOverride || (paramFolder as MailFolder) || currentFolder || 'inbox';
  const effectiveQuery = urlQuery || searchQuery;

  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const requestSeqRef = React.useRef(0);

  const isMobileSearchRoute = activeFolder === 'search' && typeof window !== 'undefined' && window.innerWidth < 768;

  // Asynchronously fetch messages and drafts with sequence protection & error handling
  const fetchMailboxData = React.useCallback(async (isBackground = false) => {
    if (!currentUser?.id || currentUser.id === 'guest-user') {
      setIsInitialLoading(false);
      return;
    }

    const currentSeq = ++requestSeqRef.current;
    
    // Only show full skeleton on first load if cached messages are empty
    const cachedCount = db.getMessagesForUser(currentUser.email || '').length;
    if (!isBackground && cachedCount === 0) {
      setIsInitialLoading(true);
    }
    setFetchError(null);

    try {
      await Promise.all([
        db.fetchMessagesForUser(currentUser.id),
        db.fetchDraftsForUser(currentUser.id),
      ]);

      if (currentSeq === requestSeqRef.current) {
        triggerRefresh();
      }
    } catch (err: any) {
      console.error('[MAILBOX FETCH ERROR]', err);
      if (currentSeq === requestSeqRef.current) {
        setFetchError('Unable to load messages. Please check connection and retry.');
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsInitialLoading(false);
      }
    }
  }, [currentUser?.id, currentUser?.email, triggerRefresh]);

  // Initial fetch and folder switch handler
  React.useEffect(() => {
    if (!isAuthLoading) {
      fetchMailboxData(false);
    }
  }, [currentUser?.id, isAuthLoading, activeFolder, fetchMailboxData]);

  // Realtime subscription & PWA visibility resume listener
  React.useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'guest-user') return;

    realtimeService.connect(currentUser.email, currentUser.id);

    const unsubscribe = realtimeService.subscribe((evt: any) => {
      if (evt.type === 'NEW_MESSAGE' || evt.type === 'MESSAGES_REFRESHED') {
        fetchMailboxData(true);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMailboxData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id, currentUser?.email, fetchMailboxData]);

  // Reactively recompute filtered messages on any state change or action (lastUpdated)
  const filteredMessages: Message[] = React.useMemo(() => {
    const userEmail = currentUser?.email || 'user@mexo.com';
    const messages = db.getMessagesForUser(userEmail);
    const labels = db.getLabels();

    if (activeFolder === 'drafts') {
      const userDrafts = db.getDraftsForUser(userEmail);
      return userDrafts.map((d) => ({
        id: d.id,
        threadId: `th-draft-${d.id}`,
        senderName: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : userEmail,
        senderEmail: userEmail,
        recipients: d.to.length > 0 ? d.to : ['(No recipients)'],
        subject: d.subject || '(Draft)',
        snippet: d.bodyHtml ? d.bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 100) : '(Empty draft)',
        bodyHtml: d.bodyHtml,
        attachments: d.attachments || [],
        createdAt: d.lastSavedAt || new Date().toISOString(),
        userState: {
          recipientEmail: userEmail,
          isRead: true,
          isStarred: false,
          isImportant: false,
          isArchived: false,
          isDeleted: false,
          isSpam: false,
          labels: [],
        },
      }));
    }

    if (activeFolder === 'search' || effectiveQuery.trim()) {
      return filterMessagesByQuery(messages, effectiveQuery, labels);
    }

    if (activeLabelId) {
      return messages.filter((msg) => msg.userState.labels && msg.userState.labels.includes(activeLabelId));
    }

    const now = Date.now();
    const rawFiltered = messages.filter((msg) => {
      const st = msg.userState;
      const isSnoozedActive = st.snoozedUntil ? new Date(st.snoozedUntil).getTime() > now : false;
      const cleanUserEmail = userEmail.toLowerCase();
      const isSentByMeToOthersOnly =
        msg.senderEmail.toLowerCase() === cleanUserEmail &&
        !msg.recipients.some((r) => {
          const cleanR = r.toLowerCase().trim();
          return cleanR === cleanUserEmail || cleanR === (currentUser?.username || '').toLowerCase();
        });

      switch (activeFolder) {
        case 'inbox':
          return !st.isArchived && !st.isDeleted && !st.isSpam && !isSnoozedActive && !isSentByMeToOthersOnly;
        case 'starred':
          return st.isStarred && !st.isDeleted;
        case 'snoozed':
          return isSnoozedActive && !st.isDeleted;
        case 'important':
          return st.isImportant && !st.isDeleted;
        case 'sent':
          return msg.senderEmail.toLowerCase() === cleanUserEmail && !st.isDeleted;
        case 'scheduled':
          return false;
        case 'archive':
          return st.isArchived && !st.isDeleted && !st.isSpam;
        case 'all':
          return !st.isDeleted;
        case 'spam':
          return st.isSpam && !st.isDeleted;
        case 'trash':
          return st.isDeleted;
        default:
          return !st.isDeleted;
      }
    });

    // Deduplicate by message ID & sort by date descending (most recent first)
    const seen = new Set<string>();
    const deduplicated = rawFiltered.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeFolder, activeLabelId, effectiveQuery, lastUpdated, currentUser?.email]);

  const settings = db.getSettings();
  const readingPanePos = settings.readingPanePosition || 'off';

  if (isMobileSearchRoute) {
    return <MobileSearchPage />;
  }

  if (fetchError && filteredMessages.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto select-none">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3.5 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Unable to load messages</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 font-normal">{fetchError}</p>
          <button
            type="button"
            onClick={() => fetchMailboxData(false)}
            className="px-4 py-2 bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white rounded-xl text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry loading</span>
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div key={activeFolder} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-1 duration-200">
        {(activeFolder === 'search' || Boolean(effectiveQuery.trim())) && <SearchFilterChips />}
        <MailList messages={filteredMessages} isLoading={isInitialLoading && filteredMessages.length === 0} />
      </div>
    </AppLayout>
  );
};

export const ThreadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { lastUpdated } = useMailStore();
  const { currentUser } = useAuthStore();
  const messages = db.getMessagesForUser(currentUser?.email || '');

  const threadMessages = React.useMemo(() => {
    return messages.filter((m) => m.threadId === id);
  }, [id, messages, lastUpdated]);

  // Mark unread messages in thread as read when opened
  React.useEffect(() => {
    const unreadIds = threadMessages.filter((m) => !m.userState.isRead).map((m) => m.id);
    if (unreadIds.length > 0) {
      useMailStore.getState().markAsRead(unreadIds, true);
    }
  }, [id, threadMessages]);

  if (threadMessages.length === 0) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-app-muted">Thread not found or deleted.</div>
      </AppLayout>
    );
  }

  const lastMsg = threadMessages[threadMessages.length - 1];
  const thread: Thread = {
    id: id || '',
    subject: threadMessages[0]?.subject || '(No Subject)',
    messageCount: threadMessages.length,
    lastMessageAt: lastMsg?.createdAt || new Date().toISOString(),
    participants: threadMessages.map((m) => ({ name: m.senderName, email: m.senderEmail, avatar: m.senderAvatar })),
    snippet: lastMsg?.snippet || '',
    messages: threadMessages,
    isUnread: threadMessages.some((m) => !m.userState.isRead),
    isStarred: threadMessages.some((m) => m.userState.isStarred),
    isImportant: threadMessages.some((m) => m.userState.isImportant),
    labels: Array.from(new Set(threadMessages.flatMap((m) => m.userState.labels || []))),
  };

  return (
    <AppLayout>
      <ThreadView thread={thread} />
    </AppLayout>
  );
};
