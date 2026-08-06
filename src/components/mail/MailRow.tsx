import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Message } from '../../types/mail';
import { useMailStore } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { MexoAvatar } from '../common/MexoAvatar';
import { db } from '../../services/db';
import { LabelPickerDropdown } from './LabelPickerDropdown';
import {
  Star,
  Bookmark,
  Paperclip,
  Archive,
  Trash2,
  Mail,
  MailOpen,
  Clock,
  ArchiveRestore,
  RotateCcw,
  X,
} from 'lucide-react';

export interface MailRowProps {
  message: Message;
  isSelected: boolean;
}

export const MailRow: React.FC<MailRowProps> = ({ message, isSelected }) => {
  const navigate = useNavigate();
  const {
    toggleSelectMessage,
    toggleStar,
    toggleImportant,
    setActiveThreadId,
    archiveMessages,
    unarchiveMessages,
    deleteMessages,
    restoreFromTrash,
    permanentlyDeleteMessages,
    markAsRead,
    snoozeMessages,
    applyLabelToMessages,
    removeLabelFromMessage,
    density,
    currentFolder,
  } = useMailStore();
  const { openCompose } = useComposeStore();

  const currentUser = db.getCurrentUser();
  const labels = db.getLabels();

  const isRead = message.userState.isRead;
  const isStarred = message.userState.isStarred;
  const isImportant = message.userState.isImportant;

  const userEmail = currentUser?.email?.toLowerCase() || '';
  const isSentFolder = currentFolder === 'sent' || message.senderEmail.toLowerCase() === userEmail;
  const isDraftFolder = currentFolder === 'drafts' || message.id.startsWith('drf-');

  // Recipient label display for sent emails
  const recipientName = React.useMemo(() => {
    if (!message.recipients || message.recipients.length === 0) return 'No recipients';
    const firstRecip = message.recipients[0];
    const foundContact = db.getContacts().find((c) => c.email.toLowerCase() === firstRecip.toLowerCase());
    if (foundContact) return `${foundContact.firstName} ${foundContact.lastName}`;
    return firstRecip.split('@')[0];
  }, [message.recipients]);

  // Recipient avatar resolution for Sent folder — prefer pre-fetched recipientAvatars on message
  const recipientAvatar = React.useMemo(() => {
    if (!message.recipients || message.recipients.length === 0) return undefined;
    const firstRecip = message.recipients[0].toLowerCase().trim();
    // First check the pre-fetched recipientAvatars attached to the message (from API batch-fetch)
    if (message.recipientAvatars?.[firstRecip]) return message.recipientAvatars[firstRecip];
    // Fallback: check cached users
    const recipUser = db.getUserByEmail(firstRecip);
    if (recipUser?.avatarUrl) return recipUser.avatarUrl;
    // Fallback: check contacts
    const foundContact = db.getContacts().find((c) => c.email.toLowerCase() === firstRecip);
    return foundContact?.avatarUrl;
  }, [message.recipients, message.recipientAvatars]);

  // For sent folder, show the current user's own DP when logged in as sender
  const senderAvatarResolved = React.useMemo(() => {
    if (message.senderEmail.toLowerCase() === userEmail) {
      return currentUser?.avatarUrl || message.senderAvatar;
    }
    const senderUser = db.getUserByEmail(message.senderEmail);
    return senderUser?.avatarUrl || message.senderAvatar;
  }, [message.senderEmail, message.senderAvatar, userEmail, currentUser?.avatarUrl]);

  const displayName = isSentFolder ? `To: ${recipientName}` : message.senderName;
  const avatarName = isSentFolder ? recipientName : message.senderName;
  const avatarSrc = isSentFolder ? recipientAvatar : senderAvatarResolved;

  const handleRowClick = (e: React.MouseEvent) => {
    const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
    if (['input', 'button', 'svg', 'path'].includes(targetTag)) return;

    if (isDraftFolder) {
      openCompose({
        draftId: message.id,
        to: message.recipients,
        subject: message.subject === '(Draft)' ? '' : message.subject,
        bodyHtml: message.bodyHtml,
        attachments: message.attachments,
      });
      return;
    }

    markAsRead([message.id], true);
    setActiveThreadId(message.threadId);
    navigate(`/mail/thread/${message.threadId}`);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const densityPadding =
    density === 'compact' ? 'py-1.5 px-3' : density === 'comfortable' ? 'py-3.5 px-4' : 'py-2.5 px-3.5';

  return (
    <div className="select-none">
      {/* ── 1. Desktop Mail Row (>= 768px) ── */}
      <div
        onClick={handleRowClick}
        className={`group relative hidden md:flex items-center border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer ${densityPadding} ${
          isSelected
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-l-[#7C3AED]'
            : !isRead
            ? 'bg-purple-50/30 dark:bg-indigo-950/20 font-bold border-l-4 border-l-[#7C3AED]'
            : 'bg-white dark:bg-slate-900 border-l-4 border-l-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        {/* Checkbox & Stars */}
        <div className="flex items-center space-x-2 mr-2.5" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectMessage(message.id)}
            className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED] border-slate-300 dark:border-slate-700 cursor-pointer"
          />

          <button
            onClick={() => toggleStar(message.id)}
            className="p-0.5 text-slate-300 dark:text-slate-700 hover:text-amber-400 focus:outline-none transition-colors"
            title={isStarred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => toggleImportant(message.id)}
            className={`p-0.5 focus:outline-none transition-colors ${
              isImportant
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 dark:text-slate-700 hover:text-amber-400'
            }`}
            title={isImportant ? 'Mark Not Important' : 'Mark Important'}
          >
            <Bookmark className={`w-4 h-4 transition-all duration-150 ${isImportant ? 'fill-amber-400 text-amber-500 scale-110' : ''}`} />
          </button>
        </div>

        {/* Unread Brand Gradient Dot Indicator */}
        {!isRead && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#0878e8] shadow-xs mr-2 flex-shrink-0"
            title="Unread message"
          />
        )}

        {/* Sender Avatar */}
        <MexoAvatar name={avatarName} src={avatarSrc} size="sm" className="mr-3 flex-shrink-0" />

        {/* Sender / Draft Label */}
        <div className="w-44 flex-shrink-0 truncate mr-3 flex items-center space-x-1.5">
          {isDraftFolder && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex-shrink-0">
              Draft
            </span>
          )}
          <span className={`text-xs truncate ${!isRead ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
            {displayName}
          </span>
        </div>

        {/* Subject + Snippet + Label Pills */}
        <div className="flex-1 min-w-0 flex items-center space-x-2 mr-3 overflow-hidden">
          <span className={`text-xs truncate ${!isRead ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
            {message.subject}
          </span>
          <span className="text-xs text-app-muted font-normal truncate">
            — {message.snippet}
          </span>

          {message.userState.labels && message.userState.labels.length > 0 && (
            <div className="flex items-center space-x-1 flex-shrink-0">
              {message.userState.labels.map((lblId) => {
                const lbl = labels.find((l) => l.id === lblId);
                if (!lbl) return null;
                return (
                  <span
                    key={lbl.id}
                    className="group/pill inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: `${lbl.color}22`, color: lbl.color }}
                  >
                    <span>{lbl.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLabelFromMessage(message.id, lbl.id);
                      }}
                      className="opacity-0 group-hover/pill:opacity-100 transition-opacity ml-0.5 hover:text-rose-500 focus:outline-none"
                      title={`Remove label '${lbl.name}'`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Attachment Icon */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mr-3 text-app-muted flex-shrink-0" title={`${message.attachments.length} attachment(s)`}>
            <Paperclip className="w-3.5 h-3.5" />
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[11px] flex-shrink-0 w-16 text-right group-hover:opacity-0 transition-opacity ${!isRead ? 'font-bold text-[#0878e8]' : 'font-medium text-app-muted'}`}>
          {formatDate(message.createdAt)}
        </div>

        {/* Quick Hover Action Bar */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-1 bg-white dark:bg-slate-900 border border-app-border rounded-xl shadow-mexo-sm px-1 py-0.5 z-10">
          {currentFolder === 'trash' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                restoreFromTrash([message.id]);
              }}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
              title="Restore to Inbox"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : currentFolder === 'archive' || message.userState.isArchived ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                unarchiveMessages([message.id]);
              }}
              className="p-1.5 text-app-primary hover:bg-[#0878e8]/10 rounded-lg"
              title="Unarchive (Move to Inbox)"
            >
              <ArchiveRestore className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                archiveMessages([message.id]);
              }}
              className="p-1.5 text-app-muted hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Archive"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}

          {currentFolder === 'trash' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                permanentlyDeleteMessages([message.id]);
              }}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
              title="Delete Permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteMessages([message.id]);
              }}
              className="p-1.5 text-app-muted hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead([message.id], !isRead);
            }}
            className="p-1.5 text-app-muted hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title={isRead ? 'Mark Unread' : 'Mark Read'}
          >
            {isRead ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              snoozeMessages([message.id], new Date(Date.now() + 24 * 3600 * 1000).toISOString());
            }}
            className="p-1.5 text-app-muted hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            title="Snooze Tomorrow"
          >
            <Clock className="w-3.5 h-3.5" />
          </button>

          {/* Quick Label Picker — uses fixed portal to avoid top-left positioning bug */}
          <LabelPickerDropdown
            labels={labels}
            appliedLabelIds={message.userState.labels || []}
            onToggleLabel={(labelId) => applyLabelToMessages([message.id], labelId)}
            triggerClassName="p-1.5 text-app-muted hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          />
        </div>
      </div>

      {/* ── 2. Dedicated Mobile Message Card (< 768px) ── */}
      <div
        onClick={handleRowClick}
        className={`md:hidden flex flex-col px-4 py-3.5 border-b border-app-border transition-colors cursor-pointer active:bg-slate-100/70 min-h-[92px] justify-between ${
          isSelected
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-l-[#7C3AED]'
            : !isRead
            ? 'bg-purple-50/30 dark:bg-indigo-950/20 font-bold border-l-4 border-l-[#7C3AED]'
            : 'bg-white dark:bg-slate-900 border-l-4 border-l-transparent text-app-body'
        }`}
      >
        {/* ROW 1: Checkbox | Unread Dot | Avatar | Sender Name | Time */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectMessage(message.id)}
              className="w-4 h-4 rounded text-[#7C3AED] border-app-border flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            {!isRead && (
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#0878e8] shadow-xs flex-shrink-0" title="Unread" />
            )}
            <MexoAvatar name={avatarName} src={avatarSrc} size="sm" className="w-8 h-8 text-xs flex-shrink-0" />
            <div className="flex items-center space-x-1.5 min-w-0 truncate">
              {isDraftFolder && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex-shrink-0">
                  Draft
                </span>
              )}
              <span className={`text-xs truncate ${!isRead ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                {displayName}
              </span>
            </div>
          </div>
          <span className={`text-[11px] flex-shrink-0 ml-1 ${!isRead ? 'font-bold text-[#0878e8]' : 'font-medium text-app-muted'}`}>
            {formatDate(message.createdAt)}
          </span>
        </div>

        {/* ROW 2: Subject */}
        <p className={`text-xs truncate pl-11 mb-0.5 ${!isRead ? 'font-extrabold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
          {message.subject}
        </p>

        {/* ROW 3: Snippet | Icons */}
        <div className="flex items-center justify-between pl-11">
          <p className="text-[11px] text-app-muted truncate flex-1 mr-2 font-normal">{message.snippet}</p>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {message.attachments && message.attachments.length > 0 && (
              <Paperclip className="w-3.5 h-3.5 text-app-muted" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(message.id);
              }}
              className="p-1 rounded-lg text-slate-300 dark:text-slate-700 hover:text-amber-400 focus:outline-none transition-colors"
              title={isStarred ? 'Unstar' : 'Star'}
              aria-label={isStarred ? 'Unstar' : 'Star'}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
