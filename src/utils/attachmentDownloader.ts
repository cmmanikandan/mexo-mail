import { Attachment } from '../types/mail';
import { attachmentService } from '../services/attachmentService';

export const getAuthorizedAttachmentUrl = (attachment: Partial<Attachment>): string => {
  return attachmentService.getAttachmentUrl(attachment);
};

export const downloadAttachment = async (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): Promise<void> => {
  return attachmentService.downloadAttachment(attachment, addToast);
};

export const openAttachmentInNewTab = (
  attachment: Partial<Attachment>,
  addToast?: (toast: { message: string; type?: 'info' | 'success' | 'warning' | 'error' }) => void
): void => {
  return attachmentService.openAttachmentExternally(attachment, addToast);
};

