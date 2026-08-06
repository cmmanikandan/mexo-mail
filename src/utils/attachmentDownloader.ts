import { Attachment } from '../types/mail';

export const getAuthorizedAttachmentUrl = (attachment: Partial<Attachment>): string => {
  const candidate = attachment.downloadUrl || attachment.previewUrl;
  if (!candidate || candidate === '#' || candidate === 'undefined' || candidate === 'null') {
    return '';
  }
  return candidate;
};

/**
 * Downloads the actual binary file bytes of an attachment, verifying content size > 0.
 * Preserves the exact original filename and extension.
 */
export const downloadAttachment = async (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): Promise<void> => {
  const fileName = attachment.originalFileName || attachment.filename || 'attachment';
  const fileUrl = getAuthorizedAttachmentUrl(attachment);

  if (!fileUrl) {
    if (addToast) {
      addToast({
        message: `Attachment file URL is unavailable for "${fileName}".`,
        type: 'error',
      });
    }
    return;
  }

  try {
    // If it's a real HTTP / Cloudinary URL, fetch binary bytes to guarantee non-zero size
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('blob:')) {
      try {
        const response = await fetch(fileUrl);
        if (response.ok) {
          const blob = await response.blob();
          if (blob && blob.size > 0) {
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => {
              URL.revokeObjectURL(objectUrl);
            }, 1500);

            if (addToast) {
              addToast({ message: `Downloaded "${fileName}"`, type: 'success' });
            }
            return;
          }
        }
      } catch {
        // Fallback to direct anchor download trigger if fetch is restricted by CORS
      }
    }

    // Direct anchor trigger fallback
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (addToast) {
      addToast({ message: `Initiated download for "${fileName}"`, type: 'info' });
    }
  } catch (err: any) {
    console.error('Download attachment failed:', err);
    if (addToast) {
      addToast({
        message: `Unable to download "${fileName}". Please try again.`,
        type: 'error',
      });
    }
  }
};

/**
 * Opens the attachment in a new browser tab safely.
 */
export const openAttachmentInNewTab = (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): void => {
  const fileName = attachment.originalFileName || attachment.filename || 'attachment';
  const fileUrl = getAuthorizedAttachmentUrl(attachment);

  if (!fileUrl) {
    if (addToast) {
      addToast({
        message: `File URL unavailable to open "${fileName}".`,
        type: 'error',
      });
    }
    return;
  }

  try {
    const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Pop-up blocker fallback
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err: any) {
    console.error('Open in new tab failed:', err);
    if (addToast) {
      addToast({
        message: `Unable to open "${fileName}" in new tab.`,
        type: 'error',
      });
    }
  }
};
