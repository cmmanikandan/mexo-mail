import { Attachment } from '../types/mail';
import { uploadFileToCloudinary, CloudinaryUploadResult } from './cloudinaryService';
import {
  validateAttachmentFile,
  getResolvedMimeType,
  getCleanFileName,
} from '../config/attachmentConfig';

const CLOUD_NAME = 'dughdt8sf';

export interface FetchedBlobResult {
  blob: Blob;
  objectUrl: string;
  contentType?: string;
}

export interface UploadAttachmentOptions {
  senderUserId?: string;
  messageId?: string;
}

class AttachmentService {
  /**
   * Uploads a file attachment (PDF, PNG, JPG, DOCX, XLSX, PPTX, TXT, ZIP, etc.)
   * directly to Cloudinary storage via REST API.
   */
  async uploadAttachment(
    file: File,
    options?: UploadAttachmentOptions,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed.');
    }

    const res: CloudinaryUploadResult = await uploadFileToCloudinary(file, onProgress);

    if (!res || !res.secure_url) {
      throw new Error("Couldn't upload attachment to Cloudinary.");
    }

    const ext = res.format || file.name.split('.').pop()?.toLowerCase() || '';
    const contentType = getResolvedMimeType(file);

    const newAttachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      filename: file.name,
      originalFileName: file.name,
      mimeType: contentType,
      sizeBytes: res.bytes || file.size,
      fileExtension: ext,
      storageProvider: 'cloudinary',
      downloadUrl: res.secure_url,
      previewUrl: res.secure_url,
      storageUrl: res.secure_url,
      cloudinaryPublicId: res.public_id,
      cloudinaryResourceType: res.resource_type,
      cloudinaryFormat: res.format,
      uploadedAt: new Date().toISOString(),
      uploadedBy: options?.senderUserId || 'user',
      isImage: contentType.startsWith('image/'),
    };

    return newAttachment;
  }

  /**
   * Resolves the canonical Cloudinary access URL for an attachment record.
   */
  getAttachmentAccessUrl(attachment: Partial<Attachment>): string {
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
      if (cleanUrl.includes('res.cloudinary.com')) {
        try {
          return encodeURI(cleanUrl);
        } catch {
          return cleanUrl;
        }
      }
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('blob:')) {
        return encodeURI(cleanUrl);
      }
    }

    // Reconstruct canonical URL if publicId exists
    const publicId = attachment.cloudinaryPublicId || (attachment as any).public_id;
    if (publicId && typeof publicId === 'string') {
      const resourceType =
        attachment.cloudinaryResourceType ||
        (attachment as any).resource_type ||
        (attachment.mimeType?.startsWith('image/') ? 'image' : 'raw');

      const cleanPublicId = publicId.startsWith('/') ? publicId.slice(1) : publicId;
      const encodedPublicId = cleanPublicId.split('/').map((segment) => encodeURIComponent(segment)).join('/');

      return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${encodedPublicId}`;
    }

    return '';
  }

  /**
   * Fetches binary bytes of a Cloudinary attachment and returns a Blob with a browser Object URL.
   */
  async fetchAttachmentBlob(attachment: Partial<Attachment>): Promise<FetchedBlobResult> {
    const fileUrl = this.getAttachmentAccessUrl(attachment);
    const fileName = getCleanFileName(attachment);

    if (!fileUrl) {
      throw new Error(`Attachment URL unavailable for "${fileName}"`);
    }

    const response = await fetch(fileUrl, { mode: 'cors' });

    if (response.status === 401 || response.status === 403) {
      throw new Error(`This Cloudinary attachment is restricted (${response.status}).`);
    }
    if (response.status === 404) {
      throw new Error(`This attachment is no longer available.`);
    }
    if (!response.ok) {
      throw new Error(`Attachment request failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Attachment content is empty (0 bytes).');
    }

    const objectUrl = URL.createObjectURL(blob);
    return { blob, objectUrl, contentType: blob.type || attachment.mimeType };
  }

  /**
   * Downloads attachment preserving exact original filename.
   */
  async downloadAttachment(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): Promise<void> {
    const fileName = getCleanFileName(attachment);

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
      }, 3000);

      if (addToast) {
        addToast({ message: `Downloaded "${fileName}"`, type: 'success' });
      }
    } catch (err: any) {
      console.error('[AttachmentService] Download failed, attempting direct link fallback:', err);

      const directUrl = this.getAttachmentAccessUrl(attachment);
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
          message: err.message || `Unable to download "${fileName}". Please try again.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Opens Cloudinary attachment URL in a new tab.
   */
  openAttachmentExternally(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): void {
    const fileName = getCleanFileName(attachment);
    const fileUrl = this.getAttachmentAccessUrl(attachment);

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

  /**
   * Delete attachment placeholder (Cloudinary REST API deletion requires signed API secret on server)
   */
  async deleteAttachment(publicId?: string): Promise<boolean> {
    return true;
  }
}

export const attachmentService = new AttachmentService();
