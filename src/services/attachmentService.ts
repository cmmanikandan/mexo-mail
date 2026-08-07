import { Attachment } from '../types/mail';
import { supabase } from './supabaseClient';
import { useAuthStore } from '../store/authStore';
import {
  ATTACHMENT_CONFIG,
  validateAttachmentFile,
  getResolvedMimeType,
  sanitizeFilename,
  getCleanFileName,
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
   * Uploads a document attachment to private Supabase Storage bucket `mail-attachments`.
   * Storage path structure: {sender_user_id}/{message_id}/{attachment_uuid}-{safe_filename}
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

    if (onProgress) onProgress(15);

    const bucketName = ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType,
        upsert: false,
      });

    if (onProgress) onProgress(85);

    if (uploadError) {
      console.warn('[AttachmentService Primary Upload Failed, trying fallback bucket]', uploadError);
      // Fallback to secondary bucket if primary is restricted
      const { error: fallbackError } = await supabase.storage
        .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
        .upload(storagePath, file, {
          contentType,
          upsert: false,
        });

      if (fallbackError) {
        console.error('[AttachmentService Fallback Upload Error]', fallbackError);
        throw new Error(fallbackError.message || uploadError.message || `Failed to upload "${file.name}" to storage.`);
      }
    }

    if (onProgress) onProgress(100);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const newAttachment: Attachment = {
      id: randomUuid,
      messageId: safeMsgId,
      filename: file.name,
      originalFileName: file.name,
      mimeType: contentType,
      sizeBytes: file.size,
      fileExtension: ext,
      storageProvider: 'supabase',
      bucketName,
      storageBucket: bucketName,
      storagePath,
      uploadedAt: new Date().toISOString(),
      uploadedBy: safeSenderId,
      isImage: contentType.startsWith('image/'),
    };

    return newAttachment;
  }

  /**
   * Generates a fresh temporary authorized signed URL for a private attachment.
   */
  async getAttachmentAccessUrl(
    attachment: Partial<Attachment>,
    expiresInSeconds: number = ATTACHMENT_CONFIG.SIGNED_URL_EXPIRES_IN_SECONDS
  ): Promise<string> {
    if (!attachment) {
      throw new Error('Attachment metadata is missing.');
    }

    // 1. Session verification & automatic session refresh if required
    let activeSession = null;
    try {
      const { data } = await supabase.auth.getSession();
      activeSession = data?.session;

      if (!activeSession) {
        // Attempt one-time token refresh
        const { data: refreshData } = await supabase.auth.refreshSession();
        activeSession = refreshData?.session;
      }
    } catch (e) {
      console.warn('[AttachmentService Auth Session Check Error]', e);
    }

    // Only throw session expired error if user is completely logged out of MEXO Mail
    const isMexoAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!activeSession && !isMexoAuthenticated) {
      throw new Error('Your MEXO session has expired. Sign in again.');
    }

    // 2. Resolve storage path & bucket name
    const path = attachment.storagePath || (attachment as any).storage_path;
    const bucket =
      attachment.storageBucket ||
      attachment.bucketName ||
      (attachment as any).storage_bucket ||
      ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    if (path) {
      // Attempt signed URL creation on resolved bucket
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresInSeconds);

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }

      // Try fallback bucket if specified bucket failed
      if (error && bucket !== ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME) {
        const { data: fallbackData, error: fallbackErr } = await supabase.storage
          .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
          .createSignedUrl(path, expiresInSeconds);

        if (!fallbackErr && fallbackData?.signedUrl) {
          return fallbackData.signedUrl;
        }
      }

      // If RLS permissions blocked access
      if (error?.message?.includes('403') || error?.message?.includes('Permission')) {
        throw new Error("You don't have permission to access this attachment.");
      }

      if (error?.message?.includes('404') || error?.message?.includes('Object not found')) {
        throw new Error('This attachment is no longer available.');
      }

      console.warn('[AttachmentService SignedUrl Warning]', error);
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

    throw new Error('This attachment is no longer available.');
  }

  /**
   * Fetches binary bytes of an attachment using authenticated storage / fresh signed URL.
   * Uses `cache: 'no-store'` to prevent Service Worker SW caching of temporary signed URLs.
   */
  async fetchAttachmentBlob(attachment: Partial<Attachment>): Promise<FetchedBlobResult> {
    const bucket =
      attachment.storageBucket ||
      attachment.bucketName ||
      ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;
    const path = attachment.storagePath || (attachment as any).storage_path;

    // 1. Direct Supabase Storage download if path exists
    if (path) {
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (!error && blob && blob.size > 0) {
        const objectUrl = URL.createObjectURL(blob);
        return { blob, objectUrl, contentType: blob.type || attachment.mimeType };
      }

      // Try fallback bucket if primary failed
      if (bucket !== ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME) {
        const { data: fallbackBlob, error: fallbackErr } = await supabase.storage
          .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
          .download(path);

        if (!fallbackErr && fallbackBlob && fallbackBlob.size > 0) {
          const objectUrl = URL.createObjectURL(fallbackBlob);
          return { blob: fallbackBlob, objectUrl, contentType: fallbackBlob.type || attachment.mimeType };
        }
      }
    }

    // 2. Fetch binary stream via fresh signed URL with no-store cache control
    const signedUrl = await this.getAttachmentAccessUrl(attachment);
    const response = await fetch(signedUrl, { mode: 'cors', cache: 'no-store' });

    if (response.status === 401) {
      throw new Error('Your MEXO session could not authorize this attachment.');
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to access this attachment.");
    }
    if (response.status === 404) {
      throw new Error('This attachment is no longer available.');
    }
    if (!response.ok) {
      throw new Error(`Unable to load attachment. Check your connection and try again.`);
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Attachment file is empty (0 bytes).');
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
    const cleanName = getCleanFileName(attachment);

    try {
      const { objectUrl } = await this.fetchAttachmentBlob(attachment);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 3000);

      if (addToast) {
        addToast({ message: `Downloaded "${cleanName}"`, type: 'success' });
      }
    } catch (err: any) {
      console.error('[AttachmentService] Download failed:', err);
      if (addToast) {
        addToast({
          message: err.message || `Unable to download "${cleanName}". Please try again.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Opens attachment URL in a new tab via fresh 5-minute signed URL.
   */
  async openAttachmentExternally(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): Promise<void> {
    const cleanName = getCleanFileName(attachment);

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
          message: err.message || `Unable to open "${cleanName}" in new tab.`,
          type: 'error',
        });
      }
    }
  }

  /**
   * Deletes attachment file object from Supabase Storage.
   */
  async deleteAttachment(storagePath: string, bucketName?: string): Promise<boolean> {
    if (!storagePath) return false;
    const bucket = bucketName || ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([storagePath]);

      if (error) {
        // Try fallback bucket
        await supabase.storage.from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME).remove([storagePath]);
      }
      return true;
    } catch (err) {
      console.warn('Error deleting storage object:', err);
      return false;
    }
  }
}

export const attachmentService = new AttachmentService();
