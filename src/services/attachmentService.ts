import { Attachment } from '../types/mail';
import { uploadFileToCloudinary, CloudinaryUploadResult } from './cloudinaryService';

const CLOUD_NAME = 'dughdt8sf';

export interface FetchedBlobResult {
  blob: Blob;
  objectUrl: string;
}

class AttachmentService {
  /**
   * Uploads a file to Cloudinary storage via REST API.
   * Validates that secure_url, public_id, and resource_type are returned.
   */
  async uploadAttachment(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<CloudinaryUploadResult> {
    const result = await uploadFileToCloudinary(file, onProgress);

    if (!result || !result.secure_url) {
      throw new Error('Cloudinary upload did not return secure_url');
    }

    // Development diagnostic logging (no sensitive secrets)
    if ((import.meta as any).env?.DEV) {
      console.log('[AttachmentService Upload]', {
        fileName: result.original_filename || file.name,
        mimeType: file.type,
        resourceType: result.resource_type,
        publicId: result.public_id,
        secureUrl: result.secure_url,
      });
    }

    return result;
  }

  /**
   * Resolves the canonical delivery URL for an attachment record.
   * Uses stored secure_url directly without manual string reconstruction.
   */
  getAttachmentUrl(attachment: Partial<Attachment>): string {
    if (!attachment) return '';

    const rawCandidate =
      attachment.storageUrl ||
      attachment.downloadUrl ||
      attachment.previewUrl ||
      (attachment as any).secure_url ||
      (attachment as any).storage_url;

    if (
      rawCandidate &&
      typeof rawCandidate === 'string' &&
      rawCandidate !== '#' &&
      rawCandidate !== 'undefined' &&
      rawCandidate !== 'null'
    ) {
      let cleanUrl = rawCandidate.trim();

      // Cleanly URL-encode spaces and special characters to prevent ERR_INVALID_RESPONSE
      if (cleanUrl.includes('res.cloudinary.com')) {
        try {
          cleanUrl = encodeURI(cleanUrl);
        } catch {
          // Fallback if encodeURI fails
        }
        return cleanUrl;
      }

      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) {
        return encodeURI(cleanUrl);
      }
    }

    // Backward compatibility for old legacy records with missing/corrupted secure_url
    const publicId = attachment.cloudinaryPublicId || (attachment as any).public_id;
    if (publicId && typeof publicId === 'string') {
      const resourceType =
        attachment.cloudinaryResourceType ||
        (attachment as any).resource_type ||
        (attachment.mimeType?.startsWith('image/') ? 'image' : 'auto');

      const cleanPublicId = publicId.startsWith('/') ? publicId.slice(1) : publicId;
      const encodedPublicId = cleanPublicId.split('/').map(segment => encodeURIComponent(segment)).join('/');

      return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${encodedPublicId}`;
    }

    return '';
  }

  /**
   * Fetches binary bytes of an attachment from storage.
   * Verifies response.ok (HTTP 200) and returns a Blob with a browser Object URL.
   */
  async fetchAttachmentBlob(attachment: Partial<Attachment>): Promise<FetchedBlobResult> {
    const fileUrl = this.getAttachmentUrl(attachment);
    const fileName = attachment.originalFileName || attachment.filename || 'attachment';

    if (!fileUrl) {
      throw new Error(`Attachment URL unavailable for "${fileName}"`);
    }

    const response = await fetch(fileUrl, { mode: 'cors' });

    // Development diagnostic logging
    if ((import.meta as any).env?.DEV) {
      console.log('[AttachmentService Fetch]', {
        fileName,
        url: fileUrl,
        status: response.status,
        contentType: response.headers.get('content-type'),
      });
    }

    if (!response.ok) {
      throw new Error(`Attachment request failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Attachment content is empty (0 bytes)');
    }

    const objectUrl = URL.createObjectURL(blob);
    return { blob, objectUrl };
  }

  /**
   * Downloads the attachment binary file bytes, preserving the exact original filename.
   */
  async downloadAttachment(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): Promise<void> {
    const fileName = attachment.originalFileName || attachment.filename || 'attachment';

    try {
      const { objectUrl } = await this.fetchAttachmentBlob(attachment);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 2000);

      if (addToast) {
        addToast({ message: `Downloaded "${fileName}"`, type: 'success' });
      }
    } catch (err: any) {
      console.error('[AttachmentService] Download failed:', err);

      // Fallback: Direct window/anchor trigger if CORS restricted
      const directUrl = this.getAttachmentUrl(attachment);
      if (directUrl) {
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (addToast) {
          addToast({ message: `Initiated download for "${fileName}"`, type: 'info' });
        }
        return;
      }

      if (addToast) {
        addToast({
          message: `Unable to download "${fileName}". Please try again.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Safely opens the attachment URL in a new tab.
   */
  openAttachmentExternally(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): void {
    const fileName = attachment.originalFileName || attachment.filename || 'attachment';
    const fileUrl = this.getAttachmentUrl(attachment);

    if (!fileUrl) {
      if (addToast) {
        addToast({
          message: `Attachment URL unavailable for "${fileName}".`,
          type: 'error',
        });
      }
      return;
    }

    try {
      const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('[AttachmentService] Open externally failed:', err);
      if (addToast) {
        addToast({
          message: `Unable to open "${fileName}" in new tab.`,
          type: 'error',
        });
      }
    }
  }
}

export const attachmentService = new AttachmentService();
