import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImagePreviewProps {
  attachment: Partial<Attachment>;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ attachment }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const fileName = getCleanFileName(attachment);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    attachmentService
      .fetchAttachmentBlob(attachment)
      .then(({ objectUrl }) => {
        if (isMounted) {
          setImageUrl(objectUrl);
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(objectUrl);
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
  }, [attachment]);

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
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
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
          <Loader2 className="w-8 h-8 animate-spin text-mexo-500" />
          <p className="text-xs font-mono">Loading {fileName}...</p>
        </div>
      ) : error ? (
        <div className="text-center p-6 text-slate-400 max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
          <p className="font-bold text-white text-sm">{error}</p>
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
          />
        </div>
      ) : null}
    </div>
  );
};
