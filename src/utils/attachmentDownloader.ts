import { Attachment } from '../types/mail';
import { attachmentService } from '../services/attachmentService';

export const getAuthorizedAttachmentUrl = async (attachment: Partial<Attachment>): Promise<string> => {
  try {
    return await attachmentService.getAttachmentAccessUrl(attachment);
  } catch (err) {
    console.warn('Failed to get authorized attachment URL:', err);
    return '';
  }
};

export const downloadAttachment = async (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): Promise<void> => {
  return attachmentService.downloadAttachment(attachment, addToast);
};

export const openAttachmentInNewTab = async (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): Promise<void> => {
  return attachmentService.openAttachmentExternally(attachment, addToast);
};
