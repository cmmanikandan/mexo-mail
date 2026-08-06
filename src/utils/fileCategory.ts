import { Attachment } from '../types/mail';

export type FileCategory =
  | 'image'
  | 'pdf'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'text'
  | 'video'
  | 'audio'
  | 'archive'
  | 'other';

export const getFileExtension = (attachment: Partial<Attachment>): string => {
  if (attachment.fileExtension) return attachment.fileExtension.toLowerCase();
  const name = attachment.originalFileName || attachment.filename || '';
  const parts = name.split('.');
  if (parts.length > 1) return parts.pop()!.toLowerCase();
  return '';
};

export const getFileCategory = (attachment: Partial<Attachment>): FileCategory => {
  const ext = getFileExtension(attachment);
  const mime = (attachment.mimeType || '').toLowerCase();

  // 1. Image
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)
  ) {
    return 'image';
  }

  // 2. PDF
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }

  // 3. Document (Word, RTF, Pages)
  if (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    ['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext)
  ) {
    return 'document';
  }

  // 4. Presentation (PowerPoint, Keynote)
  if (
    mime.includes('powerpoint') ||
    mime.includes('presentationml') ||
    ['ppt', 'pptx', 'odp', 'key'].includes(ext)
  ) {
    return 'presentation';
  }

  // 5. Spreadsheet (Excel, CSV, Numbers)
  if (
    mime.includes('excel') ||
    mime.includes('spreadsheetml') ||
    mime === 'text/csv' ||
    ['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)
  ) {
    return 'spreadsheet';
  }

  // 6. Video
  if (
    mime.startsWith('video/') ||
    ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)
  ) {
    return 'video';
  }

  // 7. Audio
  if (
    mime.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)
  ) {
    return 'audio';
  }

  // 8. Archive
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)
  ) {
    return 'archive';
  }

  // 9. Text / Code
  if (
    mime.startsWith('text/') ||
    mime.includes('json') ||
    mime.includes('xml') ||
    ['txt', 'md', 'json', 'xml', 'js', 'ts', 'html', 'css', 'py', 'sh', 'yaml', 'yml'].includes(ext)
  ) {
    return 'text';
  }

  return 'other';
};

export const getFileTypeLabel = (attachment: Partial<Attachment>): string => {
  const category = getFileCategory(attachment);
  const ext = getFileExtension(attachment).toUpperCase();

  switch (category) {
    case 'image':
      return ext || 'Image';
    case 'pdf':
      return 'PDF Document';
    case 'document':
      return ext ? `${ext} Document` : 'Word Document';
    case 'presentation':
      return ext ? `${ext} Presentation` : 'PowerPoint Presentation';
    case 'spreadsheet':
      return ext === 'CSV' ? 'CSV File' : ext ? `${ext} Spreadsheet` : 'Excel Spreadsheet';
    case 'video':
      return ext ? `${ext} Video` : 'Video File';
    case 'audio':
      return ext ? `${ext} Audio` : 'Audio File';
    case 'archive':
      return ext ? `${ext} Archive` : 'Compressed Archive';
    case 'text':
      return ext ? `${ext} File` : 'Text File';
    default:
      return ext ? `${ext} File` : 'Attachment';
  }
};
