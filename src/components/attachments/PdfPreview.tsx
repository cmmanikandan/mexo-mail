import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService, AttachmentError } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';

interface PdfPreviewProps {
  attachment: Partial<Attachment>;
  onDownload: () => void;
  onOpenExternally: () => void;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  attachment,
  onDownload,
  onOpenExternally,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileName = getCleanFileName(attachment);

  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setPdfObjectUrl(null);

    attachmentService
      .fetchAttachmentBlob(attachment)
      .then(({ objectUrl }) => {
        if (!isMounted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        createdUrl = objectUrl;
        setPdfObjectUrl(objectUrl);
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('[PdfPreview Error]', err);
        setIsLoading(false);
        setError(err.message || 'Unable to open this PDF.');
        if (err instanceof AttachmentError) {
          setErrorType(err.type);
        }
      });

    return () => {
      isMounted = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [attachment, retryKey]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.6));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleRetry = () => setRetryKey((k) => k + 1);

  const renderError = () => {
    const isOffline = errorType === 'network';
    const isRetryable = errorType === 'auth_expired' || errorType === 'network' || errorType === 'unknown';
    const isGone = errorType === 'not_found';

    const ErrorIcon = isOffline ? WifiOff : isGone ? AlertTriangle : AlertCircle;
    const iconColor = isOffline
      ? 'text-sky-400'
      : isGone
        ? 'text-amber-400'
        : 'text-rose-500';

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900 w-full h-full">
        <ErrorIcon className={`w-14 h-14 ${iconColor} mx-auto`} />
        <div>
          <h4 className="text-lg font-extrabold text-white">
            {isOffline ? "You're offline" : isGone ? 'Attachment unavailable' : 'Unable to open PDF'}
          </h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
        </div>
        <div className="flex items-center justify-center flex-wrap gap-2.5 pt-1">
          {isRetryable && (
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center cursor-pointer shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
            </button>
          )}
          <button
            type="button"
            onClick={onDownload}
            className="px-4 py-2.5 bg-[#0878e8] hover:bg-[#0668cc] text-white text-xs font-bold rounded-xl flex items-center cursor-pointer shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4 mr-1.5" /> Download
          </button>
          {!isGone && (
            <button
              type="button"
              onClick={onOpenExternally}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center cursor-pointer transition-all active:scale-95"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 flex flex-col relative">
      {/* PDF Controls Toolbar */}
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={!pdfObjectUrl}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={!pdfObjectUrl}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            disabled={!pdfObjectUrl}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]" title={fileName}>
          {fileName}
        </div>

        {!isLoading && !error && (
          <button
            type="button"
            onClick={handleRetry}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Reload PDF"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        {(isLoading || error) && <div className="w-6" />}
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center space-y-3 p-6">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="text-sm font-bold text-white">Opening {fileName}…</p>
            <p className="text-xs text-slate-500 font-mono">Generating secure access…</p>
          </div>
        )}

        {error ? (
          renderError()
        ) : pdfObjectUrl ? (
          <div
            className="w-full h-full flex items-center justify-center overflow-auto p-1"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
              transformOrigin: 'center center',
            }}
          >
            <iframe
              key={`pdf-frame-${retryKey}`}
              src={pdfObjectUrl}
              title={fileName}
              className="w-full h-full border-none rounded-xl bg-white shadow-2xl"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
