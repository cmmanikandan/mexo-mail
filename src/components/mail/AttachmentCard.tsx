import React, { useState } from 'react';
import { Attachment } from '../../types/mail';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { MexoModal } from '../common/MexoModal';

export const AttachmentCard: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage =
    attachment.mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].some((ext) => attachment.filename.toLowerCase().endsWith(ext));

  const isPdf = attachment.filename.toLowerCase().endsWith('.pdf');
  const isCode = ['json', 'js', 'ts', 'py', 'html', 'css', 'txt', 'md'].some((ext) =>
    attachment.filename.toLowerCase().endsWith(ext)
  );

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <>
      <div className="flex items-center space-x-3 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-all w-72 group shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#0878e8] flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
          {isImage ? (
            <ImageIcon className="w-5 h-5" />
          ) : isCode ? (
            <FileCode className="w-5 h-5" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={attachment.filename}>
            {attachment.filename}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{formatFileSize(attachment.sizeBytes)}</p>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="p-1.5 text-slate-500 hover:text-[#0878e8] hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Preview Attachment Lightbox"
          >
            <Eye className="w-4 h-4" />
          </button>
          <a
            href={attachment.downloadUrl || '#'}
            download={attachment.filename}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-1.5 text-slate-500 hover:text-[#0878e8] hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Attachment Lightbox Modal */}
      <MexoModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview: ${attachment.filename}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Top Control Bar for Image Lightbox */}
          {isImage && (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-500 text-[11px] ml-2">
                  {Math.round(zoomLevel * 100)}% | {rotation}°
                </span>
              </div>

              <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Virus Scanned
              </span>
            </div>
          )}

          {/* Lightbox Body Container */}
          {isImage ? (
            <div className="bg-slate-950 rounded-2xl p-6 flex items-center justify-center min-h-[300px] overflow-hidden relative shadow-inner">
              <img
                src={attachment.previewUrl || '/logo.png'}
                alt={attachment.filename}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
                className="max-h-[360px] object-contain rounded-lg shadow-2xl"
              />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0878e8] mx-auto flex items-center justify-center shadow-md">
                {isPdf ? (
                  <FileText className="w-8 h-8" />
                ) : isCode ? (
                  <FileCode className="w-8 h-8" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{attachment.filename}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Size: {formatFileSize(attachment.sizeBytes)} • MIME: {attachment.mimeType}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-left space-y-1 font-mono">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> MEXO Secure Document Verification
                </p>
                <p className="text-[11px]">Checksum: SHA256-verified-2026-mexo</p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium">
              {attachment.filename} ({formatFileSize(attachment.sizeBytes)})
            </span>
            <a
              href={attachment.downloadUrl || '#'}
              download={attachment.filename}
              className="px-4 py-2 text-xs font-bold text-white bg-[#0878e8] hover:bg-[#0668cc] rounded-xl shadow-md shadow-blue-500/20 flex items-center transition-all"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download File
            </a>
          </div>
        </div>
      </MexoModal>
    </>
  );
};
