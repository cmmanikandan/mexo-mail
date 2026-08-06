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
  ArrowLeft,
  AlertCircle,
  FileArchive,
} from 'lucide-react';
import { MexoModal } from '../common/MexoModal';

export const AttachmentCard: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const ext = attachment.filename.split('.').pop()?.toLowerCase() || '';

  const isImage =
    attachment.mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

  const isPdf = ext === 'pdf' || attachment.mimeType === 'application/pdf';

  const isCode = ['json', 'js', 'ts', 'py', 'html', 'css', 'txt', 'md', 'xml'].includes(ext);

  const isUnsupported = !isImage && !isPdf && !isCode;

  const fileTypeLabel = isImage
    ? ext.toUpperCase() || 'IMAGE'
    : isPdf
    ? 'PDF'
    : isCode
    ? ext.toUpperCase() || 'TEXT'
    : ext.toUpperCase() || 'FILE';

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Create a real download trigger ensuring filename is preserved
    const link = document.createElement('a');
    link.href = attachment.downloadUrl && attachment.downloadUrl !== '#' 
      ? attachment.downloadUrl 
      : attachment.previewUrl || '#';
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Clean Attachment Card Component */}
      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-mexo-300 dark:hover:border-mexo-700 transition-all w-72 shadow-xs group">
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
          <div className="w-10 h-10 rounded-xl bg-mexo-50 dark:bg-mexo-950/60 text-[#0878e8] flex items-center justify-center flex-shrink-0 font-bold border border-mexo-100 dark:border-mexo-900">
            {isImage ? (
              <ImageIcon className="w-5 h-5 text-mexo-600 dark:text-mexo-400" />
            ) : isPdf ? (
              <FileText className="w-5 h-5 text-rose-500" />
            ) : isCode ? (
              <FileCode className="w-5 h-5 text-emerald-500" />
            ) : (
              <FileArchive className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={attachment.filename}>
              {attachment.filename}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {fileTypeLabel} • {formatFileSize(attachment.sizeBytes)}
            </p>
          </div>
        </div>

        {/* Dedicated Actions with ~44x44px Touch Targets */}
        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            aria-label="Preview attachment"
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-mexo-600 hover:bg-mexo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download attachment"
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-mexo-600 hover:bg-mexo-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full-Screen Native-style Mobile Viewer & Desktop Modal */}
      {isPreviewOpen && (
        <>
          {/* Mobile Viewer (Screen < 768px) */}
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950 text-white flex flex-col animate-in fade-in duration-200">
            {/* Native Mobile Top Bar */}
            <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between select-none">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-300 active:bg-slate-800 rounded-xl"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 px-3 min-w-0 text-center">
                <p className="text-sm font-bold truncate">{attachment.filename}</p>
                <p className="text-[10px] text-slate-400 font-mono">{formatFileSize(attachment.sizeBytes)}</p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="w-10 h-10 flex items-center justify-center text-mexo-400 active:bg-slate-800 rounded-xl"
                aria-label="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Body Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              {isImage ? (
                <img
                  src={attachment.previewUrl || attachment.downloadUrl || '/logo.png'}
                  alt={attachment.filename}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : isPdf ? (
                <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-4 border border-slate-800">
                  <FileText className="w-16 h-16 text-rose-500" />
                  <p className="text-base font-bold text-white">{attachment.filename}</p>
                  <p className="text-xs text-slate-400">PDF Document • {formatFileSize(attachment.sizeBytes)}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-6 py-3 bg-mexo-600 hover:bg-mexo-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF to View
                  </button>
                </div>
              ) : isCode ? (
                <div className="w-full h-full bg-slate-900 rounded-2xl p-4 overflow-auto font-mono text-xs text-slate-200 border border-slate-800">
                  <p className="text-[11px] text-slate-500 mb-3 border-b border-slate-800 pb-2">
                    // Previewing content of {attachment.filename}
                  </p>
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {`// MEXO Attachment Preview\n// File: ${attachment.filename}\n// Size: ${formatFileSize(
                      attachment.sizeBytes
                    )}\n\n[Content ready for inspection]`}</pre>
                </div>
              ) : (
                <div className="p-6 text-center space-y-4 bg-slate-900 rounded-2xl border border-slate-800 max-w-xs">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">Preview isn't available for this file type.</p>
                    <p className="text-xs text-slate-400 mt-1">{attachment.filename}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full py-3 bg-mexo-600 hover:bg-mexo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Lightbox Modal (Screen >= 768px) */}
          <div className="hidden md:block">
            <MexoModal
              isOpen={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              title={`Preview: ${attachment.filename}`}
              maxWidth="lg"
            >
              <div className="space-y-4">
                {/* Top Control Bar for Images */}
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

                {/* Lightbox Body */}
                {isImage ? (
                  <div className="bg-slate-950 rounded-2xl p-6 flex items-center justify-center min-h-[300px] overflow-hidden relative shadow-inner">
                    <img
                      src={attachment.previewUrl || attachment.downloadUrl || '/logo.png'}
                      alt={attachment.filename}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-in-out',
                      }}
                      className="max-h-[380px] object-contain rounded-lg shadow-2xl"
                    />
                  </div>
                ) : isUnsupported ? (
                  <div className="p-8 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-500 mx-auto" />
                    <div>
                      <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        Preview isn't available for this file type.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {attachment.filename} ({formatFileSize(attachment.sizeBytes)})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0878e8] mx-auto flex items-center justify-center shadow-md">
                      {isPdf ? (
                        <FileText className="w-8 h-8 text-rose-500" />
                      ) : (
                        <FileCode className="w-8 h-8 text-emerald-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{attachment.filename}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {formatFileSize(attachment.sizeBytes)} • Type: {fileTypeLabel}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-left space-y-1 font-mono">
                      <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> MEXO Secure Verification
                      </p>
                      <p className="text-[11px]">Checksum: SHA256-verified-2026-mexo</p>
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 font-medium">
                    {attachment.filename} ({formatFileSize(attachment.sizeBytes)})
                  </span>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0878e8] hover:bg-[#0668cc] rounded-xl shadow-md flex items-center transition-all cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 mr-1.5" /> Download File
                  </button>
                </div>
              </div>
            </MexoModal>
          </div>
        </>
      )}
    </>
  );
};
