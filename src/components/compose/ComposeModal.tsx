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
import { uploadFileToCloudinary } from '../../services/cloudinaryService';
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadProgress(5);

    try {
      const res = await uploadFileToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });

      const newAtt: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: res.bytes || file.size,
        downloadUrl: res.secure_url,
        previewUrl: res.secure_url,
      };

      updateCompose(instance.id, {
        attachments: [...instance.attachments, newAtt],
      });
      addToast({ message: `Attached "${file.name}" to email via Cloudinary`, type: 'success' });
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      // Fallback attachment if network upload fails
      const fallbackAtt: Attachment = {
        id: `att-${Date.now()}`,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        downloadUrl: '#',
      };
      updateCompose(instance.id, {
        attachments: [...instance.attachments, fallbackAtt],
      });
      addToast({ message: `Attached "${file.name}"`, type: 'info' });
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) e.target.value = '';
    }
  };

  const removeAttachment = (attId: string) => {
    updateCompose(instance.id, {
      attachments: instance.attachments.filter((a) => a.id !== attId),
    });
  };

  const handleSendNow = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (instance.isSending) return;
    if (isUploading) {
      addToast({ message: 'Please wait for attachment upload to complete.', type: 'warning' });
      return;
    }
    if (instance.to.length === 0) {
      addToast({ message: 'Please specify at least one recipient.', type: 'warning' });
      return;
    }

    updateCompose(instance.id, { isSending: true });

    // Unique client idempotency key for send operation
    const clientMessageId = `msg-send-${instance.id}-${Date.now()}`;

    const createdMessages = db.sendMessage({
      senderName: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.email,
      senderEmail: currentUser.email,
      recipients: instance.to,
      subject: instance.subject || '(No Subject)',
      bodyHtml: instance.bodyHtml,
      attachments: instance.attachments,
      clientMessageId,
    });

    useMailStore.getState().triggerRefresh();

    // Broadcast to all tabs + trigger same-tab refresh immediately
    realtimeService.broadcastRefresh();
    // Also emit NEW_MESSAGE events for each recipient in same-tab detection
    createdMessages.forEach((m) => {
      if (m.userState.recipientEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
        realtimeService.broadcastNewMessage({
          type: 'NEW_MESSAGE',
          messageId: m.id,
          senderName: m.senderName,
          subject: m.subject,
          recipientEmail: m.userState.recipientEmail,
        });
      }
    });

    closeCompose(instance.id, true);
    addToast({ message: 'Message sent', type: 'success' });
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
        className="w-64 h-11 bg-slate-900 text-white rounded-t-xl shadow-mexo-lg border border-slate-800 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-all select-none"
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
        transform: instance.isMaximized ? 'none' : `translate(${position.x}px, ${position.y}px)`,
      }}
      className={`bg-white dark:bg-slate-900 rounded-t-2xl shadow-mexo-popover border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-shadow duration-200 ${
        instance.isMaximized
          ? 'fixed inset-4 z-50 rounded-2xl'
          : 'w-full md:w-[560px] h-[580px] z-40 max-w-full'
      }`}
    >
      {/* Compose Header Bar (Draggable) */}
      <div
        onMouseDown={handleMouseDownHeader}
        onTouchStart={handleTouchStartHeader}
        className="h-11 bg-slate-900 text-white px-4 flex items-center justify-between select-none cursor-grab active:cursor-grabbing"
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
            <span className="font-semibold text-mexo-700">Uploading attachment...</span>
            <div className="flex-1 h-1.5 bg-mexo-200 rounded-full overflow-hidden">
              <div className="h-full bg-mexo-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
            </div>
            <span className="font-bold text-mexo-700">{uploadProgress}%</span>
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
                <span className="truncate max-w-[120px]">{att.filename}</span>
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
            <input type="file" onChange={handleFileUpload} className="hidden" />
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
    <div className="fixed bottom-0 right-6 z-40 flex items-end space-x-4 max-w-full">
      {instances.map((inst) => (
        <ComposeWindow key={inst.id} instance={inst} />
      ))}
    </div>
  );
};
