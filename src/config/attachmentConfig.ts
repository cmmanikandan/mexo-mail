import { Attachment } from '../types/mail';

/**
 * Configurable Attachment System Restrictions & MIME Type Definitions
 */
export const ATTACHMENT_CONFIG = {
  PRIMARY_BUCKET_NAME: 'mail-attachments',
  FALLBACK_BUCKET_NAME: 'mexo-mail-attachments',
  MAX_ATTACHMENT_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  SIGNED_URL_EXPIRES_IN_SECONDS: 300, // 5 minutes temporary signed URL
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.scr', '.ps1', '.com', '.jar'],
};

/**
 * MIME types that should be stored on Cloudinary (public CDN images).
 * Everything else goes to Supabase Storage (private, signed URL access).
 */
export const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
]);

export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'svg', 'bmp', 'tiff',
]);

/**
 * Returns true if this file should be stored on Cloudinary (images only).
 * Uses both MIME type (primary) and extension (fallback) for reliability.
 */
export function isImageFile(file: File): boolean {
  if (file.type && file.type.trim() && IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Returns the storage provider for an existing attachment record.
 * Images (cloudinary) → serve directly from Cloudinary URL.
 * Documents (supabase) → generate fresh signed URL.
 */
export function getAttachmentStorageProvider(attachment: Partial<Attachment>): 'cloudinary' | 'supabase' {
  // Explicit provider field
  const provider = (attachment.storageProvider || (attachment as any).storage_provider || '').toLowerCase();
  if (provider === 'cloudinary') return 'cloudinary';
  if (provider === 'supabase') return 'supabase';

  // Infer from data: if storagePath exists → supabase
  if (attachment.storagePath || (attachment as any).storage_path) return 'supabase';

  // Infer from data: if cloudinaryPublicId or cloudinaryUrl exists → cloudinary
  const hasCloudinary = !!(
    attachment.cloudinaryPublicId ||
    (attachment as any).cloudinary_public_id ||
    attachment.downloadUrl?.includes('cloudinary.com') ||
    attachment.previewUrl?.includes('cloudinary.com') ||
    attachment.storageUrl?.includes('cloudinary.com')
  );
  if (hasCloudinary) return 'cloudinary';

  // Default to supabase for new documents
  return 'supabase';
}

/**
 * Returns true if this attachment is an image (should use Cloudinary URL directly).
 */
export function isImageAttachment(attachment: Partial<Attachment>): boolean {
  const mime = (attachment.mimeType || '').toLowerCase();
  if (mime && IMAGE_MIME_TYPES.has(mime)) return true;
  const ext = (attachment.fileExtension || '').toLowerCase();
  if (ext && IMAGE_EXTENSIONS.has(ext)) return true;
  // If stored on cloudinary and no storagePath → treat as image
  const provider = getAttachmentStorageProvider(attachment);
  if (provider === 'cloudinary' && !attachment.storagePath) return true;
  return false;
}

export const MIME_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  txt: 'text/plain',
  json: 'application/json',
  xml: 'application/xml',
  md: 'text/markdown',
  log: 'text/plain',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachmentFile(
  file: File,
  currentCount: number = 0
): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
  }

  if (currentCount >= ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_MESSAGE) {
    return {
      valid: false,
      error: `Maximum limit of ${ATTACHMENT_CONFIG.MAX_ATTACHMENTS_PER_MESSAGE} attachments per message reached.`,
    };
  }

  if (file.size > ATTACHMENT_CONFIG.MAX_ATTACHMENT_SIZE_BYTES) {
    const sizeMb = (ATTACHMENT_CONFIG.MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum allowed size of ${sizeMb} MB.`,
    };
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
  if (ATTACHMENT_CONFIG.BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is not allowed for security reasons.`,
    };
  }

  return { valid: true };
}

export function getResolvedMimeType(file: File): string {
  if (file.type && file.type.trim().length > 0 && file.type !== 'application/octet-stream') {
    return file.type;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPE_MAP[ext] || 'application/octet-stream';
}

export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed_file';
  const clean = filename.replace(/[/\s\\?%*:|"<>]+/g, '_');
  return clean.length > 150 ? clean.substring(clean.length - 150) : clean;
}

/**
 * Extracts human-readable filename, stripping raw UUID prefixes or hashes.
 * Ensures viewer UI never displays internal UUIDs like "78db70dd-0ea2-45da-9368-2b246764f8c7".
 */
export function getCleanFileName(attachment: Partial<Attachment>): string {
  if (!attachment) return 'Attachment';

  const candidate =
    attachment.originalFileName ||
    attachment.filename ||
    (attachment as any).original_file_name ||
    (attachment as any).file_name ||
    'Attachment';

  // If candidate is a pure UUID string (36 chars)
  const isPureUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(candidate.trim());
  if (isPureUuid) {
    const ext = attachment.fileExtension ? `.${attachment.fileExtension}` : '';
    return `Attachment${ext}`;
  }

  // Strip leading UUID prefix if format is uuid-filename.ext
  const uuidPrefixPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-/;
  if (uuidPrefixPattern.test(candidate)) {
    return candidate.replace(uuidPrefixPattern, '');
  }

  return candidate;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
