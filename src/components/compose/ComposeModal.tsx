import React, { useState, useEffect, useRef } from 'react';
import { useComposeStore, ComposeInstance } from '../../store/composeStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import { realtimeService } from '../../services/realtimeService';
import { useMailStore } from '../../store/mailStore';
import { RecipientInput } from './RecipientInput';
import { TiptapEditor } from './TiptapEditor';
import { ScheduleSendModal } from './ScheduleSendModal';
import { TemplatesDropdown } from './TemplatesDropdown';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { Attachment } from '../../types/mail';
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  Send,
  Paperclip,
  Trash2,
  Clock,
  ChevronDown,
  Smile,
  FileText,
  GripHorizontal,
  ArrowLeft,
} from 'lucide-react';

export const ComposeWindow: React.FC<{ instance: ComposeInstance }> = ({ instance }) => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const { closeCompose, toggleMinimize, toggleMaximize, updateCompose, saveComposeDraft } = useComposeStore();

  const [showCc, setShowCc] = useState(instance.cc.length > 0);
  const [showBcc, setShowBcc] = useState(instance.bcc.length > 0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Drag-to-move position state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Auto-insert user signature on open (if enabled and signature exists)
  useEffect(() => {
    const settings = db.getSettings();
    if (settings.signatureNewMail && settings.signatureContent && !instance.bodyHtml) {
      const formattedSignature = `<br/><br/>--<br/>${settings.signatureContent.replace(/\n/g, '<br/>')}`;
      updateCompose(instance.id, { bodyHtml: formattedSignature });
    }
  }, []);

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseDownHeader = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStartHeader = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touch = e.touches[0];
    if (touch) handleDragStart(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Debounced Auto-save draft (1.5s delay when content changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveComposeDraft(instance.id);
    }, 1500);
    return () => clearTimeout(timer);
  }, [instance.to, instance.subject, instance.bodyHtml, instance.attachments]);

  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const totalFiles = fileList.length;

    setIsUploading(true);
    setUploadProgress(10);

    const senderUserId = currentUser?.id && /^[0-9a-fA-F-]{36}$/.test(currentUser.id)
      ? currentUser.id
      : 'anonymous-user';

    const messageId = instance.draftId || (typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `draft-${Date.now()}`);

    let currentAttachments = [...instance.attachments];

    for (let i = 0; i < totalFiles; i++) {
      const file = fileList[i];
      const stepIndex = i + 1;
      setUploadStatusText(`Uploading ${stepIndex} of ${totalFiles}: ${file.name}`);

      try {
        const newAtt = await attachmentService.uploadAttachment(
          file,
          { senderUserId, messageId },
          (pct) => {
            const overallPct = Math.round(((i + (pct / 100)) / totalFiles) * 100);
            setUploadProgress(overallPct);
          }
        );

        currentAttachments = [...currentAttachments, newAtt];
        updateCompose(instance.id, { attachments: currentAttachments });
        addToast({ message: `Attached "${file.name}"`, type: 'success' });
      } catch (err: any) {
        console.error('Attachment upload error:', err);
        addToast({
          message: err.message || `Couldn't upload "${file.name}". Please try again.`,
          type: 'error',
        });
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText(null);
    if (e.target) e.target.value = '';
  };

  const removeAttachment = async (attId: string) => {
    const attToRemove = instance.attachments.find((a) => a.id === attId);
    if (attToRemove?.storagePath) {
      attachmentService.deleteAttachment(attToRemove.storagePath).catch(() => null);
    }
    updateCompose(instance.id, {
      attachments: instance.attachments.filter((a) => a.id !== attId),
    });
  };

  const handleSendNow = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (instance.isSending || instance.isSent) return;
    if (isUploading) {
      addToast({ message: 'Please wait for attachment upload to complete before sending.', type: 'warning' });
      return;
    }
    if (instance.to.length === 0) {
      addToast({ message: 'Please specify at least one recipient.', type: 'warning' });
      return;
    }

    updateCompose(instance.id, { isSending: true });

    // Generate idempotency UUID
    const clientMessageId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const senderEmail = currentUser?.email || 'user@mexo.com';
    const senderName = currentUser?.firstName
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : (currentUser?.email || 'MEXO User');
    const senderUserId = currentUser?.id && /^[0-9a-fA-F-]{36}$/.test(currentUser.id)
      ? currentUser.id
      : undefined;

    try {
      const res = await db.sendMessage({
        senderUserId,
        senderEmail,
        senderName,
        recipients: instance.to,
        subject: instance.subject || '(No Subject)',
        bodyHtml: instance.bodyHtml || '<p></p>',
        attachments: instance.attachments,
        clientMessageId,
        draftId: instance.draftId,
      });

      if (res.success) {
        updateCompose(instance.id, { isSending: false, isSent: true });

        // Delete draft from DB and memory
        if (instance.draftId) {
          db.deleteDraft(instance.draftId);
        }
        db.clearDraftsForMessage(senderEmail, instance.to, instance.subject);

        useMailStore.getState().triggerRefresh();

        // Broadcast to all connected clients & cross-tab
        realtimeService.broadcastRefresh();

        closeCompose(instance.id, true);
        addToast({ message: 'Message sent', type: 'success' });
      } else {
        updateCompose(instance.id, { isSending: false, isSent: false });
        const errMsg = res.error || "Message couldn't be sent. Please try again.";
        addToast({ message: errMsg, type: 'error' });
      }
    } catch (sendErr: any) {
      console.error('Send message error:', sendErr);
      updateCompose(instance.id, { isSending: false, isSent: false });
      addToast({ message: "Message couldn't be sent. Please try again.", type: 'error' });
    }
  };

  const handleScheduleConfirm = (scheduledIso: string) => {
    addToast({
      message: `Message scheduled for ${new Date(scheduledIso).toLocaleString()}`,
      type: 'success',
    });
    closeCompose(instance.id, true);
  };

  if (instance.isMinimized) {
    return (
      <div
        onClick={() => toggleMinimize(instance.id)}
        className="w-full sm:w-64 h-12 sm:h-11 bg-slate-900 text-white rounded-t-xl shadow-mexo-lg border border-slate-800 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all select-none fixed sm:relative bottom-16 sm:bottom-0 left-0 right-0 sm:left-auto sm:right-auto z-[60]"
      >
        <span className="text-xs font-semibold truncate">{instance.subject || 'New Message'}</span>
        <div className="flex items-center space-x-1">
          <button onClick={() => toggleMinimize(instance.id)} className="p-1 hover:text-mexo-400">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeCompose(instance.id);
            }}
            className="p-1 hover:text-rose-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        transform: instance.isMaximized ? 'none' : (window.innerWidth >= 640 ? `translate(${position.x}px, ${position.y}px)` : 'none'),
      }}
      className={`bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
        instance.isMaximized
          ? 'fixed inset-0 z-[100] sm:inset-4 sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-800'
          : 'fixed sm:relative inset-0 sm:inset-auto z-[100] sm:z-40 w-full sm:w-[560px] h-[100dvh] sm:h-[580px] rounded-none sm:rounded-t-2xl border-0 sm:border border-slate-200 dark:border-slate-800 max-w-full'
      }`}
    >
      {/* Mobile Top Navigation Bar (Page header with Back Button) */}
      <div className="sm:hidden h-14 bg-slate-900 text-white px-3 flex items-center justify-between select-none shrink-0 border-b border-slate-800">
        <button
          type="button"
          onClick={() => closeCompose(instance.id)}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-100 transition-colors font-bold text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-300" />
          <span>Back</span>
        </button>

        <span className="text-sm font-extrabold tracking-tight text-white">Compose</span>

        <div className="flex items-center space-x-2">
          {instance.isSaving ? (
            <span className="text-[10px] font-semibold text-indigo-400 animate-pulse">Saving...</span>
          ) : (
            <button
              type="button"
              onClick={() => closeCompose(instance.id, true)}
              className="p-1.5 text-slate-400 hover:text-rose-400 cursor-pointer"
              title="Discard draft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Compose Header Bar (Draggable) */}
      <div
        onMouseDown={handleMouseDownHeader}
        onTouchStart={handleTouchStartHeader}
        className="hidden sm:flex h-11 bg-slate-900 text-white px-4 items-center justify-between select-none cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to adjust position on screen"
      >
        <div className="flex items-center space-x-2">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold tracking-tight">New Message — MEXO Mail</span>
        </div>

        <div className="flex items-center space-x-1 text-slate-400">
          {instance.isSaving ? (
            <span className="text-[11px] font-medium animate-pulse text-mexo-400 mr-2">Saving draft...</span>
          ) : instance.lastSavedAt ? (
            <span className="text-[11px] font-medium text-slate-400 mr-2">Saved at {instance.lastSavedAt}</span>
          ) : null}

          <button
            onClick={() => toggleMinimize(instance.id)}
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleMaximize(instance.id)}
            className="p-1 rounded hover:bg-slate-800 hover:text-white"
            title={instance.isMaximized ? 'Restore' : 'Maximize'}
          >
            {instance.isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => closeCompose(instance.id)}
            className="p-1 rounded hover:bg-rose-600 hover:text-white"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compose Fields Body */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* From field */}
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="font-semibold w-12 flex-shrink-0">From:</span>
          <span className="font-semibold text-mexo-600 dark:text-mexo-400">{currentUser.email}</span>
        </div>

        {/* To field with +Cc / +Bcc toggle controls */}
        <RecipientInput
          label="To"
          recipients={instance.to}
          onChangeRecipients={(updated) => updateCompose(instance.id, { to: updated })}
          extraControls={
            <div className="flex items-center space-x-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  if (showCc) {
                    setShowCc(false);
                    updateCompose(instance.id, { cc: [] });
                  } else {
                    setShowCc(true);
                  }
                }}
                className={`font-bold transition-colors ${
                  showCc
                    ? 'text-app-primary hover:text-[#0668cc]'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {showCc ? '- Cc' : '+ Cc'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (showBcc) {
                    setShowBcc(false);
                    updateCompose(instance.id, { bcc: [] });
                  } else {
                    setShowBcc(true);
                  }
                }}
                className={`font-bold transition-colors ${
                  showBcc
                    ? 'text-app-primary hover:text-[#0668cc]'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {showBcc ? '- Bcc' : '+ Bcc'}
              </button>
            </div>
          }
        />

        {/* Cc Field with Remove Option */}
        {showCc && (
          <RecipientInput
            label="Cc"
            recipients={instance.cc}
            onChangeRecipients={(updated) => updateCompose(instance.id, { cc: updated })}
            onRemoveField={() => {
              setShowCc(false);
              updateCompose(instance.id, { cc: [] });
            }}
          />
        )}

        {/* Bcc Field with Remove Option */}
        {showBcc && (
          <RecipientInput
            label="Bcc"
            recipients={instance.bcc}
            onChangeRecipients={(updated) => updateCompose(instance.id, { bcc: updated })}
            onRemoveField={() => {
              setShowBcc(false);
              updateCompose(instance.id, { bcc: [] });
            }}
          />
        )}

        {/* Subject field */}
        <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center">
          <input
            type="text"
            placeholder="Subject"
            value={instance.subject}
            onChange={(e) => updateCompose(instance.id, { subject: e.target.value })}
            className="w-full bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 border-none outline-none"
          />
        </div>

        {/* Attachment Upload Progress */}
        {isUploading && (
          <div className="px-3 py-2 bg-mexo-50 dark:bg-mexo-950 border-b border-mexo-200 dark:border-mexo-800 flex items-center space-x-3 text-xs">
            <span className="font-semibold text-mexo-700 truncate max-w-[200px] sm:max-w-xs">
              {uploadStatusText || 'Uploading attachment...'}
            </span>
            <div className="flex-1 h-1.5 bg-mexo-200 rounded-full overflow-hidden">
              <div className="h-full bg-mexo-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="font-bold text-mexo-700 font-mono">{uploadProgress}%</span>
          </div>
        )}

        {/* Attached Files List */}
        {instance.attachments.length > 0 && (
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2 bg-slate-50/50 dark:bg-slate-800/30">
            {instance.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <FileText className="w-3.5 h-3.5 text-mexo-600" />
                <span className="truncate max-w-[140px]" title={getCleanFileName(att)}>{getCleanFileName(att)}</span>
                <button onClick={() => removeAttachment(att.id)} className="text-slate-400 hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tiptap Rich Text Editor */}
        <div className="flex-1 p-2">
          <TiptapEditor
            contentHtml={instance.bodyHtml}
            onChangeHtml={(html) => updateCompose(instance.id, { bodyHtml: html })}
          />
        </div>
      </div>

      {/* Compose Footer Toolbar */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Split Send Button */}
          <div className="inline-flex rounded-xl shadow-md overflow-hidden">
            <button
              type="button"
              disabled={instance.isSending || isUploading}
              onClick={handleSendNow}
              className="px-4 py-2 bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 text-white text-xs font-bold flex items-center transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
            >
              {instance.isSending ? (
                <>
                  <span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Send
                </>
              )}
            </button>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-2 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs border-l border-indigo-400/30 transition-colors"
              title="Schedule Send"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Attachment Upload Button */}
          <label className="p-2 text-slate-500 hover:text-mexo-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors" title="Attach file">
            <Paperclip className="w-4 h-4" />
            <input type="file" multiple onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Templates & Canned Responses Dropdown */}
          <TemplatesDropdown
            onSelectTemplate={(tpl) => {
              updateCompose(instance.id, {
                subject: tpl.subject || instance.subject,
                bodyHtml: tpl.bodyHtml || instance.bodyHtml,
              });
              addToast({ message: `Applied template "${tpl.name}"`, type: 'info' });
            }}
            currentSubject={instance.subject}
            currentBodyHtml={instance.bodyHtml}
          />
        </div>

        {/* Discard Draft Button */}
        <button
          onClick={() => closeCompose(instance.id, true)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          title="Discard draft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Schedule Send Modal */}
      <ScheduleSendModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleConfirm={handleScheduleConfirm}
      />
    </div>
  );
};

export const ComposeContainer: React.FC = () => {
  const { instances } = useComposeStore();

  if (instances.length === 0) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-0 sm:right-6 z-[60] flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-4 max-w-full pointer-events-none sm:pointer-events-auto [&>*]:pointer-events-auto">
      {instances.map((inst) => (
        <ComposeWindow key={inst.id} instance={inst} />
      ))}
    </div>
  );
};
