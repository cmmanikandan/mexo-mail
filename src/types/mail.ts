export interface Attachment {
  id: string;
  messageId?: string;
  filename: string;
  originalFileName?: string;
  mimeType: string;
  sizeBytes: number;
  fileExtension?: string;
  storagePath?: string;
  storageKey?: string;
  downloadUrl: string;
  previewUrl?: string;
  storageProvider?: string;
  storageUrl?: string;
  cloudinaryPublicId?: string;
  cloudinaryResourceType?: string;
  cloudinaryFormat?: string;
  uploadedAt?: string;
  isImage?: boolean;
}

export interface RecipientState {
  recipientEmail: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  isSpam: boolean;
  snoozedUntil?: string; // ISO string
  labels: string[]; // Label IDs
}

export interface Message {
  id: string;
  threadId: string;
  senderName: string;
  senderEmail: string; // e.g. "manikandan@mexo.com"
  senderAvatar?: string;
  recipients: string[]; // Array of recipient emails e.g. ["arun@mexo.com"]
  recipientAvatars?: Record<string, string>; // email -> avatarUrl map for recipient photo display
  cc?: string[];
  bcc?: string[];
  subject: string;
  snippet: string;
  bodyHtml: string;
  attachments: Attachment[];
  createdAt: string;
  
  // Recipient-specific state for the currently logged-in user
  userState: RecipientState;
}

export interface Thread {
  id: string;
  subject: string;
  messageCount: number;
  lastMessageAt: string;
  participants: { name: string; email: string; avatar?: string }[];
  snippet: string;
  messages: Message[];
  isStarred: boolean;
  isImportant: boolean;
  isUnread: boolean;
  labels: string[];
}

export interface Label {
  id: string;
  name: string;
  color: string; // Hex color code
  parentLabelId?: string;
  unreadCount?: number;
}

export interface Draft {
  id: string;
  userEmail?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  attachments: Attachment[];
  lastSavedAt: string;
}

export interface ScheduledMessage {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyHtml: string;
  attachments: Attachment[];
  scheduledFor: string;
  createdAt: string;
}

export interface FilterRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    from?: string;
    to?: string;
    subject?: string;
    containsWords?: string;
    doesNotContainWords?: string;
    hasAttachment?: boolean;
  };
  actions: {
    skipInbox?: boolean;
    markRead?: boolean;
    star?: boolean;
    applyLabelId?: string;
    delete?: boolean;
    markImportant?: boolean;
  };
}

export interface UserSignature {
  id: string;
  name: string;
  contentHtml: string;
  isDefaultNew: boolean;
  isDefaultReply: boolean;
}
