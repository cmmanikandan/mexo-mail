import React, { useState, useEffect } from 'react';
import { Attachment } from '../../types/mail';
import { attachmentService } from '../../services/attachmentService';
import { getCleanFileName } from '../../config/attachmentConfig';
import { getFileExtension } from '../../utils/fileCategory';
import { Loader2, AlertCircle, Download, ExternalLink } from 'lucide-react';

interface TextPreviewProps {
  attachment: Partial<Attachment>;
  onDownload: () => void;
  onOpenExternally: () => void;
}

export const TextPreview: React.FC<TextPreviewProps> = ({
  attachment,
  onDownload,
  onOpenExternally,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fileName = getCleanFileName(attachment);
  const ext = getFileExtension(attachment);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    attachmentService
      .fetchAttachmentBlob(attachment)
      .then(({ blob }) => blob.text())
      .then((rawText) => {
        if (!isMounted) return;

        // Formatted JSON pretty-printing for .json files
        if (ext === 'json') {
          try {
            const parsed = JSON.parse(rawText);
            setTextContent(JSON.stringify(parsed, null, 2).slice(0, 150000));
            setIsLoading(false);
            return;
          } catch {
            // Fallback to raw text if JSON parse fails
          }
        }

        setTextContent(rawText.slice(0, 150000)); // Cap to 150KB for rendering speed
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('Failed to fetch text content:', err);
        setError(err.message || 'Unable to load text preview content.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [attachment, ext]);

  return (
    <div className="w-full h-full rounded-2xl bg-slate-900 border border-slate-800 flex flex-col overflow-hidden">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Loading {fileName}...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500" />
          <p className="text-sm font-bold text-white">{error}</p>
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onOpenExternally}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open externally
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Download
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed bg-slate-950 select-text">
          <pre className="whitespace-pre-wrap font-mono">
            <code>{textContent}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
