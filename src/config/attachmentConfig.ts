/**
 * Configurable Attachment System Restrictions & MIME Type Definitions
 */

export const ATTACHMENT_CONFIG = {
  BUCKET_NAME: 'mexo-mail-attachments',
  MAX_ATTACHMENT_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  SIGNED_URL_EXPIRES_IN_SECONDS: 3600, // 1 hour
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.scr', '.ps1', '.com', '.jar'],
};

export const MIME_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  txt: 'text/plain',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  '7z': 'application/x-7z-compressed',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
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
      error: `File "${file.name}" exceeds the maximum allowed attachment size of ${sizeMb} MB.`,
    };
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
  if (ATTACHMENT_CONFIG.BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is restricted for security reasons.`,
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
  // Strip dangerous path traversal or unusual characters
  const clean = filename.replace(/[/\s\\?%*:|"<>]+/g, '_');
  return clean.length > 150 ? clean.substring(clean.length - 150) : clean;
}
