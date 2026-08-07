import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService, FetchedBlobResult } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
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
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('[PdfPreview Error]', err);
        setIsLoading(false);
        setError(err.message || 'Unable to open attachment.');
      });

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [attachment, retryKey]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.6));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 flex flex-col relative">
      {/* PDF Controls Toolbar */}
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs select-none flex-shrink-0">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
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
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]" title={fileName}>
          {fileName}
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-900/90 flex flex-col items-center justify-center space-y-3 p-6 text-slate-300">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
            <p className="text-sm font-bold text-white">Opening attachment...</p>
            <p className="text-xs text-slate-400 font-mono">{fileName}</p>
          </div>
        )}

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900">
            <AlertCircle className="w-14 h-14 text-rose-500 mx-auto" />
            <div>
              <h4 className="text-lg font-extrabold text-white">Unable to open attachment</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
            </div>
            <div className="flex items-center justify-center space-x-2.5 pt-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
              </button>
              <button
                type="button"
                onClick={onDownload}
                className="px-4 py-2.5 bg-[#0878e8] hover:bg-[#0668cc] text-white text-xs font-bold rounded-xl flex items-center cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4 mr-1.5" /> Download
              </button>
              <button
                type="button"
                onClick={onOpenExternally}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" /> Open externally
              </button>
            </div>
          </div>
        ) : pdfObjectUrl ? (
          <div
            className="w-full h-full flex items-center justify-center overflow-auto p-1"
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
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
