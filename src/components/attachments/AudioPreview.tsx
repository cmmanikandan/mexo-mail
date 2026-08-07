import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { Music, Loader2, AlertCircle } from 'lucide-react';

interface AudioPreviewProps {
  attachment: Partial<Attachment>;
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({ attachment }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileName = getCleanFileName(attachment);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    attachmentService
      .fetchAttachmentBlob(attachment)
      .then(({ objectUrl }) => {
        if (isMounted) {
          setAudioUrl(objectUrl);
          setIsLoading(false);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Audio playback unavailable.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attachment]);

  return (
    <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
      <div className="w-20 h-20 rounded-2xl bg-sky-950/80 border border-sky-800/60 text-sky-400 mx-auto flex items-center justify-center shadow-lg">
        <Music className="w-10 h-10" />
      </div>
      <div>
        <h4 className="text-lg font-extrabold text-white truncate" title={fileName}>
          {fileName}
        </h4>
        <p className="text-xs text-slate-400 mt-1">Audio File • {formatFileSize(attachment.sizeBytes || 0)}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          <span className="text-xs font-mono">Preparing audio stream...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center space-x-2 text-amber-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-xs">{error}</span>
        </div>
      ) : audioUrl ? (
        <audio src={audioUrl} controls className="w-full rounded-xl" />
      ) : null}
    </div>
  );
};
