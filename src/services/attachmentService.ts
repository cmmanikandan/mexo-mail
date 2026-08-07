import { Attachment } from '../types/mail';
import { supabase } from './supabaseClient';
import {
  ATTACHMENT_CONFIG,
  validateAttachmentFile,
  getResolvedMimeType,
  sanitizeFilename,
} from '../config/attachmentConfig';

export interface FetchedBlobResult {
  blob: Blob;
  objectUrl: string;
  contentType?: string;
}

export interface UploadAttachmentOptions {
  senderUserId: string;
  messageId: string;
}

class AttachmentService {
  /**
   * Uploads a file attachment to private Supabase Storage bucket `mexo-mail-attachments`.
   * Structure: {sender_user_id}/{message_id}/{uuid}-{safe_filename}
   */
  async uploadAttachment(
    file: File,
    options: UploadAttachmentOptions,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const { senderUserId, messageId } = options;

    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed.');
    }

    const safeSenderId = senderUserId || 'anonymous-user';
    const safeMsgId = messageId || 'draft-msg';
    const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const safeName = sanitizeFilename(file.name);
    const storagePath = `${safeSenderId}/${safeMsgId}/${randomUuid}-${safeName}`;
    const contentType = getResolvedMimeType(file);

    if (onProgress) onProgress(20);

    // Ensure bucket exist check silently if needed
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(ATTACHMENT_CONFIG.BUCKET_NAME)
      .upload(storagePath, file, {
        contentType,
        upsert: false,
      });

    if (onProgress) onProgress(80);

    if (uploadError) {
      console.error('[AttachmentService Upload Error]', uploadError);
      throw new Error(uploadError.message || `Failed to upload "${file.name}" to storage.`);
    }

    if (onProgress) onProgress(100);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const newAttachment: Attachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      messageId: safeMsgId,
      filename: file.name,
      originalFileName: file.name,
      mimeType: contentType,
      sizeBytes: file.size,
      fileExtension: ext,
      storageProvider: 'supabase',
      bucketName: ATTACHMENT_CONFIG.BUCKET_NAME,
      storagePath,
      uploadedAt: new Date().toISOString(),
      uploadedBy: safeSenderId,
      isImage: contentType.startsWith('image/'),
    };

    return newAttachment;
  }

  /**
   * Generates a temporary authorized signed URL for a private attachment.
   */
  async getAttachmentAccessUrl(
    attachment: Partial<Attachment>,
    expiresInSeconds: number = ATTACHMENT_CONFIG.SIGNED_URL_EXPIRES_IN_SECONDS
  ): Promise<string> {
    if (!attachment) {
      throw new Error('Attachment metadata is missing.');
    }

    // 1. Session verification
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Your session has expired. Sign in again to access this attachment.');
    }

    // 2. Handle Supabase Storage path
    if (attachment.storagePath || (attachment.storageProvider === 'supabase' && attachment.storagePath)) {
      const path = attachment.storagePath;

      const { data, error } = await supabase.storage
        .from(ATTACHMENT_CONFIG.BUCKET_NAME)
        .createSignedUrl(path, expiresInSeconds);

      if (error || !data?.signedUrl) {
        console.error('[AttachmentService SignedUrl Error]', error);
        throw new Error(error?.message || 'Could not generate access URL for attachment.');
      }

      return data.signedUrl;
    }

    // 3. Fallback for Legacy Cloudinary attachments
    const legacyCandidate =
      attachment.storageUrl ||
      attachment.downloadUrl ||
      attachment.previewUrl ||
      (attachment as any).secure_url;

    if (legacyCandidate && typeof legacyCandidate === 'string' && legacyCandidate.startsWith('http')) {
      return encodeURI(legacyCandidate.trim());
    }

    throw new Error('Attachment storage reference is unavailable.');
  }

  /**
   * Fetches binary bytes of an attachment using authenticated storage / fresh signed URL.
   */
  async fetchAttachmentBlob(attachment: Partial<Attachment>): Promise<FetchedBlobResult> {
    const fileName = attachment.originalFileName || attachment.filename || 'attachment';

    // 1. Direct Supabase Storage download if storagePath is available
    if (attachment.storagePath) {
      const { data: blob, error } = await supabase.storage
        .from(ATTACHMENT_CONFIG.BUCKET_NAME)
        .download(attachment.storagePath);

      if (!error && blob && blob.size > 0) {
        const objectUrl = URL.createObjectURL(blob);
        return { blob, objectUrl, contentType: blob.type || attachment.mimeType };
      }
    }

    // 2. Fallback via temporary signed URL
    const signedUrl = await this.getAttachmentAccessUrl(attachment);
    const response = await fetch(signedUrl, { mode: 'cors' });

    if (response.status === 401) {
      throw new Error('Your session could not authorize this attachment.');
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to access this attachment.");
    }
    if (response.status === 404) {
      throw new Error('This attachment could not be found.');
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
      }, 2500);

      if (addToast) {
        addToast({ message: `Downloaded "${fileName}"`, type: 'success' });
      }
    } catch (err: any) {
      console.error('[AttachmentService] Download failed:', err);

      if (addToast) {
        addToast({
          message: err.message || `Unable to download "${fileName}". Please try again.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Opens attachment URL in a new tab via fresh signed URL.
   */
  async openAttachmentExternally(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): Promise<void> {
    const fileName = attachment.originalFileName || attachment.filename || 'attachment';

    try {
      const freshSignedUrl = await this.getAttachmentAccessUrl(attachment);

      const newWindow = window.open(freshSignedUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = freshSignedUrl;
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
          message: err.message || `Unable to open "${fileName}" in new tab.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Deletes attachment file object from Supabase Storage bucket.
   */
  async deleteAttachment(storagePath: string): Promise<boolean> {
    if (!storagePath) return false;
    try {
      const { error } = await supabase.storage
        .from(ATTACHMENT_CONFIG.BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.warn('Failed to delete storage object:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Error deleting storage object:', err);
      return false;
    }
  }
}

export const attachmentService = new AttachmentService();
