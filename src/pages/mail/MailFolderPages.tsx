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

export const MailFolderPage: React.FC<{ folderOverride?: MailFolder }> = ({ folderOverride }) => {
  const { folder: paramFolder } = useParams<{ folder: string }>();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const { currentFolder, activeLabelId, searchQuery, lastUpdated } = useMailStore();

  const activeFolder = folderOverride || (paramFolder as MailFolder) || currentFolder || 'inbox';
  const effectiveQuery = urlQuery || searchQuery;

  const isMobileSearchRoute = activeFolder === 'search' && typeof window !== 'undefined' && window.innerWidth < 768;

  // Reactively recompute filtered messages on any state change or action (lastUpdated)
  const filteredMessages: Message[] = React.useMemo(() => {
    const { currentUser } = useAuthStore.getState();
    const userEmail = currentUser?.email || 'user@mexo.com';
    const messages = db.getMessagesForUser(userEmail);
    const labels = db.getLabels();

    if (activeFolder === 'drafts') {
      const userDrafts = db.getDraftsForUser(userEmail);
      return userDrafts.map((d) => ({
        id: d.id,
        threadId: `th-draft-${d.id}`,
        senderName: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : userEmail,
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
          return false; // Scheduled messages are separate
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

    // Deduplicate by message ID to guarantee unique message rendering
    const seen = new Set<string>();
    return rawFiltered.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [activeFolder, activeLabelId, effectiveQuery, lastUpdated]);

  const settings = db.getSettings();
  const readingPanePos = settings.readingPanePosition || 'off';

  if (isMobileSearchRoute) {
    return <MobileSearchPage />;
  }

  return (
    <AppLayout>
      <div key={activeFolder} className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-1 duration-200">
        {(activeFolder === 'search' || Boolean(effectiveQuery.trim())) && <SearchFilterChips />}
        <MailList messages={filteredMessages} />
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
