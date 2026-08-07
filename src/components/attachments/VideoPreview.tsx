import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { Loader2, AlertCircle } from 'lucide-react';

interface VideoPreviewProps {
  attachment: Partial<Attachment>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ attachment }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileName = getCleanFileName(attachment);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    attachmentService
      .fetchAttachmentBlob(attachment)
      .then(({ objectUrl }) => {
        if (isMounted) {
          setVideoUrl(objectUrl);
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Video playback unavailable.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attachment]);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center space-y-3 text-slate-300">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-xs font-mono">Loading {fileName}...</p>
        </div>
      ) : error ? (
        <div className="text-center p-6 text-slate-400 max-w-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
          <p className="font-bold text-white text-sm">{error}</p>
        </div>
      ) : videoUrl ? (
        <video
          src={videoUrl}
          controls
          controlsList="nodownload"
          className="max-w-full max-h-full rounded-2xl shadow-2xl"
        />
      ) : null}
    </div>
  );
};
