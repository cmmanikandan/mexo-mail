import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { useUIStore } from '../../store/uiStore';
import { getCleanFileName, formatFileSize } from '../../config/attachmentConfig';
import {
  getFileCategory,
  getFileTypeLabel,
} from '../../utils/fileCategory';
import {
  downloadAttachment,
  openAttachmentInNewTab,
} from '../../utils/attachmentDownloader';
import { attachmentService } from '../../services/attachmentService';
import { AttachmentViewer } from './AttachmentViewer';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ExternalLink,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  Music,
  Video,
  File,
} from 'lucide-react';

export interface AttachmentCardProps {
  attachment: Attachment;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment }) => {
  const { addToast } = useUIStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [accessUrl, setAccessUrl] = useState<string>('');

  const category = getFileCategory(attachment);
  const typeLabel = getFileTypeLabel(attachment);
  const fileName = getCleanFileName(attachment);

  // Fetch access URL for preview thumbnail (Images)
  useEffect(() => {
    let isMounted = true;
    if (category === 'image') {
      attachmentService
        .getAttachmentAccessUrl(attachment)
        .then((url) => {
          if (isMounted) setAccessUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [attachment, category]);

  // Render icon according to category
  const renderCategoryIcon = (sizeClass = 'w-5 h-5') => {
    switch (category) {
      case 'image':
        return <ImageIcon className={`${sizeClass} text-mexo-600 dark:text-mexo-400`} />;
      case 'pdf':
        return <FileText className={`${sizeClass} text-rose-500`} />;
      case 'document':
        return <FileText className={`${sizeClass} text-blue-600`} />;
      case 'presentation':
        return <Presentation className={`${sizeClass} text-amber-500`} />;
      case 'spreadsheet':
        return <FileSpreadsheet className={`${sizeClass} text-emerald-600`} />;
      case 'text':
        return <FileCode className={`${sizeClass} text-indigo-500`} />;
      case 'video':
        return <Video className={`${sizeClass} text-purple-500`} />;
      case 'audio':
        return <Music className={`${sizeClass} text-sky-500`} />;
      case 'archive':
        return <FileArchive className={`${sizeClass} text-amber-600`} />;
      default:
        return <File className={`${sizeClass} text-slate-500`} />;
    }
  };

  return (
    <>
      {/* Inline Attachment Card */}
      <div className="group relative flex flex-col p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-mexo-400 dark:hover:border-mexo-600 hover:shadow-mexo-sm transition-all w-full max-w-xs select-none">
        <div
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-start space-x-3 min-w-0 cursor-pointer"
        >
          {/* Thumbnail for Images, Category Icon for Files */}
          {category === 'image' && accessUrl ? (
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
              <img
                src={accessUrl}
                alt={fileName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              {renderCategoryIcon('w-5 h-5')}
            </div>
          )}

          {/* File Name & Size */}
          <div className="flex-1 min-w-0 pr-1">
            <p
              className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-snug"
              title={fileName}
            >
              {fileName}
            </p>
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {typeLabel} • {formatFileSize(attachment.sizeBytes)}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center space-x-1 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 justify-end">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="Preview attachment"
            className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-mexo-600 hover:bg-mexo-50 dark:hover:bg-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Preview"
          >
            <Eye className="w-3.5 h-3.5 text-mexo-600 dark:text-mexo-400 mr-1" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={() => openAttachmentInNewTab(attachment, addToast)}
            aria-label="Open in new tab"
            className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-mexo-600 hover:bg-mexo-50 dark:hover:bg-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 mr-1" />
            <span className="hidden sm:inline">Open</span>
          </button>

          <button
            type="button"
            onClick={() => downloadAttachment(attachment, addToast)}
            aria-label="Download attachment"
            className="px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-bold text-[#0878e8] dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center space-x-1 transition-colors cursor-pointer"
            title="Download"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Attachment Viewer Dialog */}
      {isPreviewOpen && (
        <AttachmentViewer
          attachment={attachment}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
};
