import React from 'react';
import { Attachment } from '../../types/mail';
import { useUIStore } from '../../store/uiStore';
import { getCleanFileName } from '../../config/attachmentConfig';
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
import { ArrowLeft, ExternalLink, Download, X } from 'lucide-react';

interface AttachmentViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachment, onClose }) => {
  const { addToast } = useUIStore();

  const category = getFileCategory(attachment);
  const typeLabel = getFileTypeLabel(attachment);
  const fileName = getCleanFileName(attachment);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => downloadAttachment(attachment, addToast);
  const handleOpenExternally = () => openAttachmentInNewTab(attachment, addToast);

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
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Close preview"
              title="Back / Close"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md" title={fileName}>
                {fileName}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {typeLabel} • {formatFileSize(attachment.sizeBytes)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenExternally}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center space-x-1 transition-colors cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Open</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0878e8] hover:bg-[#0668cc] rounded-xl flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer"
              title="Download"
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
          {category === 'pdf' && (
            <PdfPreview
              attachment={attachment}
              onDownload={handleDownload}
              onOpenExternally={handleOpenExternally}
            />
          )}

          {category === 'image' && (
            <ImagePreview attachment={attachment} />
          )}

          {category === 'text' && (
            <TextPreview
              attachment={attachment}
              onDownload={handleDownload}
              onOpenExternally={handleOpenExternally}
            />
          )}

          {category === 'audio' && (
            <AudioPreview attachment={attachment} />
          )}

          {category === 'video' && (
            <VideoPreview attachment={attachment} />
          )}

          {(category === 'document' ||
            category === 'presentation' ||
            category === 'spreadsheet' ||
            category === 'archive' ||
            category === 'other') && (
            <UnsupportedPreview
              attachment={attachment}
              onDownload={handleDownload}
              onOpenExternally={handleOpenExternally}
            />
          )}
        </div>
      </div>
    </div>
  );
};
