import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thread, Message } from '../../types/mail';
import { useMailStore } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { useAuthStore } from '../../store/authStore';
import { MexoAvatar } from '../common/MexoAvatar';
import { MexoBadge } from '../common/MexoBadge';
import { AttachmentCard } from './AttachmentCard';
import { LabelPickerDropdown } from './LabelPickerDropdown';
import { db } from '../../services/db';
import {
  ArrowLeft,
  Archive,
  Trash2,
  ShieldAlert,
  Star,
  Bookmark,
  Reply,
  ReplyAll,
  Forward,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  MoreVertical,
  ArchiveRestore,
  X,
} from 'lucide-react';

export const ThreadView: React.FC<{ thread: Thread }> = ({ thread }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { archiveMessages, unarchiveMessages, deleteMessages, markSpam, toggleStar, toggleImportant, applyLabelToMessages, removeLabelFromMessage, currentFolder } = useMailStore();
  const { openCompose } = useComposeStore();
  const labels = db.getLabels();

  // Track expanded state of individual messages in conversation thread
  const [expandedMsgIds, setExpandedMsgIds] = useState<string[]>([
    thread.messages[thread.messages.length - 1]?.id || '',
  ]);

  // Set page title to thread subject (Gmail-style)
  useEffect(() => {
    if (thread.subject) {
      document.title = `${thread.subject} – MEXO Mail`;
    }
    return () => {
      // Reset to default when navigating away
      document.title = 'MEXO Mail';
    };
  }, [thread.subject]);

  const toggleExpand = (msgId: string) => {
    setExpandedMsgIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const latestMsg = thread.messages[thread.messages.length - 1];

  const handleReply = (all: boolean = false) => {
    if (!latestMsg) return;
    openCompose({
      to: [latestMsg.senderEmail],
      cc: all ? latestMsg.recipients.filter((r) => r !== latestMsg.senderEmail) : [],
      subject: latestMsg.subject.startsWith('Re:') ? latestMsg.subject : `Re: ${latestMsg.subject}`,
      bodyHtml: `<br/><br/><blockquote style="border-left: 2px solid #cbd5e1; padding-left: 10px; color: #64748b;">
        On ${new Date(latestMsg.createdAt).toLocaleString()}, ${latestMsg.senderName} &lt;${latestMsg.senderEmail}&gt; wrote:<br/>
        ${latestMsg.bodyHtml}
      </blockquote>`,
    });
  };

  const handleForward = () => {
    if (!latestMsg) return;
    openCompose({
      to: [],
      subject: latestMsg.subject.startsWith('Fwd:') ? latestMsg.subject : `Fwd: ${latestMsg.subject}`,
      bodyHtml: `<br/><br/>---------- Forwarded message ---------<br/>
From: ${latestMsg.senderName} &lt;${latestMsg.senderEmail}&gt;<br/>
Date: ${new Date(latestMsg.createdAt).toLocaleString()}<br/>
Subject: ${latestMsg.subject}<br/><br/>
${latestMsg.bodyHtml}`,
      attachments: latestMsg.attachments,
    });
  };

  // Helper to resolve user profile photo
  const getSenderAvatar = (msg: Message) => {
    if (msg.senderEmail.toLowerCase() === currentUser.email.toLowerCase()) {
      return currentUser.avatarUrl || msg.senderAvatar;
    }
    const senderUser = db.getUserByEmail(msg.senderEmail);
    return senderUser?.avatarUrl || msg.senderAvatar;
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden font-sans text-slate-900 dark:text-slate-100 select-none">
      {/* ── Top Thread Toolbar ── */}
      <div className="h-12 border-b border-app-border px-3 sm:px-4 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate('/mail/inbox');
              }
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="h-4 w-px bg-app-border mx-1" />

          {currentFolder === 'archive' || thread.messages.some((m) => m.userState.isArchived) ? (
            <button
              onClick={() => {
                unarchiveMessages(thread.messages.map((m) => m.id));
                navigate('/mail/inbox');
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-[#0878e8] hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
              title="Unarchive (Move to Inbox)"
              aria-label="Unarchive (Move to Inbox)"
            >
              <ArchiveRestore className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                archiveMessages(thread.messages.map((m) => m.id));
                navigate('/mail/inbox');
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Archive"
              aria-label="Archive"
            >
              <Archive className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => {
              markSpam(thread.messages.map((m) => m.id), true);
              navigate('/mail/inbox');
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Report Spam"
            aria-label="Report Spam"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              deleteMessages(thread.messages.map((m) => m.id));
              navigate('/mail/inbox');
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Label Picker for Thread — fixed portal positioning */}
          <LabelPickerDropdown
            labels={labels}
            appliedLabelIds={thread.labels || []}
            onToggleLabel={(labelId) => applyLabelToMessages(thread.messages.map((m) => m.id), labelId)}
            triggerClassName="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            heading="Label this thread"
          />

          <div className="h-4 w-px bg-app-border mx-1" />

          {/* Star / Unstar Thread Button */}
          <button
            onClick={() => {
              thread.messages.forEach((m) => toggleStar(m.id));
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={thread.isStarred ? 'Unstar thread' : 'Star thread'}
            aria-label={thread.isStarred ? 'Unstar thread' : 'Star thread'}
          >
            <Star
              className={`w-5 h-5 ${
                thread.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-700 dark:text-slate-200'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Main Conversation Scroll Body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
        {/* Subject Header */}
        <div className="pb-3 border-b border-app-border">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-app-heading leading-snug break-words">
              {thread.subject}
            </h1>
            <div className="flex items-center space-x-1.5 flex-shrink-0 pt-0.5">
              {thread.isStarred && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
              {thread.isImportant && <Bookmark className="w-5 h-5 fill-amber-400 text-amber-500" />}
            </div>
          </div>
          {thread.labels && thread.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {thread.labels.map((lblId) => {
                const lbl = labels.find((l) => l.id === lblId);
                if (!lbl) return null;
                return (
                  <span
                    key={lbl.id}
                    className="group/pill inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: `${lbl.color}20`, color: lbl.color }}
                  >
                    <span>{lbl.name}</span>
                    <button
                      onClick={() => thread.messages.forEach((m) => removeLabelFromMessage(m.id, lbl.id))}
                      className="opacity-0 group-hover/pill:opacity-100 transition-opacity hover:text-rose-500"
                      title={`Remove label '${lbl.name}' from thread`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Thread Stack */}
        <div className="space-y-3 sm:space-y-4">
          {thread.messages.map((msg) => {
            const isExpanded = expandedMsgIds.includes(msg.id);
            const avatarSrc = getSenderAvatar(msg);

            return (
              <div
                key={msg.id}
                className="border border-app-border rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
              >
                {/* Message Header Bar */}
                <div
                  onClick={() => toggleExpand(msg.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800 select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
                    <MexoAvatar name={msg.senderName} src={avatarSrc} size="md" className="flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="font-bold text-xs sm:text-sm text-app-heading truncate">
                          {msg.senderName}
                        </span>
                        <span className="text-[11px] text-app-muted font-mono truncate max-w-[180px] sm:max-w-xs">
                          &lt;{msg.senderEmail}&gt;
                        </span>
                      </div>
                      <p className="text-[11px] text-app-muted truncate mt-0.5">
                        to {msg.recipients.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className="text-[11px] text-app-muted font-medium">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(msg.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title={msg.userState.isStarred ? 'Unstar message' : 'Star message'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          msg.userState.isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                        }`}
                      />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-app-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-app-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded Message Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 space-y-5 border-t border-app-border">
                    {/* Body HTML */}
                    <div
                      className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-app-heading break-words"
                      dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                    />

                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="pt-4 border-t border-app-border">
                        <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2.5">
                          {msg.attachments.length} Attachment(s)
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {msg.attachments.map((att) => (
                            <AttachmentCard key={att.id} attachment={att} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Reply Action Footer */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-app-border">
          <button
            onClick={() => handleReply(false)}
            className="px-4 py-2.5 text-xs font-semibold text-app-heading bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center transition-colors active:scale-95"
          >
            <Reply className="w-4 h-4 mr-2 text-app-primary" /> Reply
          </button>
          <button
            onClick={() => handleReply(true)}
            className="px-4 py-2.5 text-xs font-semibold text-app-heading bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center transition-colors active:scale-95"
          >
            <ReplyAll className="w-4 h-4 mr-2 text-app-primary" /> Reply All
          </button>
          <button
            onClick={handleForward}
            className="px-4 py-2.5 text-xs font-semibold text-app-heading bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl flex items-center transition-colors active:scale-95"
          >
            <Forward className="w-4 h-4 mr-2 text-app-primary" /> Forward
          </button>
        </div>
      </div>
    </div>
  );
};
