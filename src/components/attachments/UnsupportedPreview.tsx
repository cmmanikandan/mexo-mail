import React from 'react';
import { Attachment } from '../../types/mail';
import { getCleanFileName } from '../../config/attachmentConfig';
import { getFileTypeLabel, getFileCategory } from '../../utils/fileCategory';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  FileArchive,
  File,
  ShieldCheck,
  ExternalLink,
  Download,
} from 'lucide-react';

interface UnsupportedPreviewProps {
  attachment: Partial<Attachment>;
  onDownload: () => void;
  onOpenExternally: () => void;
}

export const UnsupportedPreview: React.FC<UnsupportedPreviewProps> = ({
  attachment,
  onDownload,
  onOpenExternally,
}) => {
  const fileName = getCleanFileName(attachment);
  const typeLabel = getFileTypeLabel(attachment);
  const category = getFileCategory(attachment);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderIcon = () => {
    switch (category) {
      case 'document':
        return <FileText className="w-10 h-10 text-blue-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-10 h-10 text-emerald-400" />;
      case 'presentation':
        return <Presentation className="w-10 h-10 text-amber-400" />;
      case 'archive':
        return <FileArchive className="w-10 h-10 text-amber-500" />;
      default:
        return <File className="w-10 h-10 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
      <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 mx-auto flex items-center justify-center shadow-lg">
        {renderIcon()}
      </div>

      <div>
        <h4 className="text-lg font-extrabold text-white truncate" title={fileName}>
          {fileName}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          {typeLabel} • {formatFileSize(attachment.sizeBytes || 0)}
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-slate-950 text-xs text-slate-300 border border-slate-800 text-left space-y-1 font-mono">
        <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> File Notice
        </p>
        <p className="text-[11px] text-slate-400">
          Direct browser inline preview is not supported for this format. Use Open or Download to inspect file contents.
        </p>
      </div>

      <div className="flex items-center justify-center space-x-3 pt-2">
        <button
          type="button"
          onClick={onOpenExternally}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center transition-colors cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="px-5 py-2.5 bg-[#0878e8] hover:bg-[#0668cc] text-white text-xs font-bold rounded-xl flex items-center shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Download className="w-4 h-4 mr-1.5" /> Download file
        </button>
      </div>
    </div>
  );
};
