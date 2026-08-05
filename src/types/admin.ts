export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  messagesToday: number;
  messagesThisMonth: number;
  totalGroups: number;
  storageUsedBytes: number;
  storageTotalBytes: number;
  failedDeliveries: number;
  spamReports: number;
  securityAlerts: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  target: string;
  result: 'success' | 'failed' | 'warning';
  ipAddress: string;
  metadata?: Record<string, any>;
}

export interface MailPolicy {
  maxAttachmentSizeBytes: number; // e.g. 25 * 1024 * 1024
  allowedFileTypes: string[];
  blockedFileTypes: string[];
  dailySendLimit: number;
  maxRecipientsPerMessage: number;
  spamThresholdScore: number;
  trashRetentionDays: number;
}
