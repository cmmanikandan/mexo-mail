import { Attachment } from '../types/mail';
import { supabase } from './supabaseClient';
import { uploadFileToCloudinary } from './cloudinaryService';
import { useAuthStore } from '../store/authStore';
import {
  ATTACHMENT_CONFIG,
  validateAttachmentFile,
  getResolvedMimeType,
  sanitizeFilename,
  getCleanFileName,
  isImageFile,
  isImageAttachment,
  getAttachmentStorageProvider,
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

/**
 * Classifies attachment error type for specific UI error states.
 */
export type AttachmentErrorType =
  | 'auth_expired'    // 401/403 — can retry with fresh signed URL
  | 'not_found'       // 404 — file deleted or never existed
  | 'network'         // Offline or fetch failure
  | 'legacy_cloudinary' // Old Cloudinary non-image document (needs re-upload)
  | 'preview_failed'  // File loaded but viewer couldn't render it
  | 'unknown';

export class AttachmentError extends Error {
  type: AttachmentErrorType;
  retryable: boolean;

  constructor(message: string, type: AttachmentErrorType = 'unknown', retryable = false) {
    super(message);
    this.name = 'AttachmentError';
    this.type = type;
    this.retryable = retryable;
  }
}

class AttachmentService {
  /**
   * DUAL-PROVIDER UPLOAD:
   * - Images (jpg/png/webp/gif/heic) → Cloudinary (fast public CDN)
   * - All other files (pdf/docx/xlsx/zip/etc.) → Supabase private storage
   */
  async uploadAttachment(
    file: File,
    options: UploadAttachmentOptions,
    onProgress?: (percent: number) => void
  ): Promise<Attachment> {
    const { senderUserId, messageId } = options;

    const validation = validateAttachmentFile(file);
    if (!validation.valid) {
      throw new AttachmentError(validation.error || 'File validation failed.', 'unknown', false);
    }

    const contentType = getResolvedMimeType(file);
    const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `att-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // ── IMAGE → CLOUDINARY ──────────────────────────────────────────────────
    if (isImageFile(file)) {
      if (onProgress) onProgress(15);

      const result = await uploadFileToCloudinary(file, (pct) => {
        if (onProgress) onProgress(Math.round(15 + pct * 0.8));
      });

      if (onProgress) onProgress(100);

      return {
        id: randomUuid,
        messageId,
        filename: file.name,
        originalFileName: file.name,
        mimeType: contentType,
        sizeBytes: result.bytes || file.size,
        fileExtension: ext,
        storageProvider: 'cloudinary',
        cloudinaryPublicId: result.public_id,
        cloudinaryResourceType: result.resource_type,
        cloudinaryFormat: result.format,
        downloadUrl: result.secure_url,
        previewUrl: result.secure_url,
        storageUrl: result.secure_url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: senderUserId,
        isImage: true,
      };
    }

    // ── DOCUMENT / FILE → SUPABASE STORAGE ─────────────────────────────────
    const safeSenderId = senderUserId || 'anonymous';
    const safeMsgId = messageId || 'draft';
    const safeName = sanitizeFilename(file.name);
    // Path: {senderUserId}/{messageId}/{attachmentId}/{safeFileName}
    const storagePath = `${safeSenderId}/${safeMsgId}/${randomUuid}/${safeName}`;
    const bucketName = ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    if (onProgress) onProgress(20);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, { contentType, upsert: false });

    if (onProgress) onProgress(85);

    if (uploadError) {
      // Try fallback bucket
      const { error: fallbackError } = await supabase.storage
        .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
        .upload(storagePath, file, { contentType, upsert: false });

      if (fallbackError) {
        throw new AttachmentError(
          fallbackError.message || uploadError.message || `Failed to upload "${file.name}".`,
          'unknown',
          true
        );
      }
    }

    if (onProgress) onProgress(100);

    return {
      id: randomUuid,
      messageId,
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
      isImage: false,
    };
  }

  /**
   * Resolves the access URL for an attachment:
   * - Cloudinary image → returns secure_url directly (public CDN, no auth)
   * - Supabase document → generates a fresh 5-min signed URL
   * - Legacy Cloudinary non-image → throws AttachmentError with type 'legacy_cloudinary'
   */
  async getAttachmentAccessUrl(
    attachment: Partial<Attachment>,
    expiresInSeconds: number = ATTACHMENT_CONFIG.SIGNED_URL_EXPIRES_IN_SECONDS
  ): Promise<string> {
    if (!attachment) throw new AttachmentError('Attachment metadata is missing.', 'unknown');

    const provider = getAttachmentStorageProvider(attachment);
    const isImg = isImageAttachment(attachment);

    // ── CLOUDINARY IMAGE → return direct CDN URL ────────────────────────────
    if (provider === 'cloudinary' && isImg) {
      const url =
        attachment.storageUrl ||
        attachment.downloadUrl ||
        attachment.previewUrl ||
        (attachment as any).secure_url ||
        (attachment as any).cloudinary_url;

      if (url && typeof url === 'string' && url.startsWith('http')) {
        return encodeURI(url.trim());
      }

      // Reconstruct from publicId
      const publicId = attachment.cloudinaryPublicId || (attachment as any).cloudinary_public_id;
      if (publicId) {
        const cloudName = 'dughdt8sf';
        const resourceType = attachment.cloudinaryResourceType || 'image';
        return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
      }

      throw new AttachmentError('Cloudinary image URL unavailable.', 'not_found', false);
    }

    // ── LEGACY CLOUDINARY NON-IMAGE → descriptive error ─────────────────────
    if (provider === 'cloudinary' && !isImg) {
      throw new AttachmentError(
        'This document was stored in an older format (Cloudinary). Please ask the sender to re-attach the file.',
        'legacy_cloudinary',
        false
      );
    }

    // ── SUPABASE STORAGE → generate fresh signed URL ─────────────────────────

    // Verify MEXO session (but don't hard-block if Supabase Auth is slow)
    let activeSession = null;
    try {
      const { data } = await supabase.auth.getSession();
      activeSession = data?.session;
      if (!activeSession) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        activeSession = refreshData?.session;
      }
    } catch (e) {
      console.warn('[AttachmentService] Session check error:', e);
    }

    const isMexoAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!activeSession && !isMexoAuthenticated) {
      throw new AttachmentError('Your MEXO session has expired. Sign in again.', 'auth_expired', true);
    }

    const path = attachment.storagePath || (attachment as any).storage_path;
    const bucket =
      attachment.storageBucket ||
      attachment.bucketName ||
      (attachment as any).storage_bucket ||
      ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    if (!path) {
      // Try a raw URL fallback (shouldn't happen for supabase attachments, but safety net)
      const fallbackUrl = attachment.downloadUrl || attachment.storageUrl;
      if (fallbackUrl && fallbackUrl.startsWith('http')) {
        return encodeURI(fallbackUrl);
      }
      throw new AttachmentError('Attachment storage path is missing.', 'not_found', false);
    }

    // Try primary bucket first
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (!error && data?.signedUrl) return data.signedUrl;

    // Try fallback bucket
    if (bucket !== ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME) {
      const { data: fbData, error: fbErr } = await supabase.storage
        .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
        .createSignedUrl(path, expiresInSeconds);

      if (!fbErr && fbData?.signedUrl) return fbData.signedUrl;
    }

    // Classify specific errors
    const errMsg = error?.message || '';
    if (errMsg.includes('403') || errMsg.includes('Permission') || errMsg.includes('policy')) {
      throw new AttachmentError(
        "You don't have permission to access this attachment.",
        'auth_expired',
        true
      );
    }
    if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('Object not found')) {
      throw new AttachmentError('This attachment is no longer available.', 'not_found', false);
    }

    throw new AttachmentError(
      `Unable to generate access URL. ${errMsg || 'Please try again.'}`,
      'unknown',
      true
    );
  }

  /**
   * Fetches binary bytes of an attachment as a Blob + Object URL.
   * - Supabase files: direct download via storage SDK (fastest, authenticated)
   * - Cloudinary images: fetch via CDN URL
   * - cache: 'no-store' prevents SW caching of signed URLs
   */
  async fetchAttachmentBlob(attachment: Partial<Attachment>): Promise<FetchedBlobResult> {
    const provider = getAttachmentStorageProvider(attachment);
    const isImg = isImageAttachment(attachment);
    const path = attachment.storagePath || (attachment as any).storage_path;
    const bucket =
      attachment.storageBucket ||
      attachment.bucketName ||
      (attachment as any).storage_bucket ||
      ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;

    // ── SUPABASE: direct SDK download (bypasses signed URL for internal access) ──
    if (provider === 'supabase' && path) {
      const { data: blob, error } = await supabase.storage.from(bucket).download(path);

      if (!error && blob && blob.size > 0) {
        const objectUrl = URL.createObjectURL(blob);
        return { blob, objectUrl, contentType: blob.type || attachment.mimeType };
      }

      if (bucket !== ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME) {
        const { data: fbBlob, error: fbErr } = await supabase.storage
          .from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME)
          .download(path);

        if (!fbErr && fbBlob && fbBlob.size > 0) {
          const objectUrl = URL.createObjectURL(fbBlob);
          return { blob: fbBlob, objectUrl, contentType: fbBlob.type || attachment.mimeType };
        }
      }
    }

    // ── FALLBACK: fetch via signed URL (Supabase) or direct URL (Cloudinary) ─
    const accessUrl = await this.getAttachmentAccessUrl(attachment);

    const response = await fetch(accessUrl, {
      mode: 'cors',
      cache: provider === 'cloudinary' ? 'default' : 'no-store',
    });

    if (response.status === 401 || response.status === 403) {
      throw new AttachmentError(
        'Attachment access expired. Tap Retry to get fresh access.',
        'auth_expired',
        true
      );
    }
    if (response.status === 404) {
      throw new AttachmentError('This attachment is no longer available.', 'not_found', false);
    }
    if (!response.ok) {
      if (!navigator.onLine) {
        throw new AttachmentError("You're offline. Reconnect to load this attachment.", 'network', true);
      }
      throw new AttachmentError(
        `Unable to load attachment (HTTP ${response.status}). Please try again.`,
        'unknown',
        true
      );
    }

    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new AttachmentError('Attachment content is empty (0 bytes).', 'not_found', false);
    }

    const objectUrl = URL.createObjectURL(blob);
    return { blob, objectUrl, contentType: blob.type || attachment.mimeType };
  }

  /**
   * Downloads attachment preserving original filename.
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
      setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);

      addToast?.({ message: `Downloaded "${cleanName}"`, type: 'success' });
    } catch (err: any) {
      console.error('[AttachmentService] Download failed:', err);

      // Fallback: open in new tab via fresh URL
      try {
        const url = await this.getAttachmentAccessUrl(attachment);
        const link = document.createElement('a');
        link.href = url;
        link.download = cleanName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast?.({ message: `Initiated download for "${cleanName}"`, type: 'info' });
        return;
      } catch {
        // Suppress nested error
      }

      addToast?.({
        message: err.message || `Unable to download "${cleanName}". Please try again.`,
        type: 'error',
      });
    }
  }

  /**
   * Opens attachment in a new tab.
   */
  async openAttachmentExternally(
    attachment: Partial<Attachment>,
    addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
  ): Promise<void> {
    const cleanName = getCleanFileName(attachment);

    try {
      const url = await this.getAttachmentAccessUrl(attachment);
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win || win.closed) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error('[AttachmentService] Open externally failed:', err);
      addToast?.({ message: err.message || `Unable to open "${cleanName}".`, type: 'error' });
    }
  }

  /**
   * Deletes attachment from storage.
   */
  async deleteAttachment(storagePath: string, bucketName?: string): Promise<boolean> {
    if (!storagePath) return false;
    const bucket = bucketName || ATTACHMENT_CONFIG.PRIMARY_BUCKET_NAME;
    try {
      const { error } = await supabase.storage.from(bucket).remove([storagePath]);
      if (error) {
        await supabase.storage.from(ATTACHMENT_CONFIG.FALLBACK_BUCKET_NAME).remove([storagePath]);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const attachmentService = new AttachmentService();
