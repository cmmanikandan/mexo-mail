import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { useUIStore } from '../../store/uiStore';
import {
  getFileCategory,
  getFileExtension,
  getFileTypeLabel,
} from '../../utils/fileCategory';
import {
  downloadAttachment,
  openAttachmentInNewTab,
} from '../../utils/attachmentDownloader';
import { attachmentService, FetchedBlobResult } from '../../services/attachmentService';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCode,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  Music,
  Video,
  File,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export interface AttachmentCardProps {
  attachment: Attachment;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment }) => {
  const { addToast } = useUIStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Dynamic access URL state for image thumbnails / direct views
  const [accessUrl, setAccessUrl] = useState<string>('');

  // Text file fetching state
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);

  // PDF rendering state
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [isPdfError, setIsPdfError] = useState(false);
  const [pdfErrorMessage, setPdfErrorMessage] = useState<string | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [pdfRetryKey, setPdfRetryKey] = useState(0);

  const category = getFileCategory(attachment);
  const ext = getFileExtension(attachment);
  const typeLabel = getFileTypeLabel(attachment);
  const fileName = attachment.originalFileName || attachment.filename || 'Attachment';

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Fetch access URL for preview thumbnail (Images)
  useEffect(() => {
    let isMounted = true;
    if (category === 'image') {
      attachmentService
        .getAttachmentAccessUrl(attachment)
        .then((url) => {
          if (isMounted) setAccessUrl(url);
        })
        .catch(() => {
          if (isMounted) setAccessUrl('');
        });
    }
    return () => {
      isMounted = false;
    };
  }, [attachment, category]);

  // PDF Fetching & Blob Object URL generation with Retry + Fresh Signed URL
  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    if (isPreviewOpen && category === 'pdf') {
      setIsPdfLoading(true);
      setIsPdfError(false);
      setPdfErrorMessage(null);
      setPdfObjectUrl(null);

      attachmentService
        .fetchAttachmentBlob(attachment)
        .then(({ objectUrl }: FetchedBlobResult) => {
          if (!isMounted) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          createdUrl = objectUrl;
          setPdfObjectUrl(objectUrl);
          setIsPdfLoading(false);
        })
        .catch((err: any) => {
          if (!isMounted) return;
          console.error('[PDF Preview Error]', err);
          setIsPdfLoading(false);
          setIsPdfError(true);
          setPdfErrorMessage(err.message || 'Unable to open attachment.');
        });
    }

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isPreviewOpen, category, attachment, pdfRetryKey]);

  // Fetch text content when opening text/csv preview
  useEffect(() => {
    if (isPreviewOpen && (category === 'text' || ext === 'csv')) {
      setIsLoadingText(true);
      setTextError(null);
      attachmentService
        .fetchAttachmentBlob(attachment)
        .then(({ blob }) => blob.text())
        .then((data) => {
          setTextContent(data.slice(0, 100000));
          setIsLoadingText(false);
        })
        .catch((err: any) => {
          console.error('Failed to fetch text content:', err);
          setTextError(err.message || 'Unable to load text preview content directly.');
          setIsLoadingText(false);
        });
    }
  }, [isPreviewOpen, category, ext, attachment]);

  // Render category icon
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
      {/* ─── Attachment Card ────────────────────────────────────────────────── */}
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

          {/* File Name & Info */}
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

      {/* ─── Full-Size Desktop & Mobile Viewer Overlay ───────────────────────── */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
          <div className="w-full h-full md:w-[min(1200px,94vw)] md:h-[90vh] bg-slate-900 text-white md:rounded-3xl border-0 md:border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            
            {/* Top Toolbar Header */}
            <div className="h-14 px-4 md:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between select-none flex-shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
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

              {/* Action Toolbar */}
              <div className="flex items-center space-x-2">
                {category === 'image' && (
                  <div className="hidden sm:flex items-center space-x-1 mr-2 px-2 py-1 bg-slate-800 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-mono"
                      title="Reset Zoom"
                    >
                      Reset
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openAttachmentInNewTab(attachment, addToast)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl flex items-center space-x-1 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Open</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadAttachment(attachment, addToast)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0878e8] hover:bg-[#0668cc] rounded-xl flex items-center space-x-1 shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Download"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded-xl transition-colors ml-1"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Workspace Content */}
            <div className="flex-1 bg-slate-950 overflow-hidden relative flex items-center justify-center p-2 md:p-6 pb-[calc(var(--bottom-nav-height,64px)+env(safe-area-inset-bottom,0px)+16px)] md:pb-6">
              
              {/* IMAGE VIEWER */}
              {category === 'image' && (
                <div className="w-full h-full flex items-center justify-center overflow-auto p-2 relative select-none">
                  {accessUrl ? (
                    <img
                      src={accessUrl}
                      alt={fileName}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s ease-in-out',
                      }}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                      <p className="font-bold">Image preview unavailable</p>
                    </div>
                  )}
                </div>
              )}

              {/* PDF VIEWER */}
              {category === 'pdf' && (
                <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 flex flex-col relative">
                  {/* Loading State */}
                  {isPdfLoading && !isPdfError && (
                    <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center space-y-3 p-6 text-slate-300">
                      <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                      <p className="text-sm font-bold text-white">Opening attachment...</p>
                      <p className="text-xs text-slate-400 font-mono">{fileName}</p>
                    </div>
                  )}

                  {/* Error State with Retry requesting a NEW fresh signed URL */}
                  {isPdfError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900">
                      <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
                      <div>
                        <h4 className="text-lg font-extrabold text-white">Unable to open attachment</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          {pdfErrorMessage || 'The file could not be retrieved from storage.'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2.5 pt-2 flex-wrap gap-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            console.log('[PDF] Retrying attachment access with fresh signed URL for:', fileName);
                            setPdfRetryKey((k) => k + 1);
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center shadow-sm cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(attachment, addToast)}
                          className="px-4 py-2.5 bg-[#0878e8] hover:bg-[#0668cc] text-white text-xs font-bold rounded-xl flex items-center shadow-md cursor-pointer"
                        >
                          <Download className="w-4 h-4 mr-1.5" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => openAttachmentInNewTab(attachment, addToast)}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
                        </button>
                      </div>
                    </div>
                  ) : pdfObjectUrl ? (
                    <iframe
                      key={`pdf-frame-${pdfRetryKey}`}
                      src={pdfObjectUrl}
                      title={fileName}
                      className="w-full h-full border-none rounded-2xl bg-white"
                    />
                  ) : null}
                </div>
              )}

              {/* WORD DOCUMENT VIEWER */}
              {category === 'document' && (
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-blue-950/80 border border-blue-800/60 text-blue-400 mx-auto flex items-center justify-center shadow-lg">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">Microsoft Word Document • {formatFileSize(attachment.sizeBytes)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-xs text-slate-300 border border-slate-800 text-left space-y-1 font-mono">
                    <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Document Safe Notice
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Direct DOCX preview is not natively supported in web browsers. Use Open or Download to view in Word.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openAttachmentInNewTab(attachment, addToast)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(attachment, addToast)}
                      className="px-5 py-2.5 bg-[#0878e8] hover:bg-[#0668cc] text-white text-xs font-bold rounded-xl flex items-center shadow-md"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Download file
                    </button>
                  </div>
                </div>
              )}

              {/* POWERPOINT PRESENTATION VIEWER */}
              {category === 'presentation' && (
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
                    <Presentation className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">PowerPoint Presentation • {formatFileSize(attachment.sizeBytes)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-xs text-slate-300 border border-slate-800 text-left space-y-1 font-mono">
                    <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Presentation Notice
                    </p>
                    <p className="text-[11px] text-slate-400">
                      PPTX files cannot be previewed natively. Click Download or Open to view presentation slides.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openAttachmentInNewTab(attachment, addToast)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(attachment, addToast)}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center shadow-md"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Download file
                    </button>
                  </div>
                </div>
              )}

              {/* SPREADSHEET VIEWER (Excel / CSV) */}
              {category === 'spreadsheet' && (
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">{typeLabel} • {formatFileSize(attachment.sizeBytes)}</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-xs text-slate-300 border border-slate-800 text-left space-y-1 font-mono">
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Spreadsheet Notice
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Excel worksheets require Excel or a compatible spreadsheet application to inspect data.
                    </p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openAttachmentInNewTab(attachment, addToast)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(attachment, addToast)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center shadow-md"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Download file
                    </button>
                  </div>
                </div>
              )}

              {/* TEXT / CODE VIEWER */}
              {category === 'text' && (
                <div className="w-full h-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden">
                  {isLoadingText ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-slate-400">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <p className="text-xs font-mono">Loading {fileName}...</p>
                    </div>
                  ) : textError ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <AlertCircle className="w-12 h-12 text-amber-500" />
                      <p className="text-sm font-bold text-white">{textError}</p>
                      <div className="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => openAttachmentInNewTab(attachment, addToast)}
                          className="px-4 py-2 bg-slate-800 text-xs font-bold rounded-xl"
                        >
                          Open externally
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadAttachment(attachment, addToast)}
                          className="px-4 py-2 bg-indigo-600 text-xs font-bold rounded-xl"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950">
                      <pre className="whitespace-pre-wrap font-mono">
                        <code>{textContent}</code>
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO VIEWER */}
              {category === 'video' && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {accessUrl ? (
                    <video
                      src={accessUrl}
                      controls
                      controlsList="nodownload"
                      className="max-w-full max-h-full rounded-2xl shadow-2xl"
                    />
                  ) : (
                    <p className="text-slate-400 text-xs font-mono">Video URL unavailable</p>
                  )}
                </div>
              )}

              {/* AUDIO VIEWER */}
              {category === 'audio' && (
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-sky-950/80 border border-sky-800/60 text-sky-400 mx-auto flex items-center justify-center shadow-lg">
                    <Music className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">Audio File • {formatFileSize(attachment.sizeBytes)}</p>
                  </div>
                  {accessUrl && (
                    <audio src={accessUrl} controls className="w-full rounded-xl" />
                  )}
                </div>
              )}

              {/* UNSUPPORTED FILE FORMAT / ARCHIVE VIEWER */}
              {(category === 'archive' || category === 'other') && (
                <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-amber-950/80 border border-amber-800/60 text-amber-500 mx-auto flex items-center justify-center shadow-lg">
                    <FileArchive className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Preview isn't available directly for this file type.</h4>
                    <p className="text-xs text-slate-400 mt-1">{fileName} ({formatFileSize(attachment.sizeBytes)})</p>
                  </div>
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => openAttachmentInNewTab(attachment, addToast)}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadAttachment(attachment, addToast)}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center shadow-md"
                    >
                      <Download className="w-4 h-4 mr-1.5" /> Download file
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
