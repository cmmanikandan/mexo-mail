import React from 'react';
import { Attachment } from '../../types/mail';
import { useUIStore } from '../../store/uiStore';
import { getCleanFileName, formatFileSize, getAttachmentStorageProvider, isImageAttachment } from '../../config/attachmentConfig';
import { getFileCategory, getFileTypeLabel } from '../../utils/fileCategory';
import {
  downloadAttachment,
  openAttachmentInNewTab,
} from '../../utils/attachmentDownloader';
import { PdfPreview } from './PdfPreview';
import { ImagePreview } from './ImagePreview';
import { TextPreview } from './TextPreview';
import { AudioPreview } from './AudioPreview';
import { VideoPreview } from './VideoPreview';
import { UnsupportedPreview } from './UnsupportedPreview';
import { ArrowLeft, ExternalLink, Download, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface AttachmentViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

/**
 * Card shown for old Cloudinary non-image documents that can't be accessed (HTTP 401).
 * Instead of silently failing or showing a spinner that never resolves, we explain the issue clearly.
 */
const LegacyCloudinaryDocumentCard: React.FC<{ fileName: string; typeLabel: string }> = ({
  fileName,
  typeLabel,
}) => (
  <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-amber-700/40 text-center space-y-5 shadow-2xl">
    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-700/30 mx-auto flex items-center justify-center shadow-lg">
      <AlertTriangle className="w-10 h-10 text-amber-400" />
    </div>

    <div>
      <h4 className="text-lg font-extrabold text-white truncate" title={fileName}>
        {fileName}
      </h4>
      <p className="text-xs text-slate-400 mt-1">{typeLabel}</p>
    </div>

    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-700/25 text-left space-y-2">
      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
        Attachment needs re-sending
      </p>
      <p className="text-xs text-slate-300 leading-relaxed">
        This document was stored in an older format that is no longer accessible.
        Please ask the sender to re-attach the file in a new email.
      </p>
    </div>
  </div>
);

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachment, onClose }) => {
  const { addToast } = useUIStore();

  const category = getFileCategory(attachment);
  const typeLabel = getFileTypeLabel(attachment);
  const fileName = getCleanFileName(attachment);

  // Determine if this is a legacy Cloudinary non-image document (will 401 on access)
  const provider = getAttachmentStorageProvider(attachment);
  const isImg = isImageAttachment(attachment);
  const isLegacyCloudinaryDoc = provider === 'cloudinary' && !isImg;

  const handleDownload = () => downloadAttachment(attachment, addToast);
  const handleOpenExternally = () => openAttachmentInNewTab(attachment, addToast);

  const renderPreview = () => {
    // Block legacy Cloudinary documents — show explanatory card instead of broken viewer
    if (isLegacyCloudinaryDoc) {
      return <LegacyCloudinaryDocumentCard fileName={fileName} typeLabel={typeLabel} />;
    }

    switch (category) {
      case 'pdf':
        return (
          <PdfPreview
            attachment={attachment}
            onDownload={handleDownload}
            onOpenExternally={handleOpenExternally}
          />
        );
      case 'image':
        return <ImagePreview attachment={attachment} />;
      case 'text':
        return (
          <TextPreview
            attachment={attachment}
            onDownload={handleDownload}
            onOpenExternally={handleOpenExternally}
          />
        );
      case 'audio':
        return <AudioPreview attachment={attachment} />;
      case 'video':
        return <VideoPreview attachment={attachment} />;
      default:
        return (
          <UnsupportedPreview
            attachment={attachment}
            onDownload={handleDownload}
            onOpenExternally={handleOpenExternally}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      {/* Container: Full Screen on Mobile, max 1200px on Desktop */}
      <div className="w-full h-full md:w-[min(1200px,94vw)] md:h-[90vh] bg-slate-900 text-white md:rounded-3xl border-0 md:border border-slate-800 flex flex-col overflow-hidden shadow-2xl">

        {/* Top Navigation Toolbar */}
        <div className="h-14 px-4 md:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between select-none flex-shrink-0 pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close preview"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={fileName}>
                {fileName}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {typeLabel}
                {attachment.sizeBytes ? ` • ${formatFileSize(attachment.sizeBytes)}` : ''}
                {isLegacyCloudinaryDoc && (
                  <span className="ml-1.5 text-amber-400">⚠ Needs re-sending</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {!isLegacyCloudinaryDoc && (
              <button
                type="button"
                onClick={handleOpenExternally}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Open</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0878e8] hover:bg-[#0668cc] rounded-xl flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              title="Download"
              disabled={isLegacyCloudinaryDoc}
            >
              <Download className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded-xl transition-colors ml-1 cursor-pointer"
              aria-label="Close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Workspace Area */}
        <div className="flex-1 bg-slate-950 overflow-hidden relative flex items-center justify-center p-2 md:p-6 pb-[calc(var(--bottom-nav-height,64px)+env(safe-area-inset-bottom,0px)+16px)] md:pb-6">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};
