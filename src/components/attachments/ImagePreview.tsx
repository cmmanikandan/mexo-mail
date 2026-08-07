import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw, RefreshCw } from 'lucide-react';

interface ImagePreviewProps {
  attachment: Partial<Attachment>;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ attachment }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileName = getCleanFileName(attachment);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    // Images → get direct Cloudinary CDN URL (no blob download needed, fast public CDN)
    attachmentService
      .getAttachmentAccessUrl(attachment)
      .then((url) => {
        if (isMounted) {
          setImageUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Image preview unavailable');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attachment, retryKey]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none overflow-hidden bg-slate-950">
      {/* Controls Bar */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl text-xs border border-slate-800 shadow-lg">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-500 min-w-[36px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-3 w-px bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={handleRotate}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          title="Rotate"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-3 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono">Loading {fileName}…</p>
        </div>
      ) : error ? (
        <div className="text-center p-6 text-slate-400 max-w-sm space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <p className="font-bold text-white text-sm">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center mx-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Retry
          </button>
        </div>
      ) : imageUrl ? (
        <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
          <img
            src={imageUrl}
            alt={fileName}
            style={{
              transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
              objectFit: 'contain',
            }}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onError={() => {
              setError('Could not load image. The file may be unavailable.');
              setImageUrl(null);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
