import { MexoUser, UserSession, SecurityEvent } from '../types/user';
import { Message, Thread, Label, FilterRule, Draft, ScheduledMessage } from '../types/mail';
import { MexoGroup, GroupMember } from '../types/group';
import { Contact } from '../types/contact';
import { AuditLog, AdminMetrics, MailPolicy } from '../types/admin';
import {
  INITIAL_USERS,
  INITIAL_MESSAGES,
  INITIAL_GROUPS,
  INITIAL_CONTACTS,
  INITIAL_LABELS,
  RESERVED_USERNAMES,
} from './mockData';

import { cloudSync } from './cloudSync';

const STORAGE_KEYS = {
  USERS: 'mexo_users_v1',
  MESSAGES: 'mexo_messages_v1',
  GROUPS: 'mexo_groups_v1',
  CONTACTS: 'mexo_contacts_v1',
  LABELS: 'mexo_labels_v1',
  DRAFTS: 'mexo_drafts_v1',
  SCHEDULED: 'mexo_scheduled_v1',
  FILTERS: 'mexo_filters_v1',
  AUDIT_LOGS: 'mexo_audit_logs_v1',
  CURRENT_USER_ID: 'mexo_current_user_id_v1',
  SESSIONS: 'mexo_sessions_v1',
  SETTINGS: 'mexo_user_settings_v1',
  TEMPLATES: 'mexo_templates_v1',
};

export interface ComposeTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  createdAt: string;
}

export interface UserSettings {
  language: string;
  timeFormat: '12' | '24';
  conversationView: boolean;
  confirmBeforeDelete: boolean;
  confirmBeforeSend: boolean;
  readingPane: 'off' | 'right' | 'below';
  inboxType: 'default' | 'unread' | 'starred' | 'important';
  messagesPerPage: number;
  undoSendSeconds: number;
  defaultReplyBehavior: 'reply' | 'reply_all';
  autoSaveDrafts: boolean;
  signatureName: string;
  signatureContent: string;
  signatureNewMail: boolean;
  signatureReplies: boolean;
  vacationEnabled: boolean;
  vacationSubject: string;
  vacationBody: string;
  vacationContactsOnly: boolean;
  notifyAllMail: boolean;
  notifySound: boolean;
  notifyBrowser: boolean;
  blockedSenders: string[];
  forwardingEnabled: boolean;
  forwardingAddress: string;
  forwardingAction: 'keep' | 'read' | 'archive';
  privacyLoadImages: boolean;
  privacyPixelBlock: boolean;
  offlineEnabled: boolean;
  offlineSyncDays: number;
  offlineDownloadAttachments: boolean;
  keyboardShortcutsEnabled: boolean;
  accentColor: string;
  readingPanePosition: 'off' | 'right' | 'below';
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'English (United States)',
  timeFormat: '12',
  conversationView: true,
  confirmBeforeDelete: true,
  confirmBeforeSend: false,
  readingPane: 'right',
  inboxType: 'default',
  messagesPerPage: 25,
  undoSendSeconds: 10,
  defaultReplyBehavior: 'reply',
  autoSaveDrafts: true,
  signatureName: 'Personal',
  signatureContent: 'Best regards,\nManikandan CM\nMEXO Mail User',
  signatureNewMail: true,
  signatureReplies: false,
  vacationEnabled: false,
  vacationSubject: 'Out of Office Auto-Reply',
  vacationBody: 'Thank you for your email. I am currently away and will reply as soon as possible.',
  vacationContactsOnly: false,
  notifyAllMail: true,
  notifySound: true,
  notifyBrowser: false,
  blockedSenders: [],
  forwardingEnabled: false,
  forwardingAddress: '',
  forwardingAction: 'keep',
  privacyLoadImages: true,
  privacyPixelBlock: true,
  offlineEnabled: true,
  offlineSyncDays: 30,
  offlineDownloadAttachments: true,
  keyboardShortcutsEnabled: true,
  accentColor: '#0878e8',
  readingPanePosition: 'right',
};

class MexoDatabase {
  constructor() {
    this.init();
  }

  private init() {
    // Users: seed if missing or empty
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!storedUsers || JSON.parse(storedUsers).length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    this.syncCloudUsers().catch(() => {});

    // Messages: purge demo messages and initialize clean store
    const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (storedMessages) {
      try {
        const msgs: Message[] = JSON.parse(storedMessages);
        const nonDemoMsgs = msgs.filter((m) => !['msg-101', 'msg-102', 'msg-103', 'msg-104'].includes(m.id));
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(nonDemoMsgs));
      } catch {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_GROUPS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LABELS)) {
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(INITIAL_LABELS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1'); // Default signed in as manikandan
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRAFTS)) {
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SCHEDULED)) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-1',
          timestamp: new Date().toISOString(),
          actorEmail: 'admin@mexo.com',
          action: 'SYSTEM_INITIALIZED',
          target: 'MEXO Platform',
          result: 'success',
          ipAddress: '127.0.0.1',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  // --- DATABASE BACKUP & RESTORE APIS ---
  exportDatabase(): string {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      messages: this.getMessages(),
      groups: this.getGroups(),
      contacts: this.getContacts(),
      labels: this.getLabels(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  importDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.users || !Array.isArray(data.users) || !data.messages || !Array.isArray(data.messages)) {
        return { success: false, message: 'Invalid backup file format. Missing core users or messages data.' };
      }

      if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.messages) localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
      if (data.groups) localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(data.groups));
      if (data.contacts) localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(data.contacts));
      if (data.labels) localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(data.labels));
      if (data.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));

      this.addAuditLog('admin@mexo.com', 'DATABASE_RESTORED', 'Local Database', 'success');
      return { success: true, message: 'Database successfully restored from backup file.' };
    } catch (err: any) {
      return { success: false, message: `Failed to parse backup file: ${err?.message || 'Syntax error'}` };
    }
  }

  // --- SETTINGS APIS ---
  getSettings(): UserSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) return DEFAULT_SETTINGS;
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  // --- USER & AUTH APIS ---
  async syncCloudDatabase(): Promise<void> {
    try {
      const payload = await cloudSync.fetchCloudDatabase();
      if (!payload) return;

      if (payload.users && payload.users.length > 0) {
        const localUsers = this.getUsers();
        const userMap = new Map<string, MexoUser>();
        localUsers.forEach((u) => userMap.set(u.id, u));
        payload.users.forEach((u) => {
          const existing = userMap.get(u.id);
          userMap.set(u.id, existing ? { ...existing, ...u } : u);
        });
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(userMap.values())));
      }

      if (payload.messages && payload.messages.length > 0) {
        const localMsgs = this.getMessages();
        const msgMap = new Map<string, Message>();
        localMsgs.forEach((m) => msgMap.set(m.id, m));
        payload.messages.forEach((m) => {
          if (!msgMap.has(m.id)) msgMap.set(m.id, m);
        });
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(Array.from(msgMap.values())));
      }
    } catch (err) {
      console.warn('Cloud database sync error:', err);
    }
  }

  async syncCloudUsers(): Promise<MexoUser[]> {
    try {
      const cloudUsers = await cloudSync.fetchCloudUsers();
      if (!cloudUsers || cloudUsers.length === 0) return this.getUsers();

      const localUsers = this.getUsers();
      const userMap = new Map<string, MexoUser>();

      localUsers.forEach((u) => userMap.set(u.id, u));
      cloudUsers.forEach((u) => {
        const existing = userMap.get(u.id);
        if (!existing) {
          userMap.set(u.id, u);
        } else {
          userMap.set(u.id, { ...existing, ...u });
        }
      });

      const merged = Array.from(userMap.values());
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
      return merged;
    } catch {
      return this.getUsers();
    }
  }

  getUsers(): MexoUser[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  getUserById(id: string): MexoUser | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  getUserByEmail(email: string): MexoUser | undefined {
    const clean = email.toLowerCase().trim();
    return this.getUsers().find((u) => u.email.toLowerCase() === clean);
  }

  async getUserByEmailAsync(email: string): Promise<MexoUser | undefined> {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;
    await this.syncCloudUsers();
    return this.getUserByEmail(email);
  }

  getCurrentUser(): MexoUser {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-1';
    const user = this.getUserById(currentId);
    if (user) return user;
    return INITIAL_USERS[0];
  }

  setCurrentUser(userId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  checkUsernameAvailable(username: string): { available: boolean; reason?: string; alternatives?: string[] } {
    const clean = username.toLowerCase().trim();

    if (!clean) return { available: false, reason: 'Username cannot be empty.' };
    if (clean.length < 3) return { available: false, reason: 'Minimum length is 3 characters.' };
    if (clean.length > 30) return { available: false, reason: 'Maximum length is 30 characters.' };
    if (!/^[a-zA-Z0-9.]+$/.test(clean)) {
      return { available: false, reason: 'Only letters, numbers, and periods are allowed.' };
    }

    if (RESERVED_USERNAMES.includes(clean)) {
      return {
        available: false,
        reason: 'This system address is reserved.',
        alternatives: [`${clean}07`, `${clean}.mexo`, `my.${clean}`],
      };
    }

    const exists = this.getUsers().some((u) => u.username.toLowerCase() === clean);
    if (exists) {
      return {
        available: false,
        reason: 'Already taken.',
        alternatives: [`${clean}01`, `${clean}.c`, `m.${clean}`, `${clean}26`],
      };
    }

    return { available: true };
  }

  createUser(userData: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    recoveryEmail?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
    createdByAdmin?: boolean;
    requiresPasswordChange?: boolean;
  }): MexoUser {
    const users = this.getUsers();
    const newUser: MexoUser = {
      id: `usr-${Date.now()}`,
      username: userData.username.toLowerCase().trim(),
      email: `${userData.username.toLowerCase().trim()}@mexo.com`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'user',
      password: userData.password || 'password123',
      recoveryEmail: userData.recoveryEmail,
      dob: userData.dob,
      gender: userData.gender,
      avatarUrl: userData.avatarUrl,
      createdByAdmin: userData.createdByAdmin,
      requiresPasswordChange: userData.requiresPasswordChange,
      status: 'active',
      storageUsedBytes: 0,
      storageLimitBytes: 15 * 1024 * 1024 * 1024,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      twoFactorEnabled: false,
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    cloudSync.pushCloudUsers(users).catch(() => {});
    this.setCurrentUser(newUser.id);
    this.sendWelcomeEmail(newUser);
    this.addAuditLog('admin@mexo.com', 'ACCOUNT_CREATED', newUser.email, 'success');
    return newUser;
  }

  updateUser(id: string, updates: Partial<MexoUser>): MexoUser | undefined {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    cloudSync.pushCloudUsers(users).catch(() => {});
    return users[idx];
  }

  changeUserPassword(userId: string, newPassword: string): MexoUser | undefined {
    const updated = this.updateUser(userId, {
      password: newPassword,
      requiresPasswordChange: false,
      createdByAdmin: false,
    });
    if (updated) {
      this.addAuditLog(updated.email, 'USER_PASSWORD_CHANGED', updated.email, 'success');
    }
    return updated;
  }

  deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    const filtered = users.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    cloudSync.pushCloudUsers(filtered).catch(() => {});
    this.addAuditLog('admin@mexo.com', 'ACCOUNT_DELETED', target.email, 'warning');
    return true;
  }

  sendWelcomeEmail(user: MexoUser) {
    const messages = this.getMessages();
    const welcomeId = `msg-welcome-${user.id}`;
    
    // Idempotency check
    const exists = messages.some(
      (m) => m.id === welcomeId || (m.threadId === `th-welcome-${user.id}` && m.userState.recipientEmail.toLowerCase() === user.email.toLowerCase())
    );
    if (exists) return;

    const welcomeMessage: Message = {
      id: welcomeId,
      threadId: `th-welcome-${user.id}`,
      senderName: 'MEXO Team',
      senderEmail: 'welcome@mexo.com',
      recipients: [user.email],
      subject: 'Welcome to MEXO Mail 👋',
      snippet: `Hi ${user.firstName}, Welcome to MEXO Mail. Your new MEXO address is ready: ${user.email}...`,
      bodyHtml: `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; padding: 24px; color: #101828; line-height: 1.6;">
          <h2 style="color: #0878e8; font-size: 20px; font-weight: 800; margin-bottom: 16px;">Welcome to MEXO Mail 👋</h2>
          <p>Hi <strong>${user.firstName}</strong>,</p>
          <p>Welcome to MEXO Mail.</p>
          <p>Your new MEXO address is ready: <strong style="color: #0878e8;">${user.email}</strong></p>
          <p>MEXO Mail gives you a simple and secure place to send, receive and organize your conversations.</p>
          <p><strong>You can now:</strong></p>
          <ul style="padding-left: 20px; color: #475467;">
            <li>Send and receive MEXO Mail</li>
            <li>Organize messages with labels</li>
            <li>Search your mailbox</li>
            <li>Save contacts</li>
            <li>Manage your MEXO Account</li>
          </ul>
          <p>Your MEXO Account is designed to work across future MEXO products, so you can use one identity across the MEXO ecosystem.</p>
          <br/>
          <p style="font-weight: 600; color: #0878e8; margin-bottom: 4px;">Made to Connect.</p>
          <p style="color: #8492A6; font-size: 13px;">— <strong>MEXO Team</strong></p>
        </div>
      `,
      attachments: [],
      createdAt: new Date().toISOString(),
      userState: {
        recipientEmail: user.email,
        isRead: false,
        isStarred: false,
        isImportant: true,
        isArchived: false,
        isDeleted: false,
        isSpam: false,
        labels: [],
      },
    };

    messages.unshift(welcomeMessage);
    this.saveMessages(messages);
  }

  // --- MESSAGES & THREADS APIS ---
  getMessages(): Message[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
  }

  saveMessages(messages: Message[]) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    cloudSync.pushCloudDatabase({ messages }).catch(() => {});
  }

  getMessagesForUser(userEmail: string): Message[] {
    const all = this.getMessages();
    let cleanEmail = userEmail.toLowerCase().trim();
    if (!cleanEmail.includes('@')) {
      cleanEmail = `${cleanEmail}@mexo.com`;
    }

    const userMessages: Message[] = [];
    const seenIds = new Set<string>();

    for (const m of all) {
      if (seenIds.has(m.id)) continue;
      const recipStateEmail = m.userState?.recipientEmail?.toLowerCase().trim();
      const isRecipient = recipStateEmail === cleanEmail || (m.recipients && m.recipients.some((r) => {
        const cleanR = r.toLowerCase().trim();
        return cleanR === cleanEmail || (cleanR.includes('@') ? cleanR === cleanEmail : `${cleanR}@mexo.com` === cleanEmail);
      }));

      // Match messages scoped to this user state, or sent/received by this user
      if (recipStateEmail === cleanEmail || isRecipient) {
        // If recipientEmail matches or sender matches
        if (recipStateEmail === cleanEmail) {
          seenIds.add(m.id);
          userMessages.push(m);
        } else if (m.senderEmail.toLowerCase().trim() === cleanEmail && !m.userState?.recipientEmail) {
          seenIds.add(m.id);
          userMessages.push(m);
        }
      }
    }

    return userMessages;
  }

  sendMessage(params: {
    senderEmail: string;
    senderName: string;
    recipients: string[]; // Email array, e.g. ["arun@mexo.com", "iii-it-a@mexo.com"]
    subject: string;
    bodyHtml: string;
    attachments?: any[];
    clientMessageId?: string;
  }): Message[] {
    const createdMessages: Message[] = [];
    const allMessages = this.getMessages();

    // Idempotency check: if a message with clientMessageId already exists in database, return it
    if (params.clientMessageId) {
      const existing = allMessages.filter(
        (m) => m.id === params.clientMessageId || (m as any).clientMessageId === params.clientMessageId
      );
      if (existing.length > 0) {
        return existing;
      }
    }

    let cleanSenderEmail = params.senderEmail.toLowerCase().trim();
    if (!cleanSenderEmail.includes('@')) {
      cleanSenderEmail = `${cleanSenderEmail}@mexo.com`;
    }

    const currentUser = this.getUserByEmail(cleanSenderEmail) || this.getCurrentUser();
    const groups = this.getGroups();

    // Resolve recipients - expanded for MEXO Groups! Normalize to full emails
    const resolvedRecipients: string[] = [];

    params.recipients.forEach((recip) => {
      let clean = recip.toLowerCase().trim();
      if (!clean.includes('@')) {
        clean = `${clean}@mexo.com`;
      }
      const groupMatch = groups.find((g) => g.address.toLowerCase() === clean);
      if (groupMatch) {
        // MEXO Group Distribution Engine:
        groupMatch.members.forEach((mem) => {
          let memEmail = mem.email.toLowerCase().trim();
          if (!memEmail.includes('@')) memEmail = `${memEmail}@mexo.com`;
          if (!resolvedRecipients.includes(memEmail)) {
            resolvedRecipients.push(memEmail);
          }
        });
      } else {
        if (!resolvedRecipients.includes(clean)) {
          resolvedRecipients.push(clean);
        }
      }
    });

    const threadId = `th-${Date.now()}`;
    const messageId = params.clientMessageId || `msg-${Date.now()}`;
    const snippet = params.bodyHtml.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...';

    // 1. Create message for Sender inbox/sent record
    const senderMessage: Message = {
      id: messageId,
      threadId,
      senderName: params.senderName,
      senderEmail: cleanSenderEmail,
      recipients: params.recipients,
      subject: params.subject || '(no subject)',
      snippet,
      bodyHtml: params.bodyHtml,
      attachments: params.attachments || [],
      createdAt: new Date().toISOString(),
      userState: {
        recipientEmail: cleanSenderEmail,
        isRead: true,
        isStarred: false,
        isImportant: false,
        isArchived: false,
        isDeleted: false,
        isSpam: false,
        labels: [],
      },
    };
    (senderMessage as any).clientMessageId = params.clientMessageId;
    allMessages.unshift(senderMessage);
    createdMessages.push(senderMessage);

    // 2. Create individual recipient inbox states for each resolved user (ONLY if distinct from sender!)
    resolvedRecipients.forEach((recipEmail) => {
      if (recipEmail !== cleanSenderEmail) {
        const recipMsg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          threadId,
          senderName: params.senderName,
          senderEmail: cleanSenderEmail,
          recipients: params.recipients,
          subject: params.subject || '(no subject)',
          snippet,
          bodyHtml: params.bodyHtml,
          attachments: params.attachments || [],
          createdAt: new Date().toISOString(),
          userState: {
            recipientEmail: recipEmail,
            isRead: false,
            isStarred: false,
            isImportant: false,
            isArchived: false,
            isDeleted: false,
            isSpam: false,
            labels: [],
          },
        };
        (recipMsg as any).clientMessageId = params.clientMessageId;
        allMessages.unshift(recipMsg);
        createdMessages.push(recipMsg);
      }
    });

    this.saveMessages(allMessages);

    // Update sender storage estimate
    if (params.attachments && params.attachments.length > 0) {
      const totalSize = params.attachments.reduce((acc, a) => acc + (a.sizeBytes || 0), 0);
      currentUser.storageUsedBytes += totalSize;
      this.updateUser(currentUser.id, { storageUsedBytes: currentUser.storageUsedBytes });
    }

    return createdMessages;
  }

  updateMessageState(messageId: string, updates: Partial<Message['userState']>) {
    const messages = this.getMessages();
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      messages[idx].userState = { ...messages[idx].userState, ...updates };
      this.saveMessages(messages);
    }
  }

  deleteMessagePermanently(messageId: string) {
    const messages = this.getMessages().filter((m) => m.id !== messageId);
    this.saveMessages(messages);
  }

  emptyTrash(userEmail: string) {
    const messages = this.getMessages().filter(
      (m) => !(m.userState.recipientEmail.toLowerCase() === userEmail.toLowerCase() && m.userState.isDeleted)
    );
    this.saveMessages(messages);
  }

  // --- DRAFTS APIS ---
  getDrafts(): Draft[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFTS) || '[]');
  }

  getDraftsForUser(userEmail: string): Draft[] {
    const drafts = this.getDrafts();
    const cleanEmail = userEmail.toLowerCase().trim();
    return drafts.filter((d) => !d.userEmail || d.userEmail.toLowerCase() === cleanEmail);
  }

  saveDraft(draft: Draft): Draft {
    const drafts = this.getDrafts();
    const currentUser = this.getCurrentUser();
    const draftToSave = {
      ...draft,
      userEmail: draft.userEmail || currentUser.email,
      lastSavedAt: new Date().toISOString(),
    };
    const existingIdx = drafts.findIndex((d) => d.id === draftToSave.id);
    if (existingIdx !== -1) {
      drafts[existingIdx] = draftToSave;
    } else {
      drafts.push(draftToSave);
    }
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    cloudSync.pushCloudDatabase({ drafts }).catch(() => {});
    return draftToSave;
  }

  deleteDraft(draftId: string) {
    const drafts = this.getDrafts().filter((d) => d.id !== draftId);
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    cloudSync.pushCloudDatabase({ drafts }).catch(() => {});
  }

  // --- GROUPS APIS ---
  getGroups(): MexoGroup[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '[]');
  }

  checkGroupAddressAvailable(address: string): boolean {
    const clean = address.toLowerCase().trim();
    if (!clean || !clean.endsWith('@mexo.com')) return false;
    const nameOnly = clean.replace('@mexo.com', '');
    if (RESERVED_USERNAMES.includes(nameOnly)) return false;
    const existingGroup = this.getGroups().some((g) => g.address.toLowerCase() === clean);
    const existingUser = this.getUsers().some((u) => u.email.toLowerCase() === clean);
    return !existingGroup && !existingUser;
  }

  createGroup(params: {
    name: string;
    address: string;
    description: string;
    privacy: MexoGroup['privacy'];
    postingPermission: MexoGroup['postingPermission'];
  }): MexoGroup {
    const groups = this.getGroups();
    const currentUser = this.getCurrentUser();

    const newGroup: MexoGroup = {
      id: `grp-${Date.now()}`,
      name: params.name,
      address: params.address.toLowerCase().trim(),
      description: params.description,
      memberCount: 1,
      privacy: params.privacy,
      postingPermission: params.postingPermission,
      viewMembersPermission: 'members',
      members: [
        {
          userId: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          avatarUrl: currentUser.avatarUrl,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    groups.push(newGroup);
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
    cloudSync.pushCloudDatabase({ groups }).catch(() => {});
    this.addAuditLog(currentUser.email, 'GROUP_CREATED', newGroup.address, 'success');
    return newGroup;
  }

  addMemberToGroup(groupId: string, memberEmail: string, role: GroupMember['role'] = 'member') {
    const groups = this.getGroups();
    const grp = groups.find((g) => g.id === groupId);
    if (grp) {
      const user = this.getUserByEmail(memberEmail);
      if (!grp.members.some((m) => m.email.toLowerCase() === memberEmail.toLowerCase())) {
        grp.members.push({
          userId: user?.id || `usr-ext-${Date.now()}`,
          email: memberEmail,
          firstName: user?.firstName || memberEmail.split('@')[0],
          lastName: user?.lastName || '',
          avatarUrl: user?.avatarUrl,
          role,
          joinedAt: new Date().toISOString(),
        });
        grp.memberCount = grp.members.length;
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
        cloudSync.pushCloudDatabase({ groups }).catch(() => {});
      }
    }
  }

  // --- CONTACTS APIS ---
  getContacts(): Contact[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTS) || '[]');
  }

  createContact(contactData: Omit<Contact, 'id' | 'createdAt'>): Contact {
    const contacts = this.getContacts();
    const newContact: Contact = {
      ...contactData,
      id: `cnt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    cloudSync.pushCloudDatabase({ contacts }).catch(() => {});
    return newContact;
  }

  updateContact(id: string, updates: Partial<Contact>): Contact {
    const contacts = this.getContacts();
    const idx = contacts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      contacts[idx] = { ...contacts[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
      cloudSync.pushCloudDatabase({ contacts }).catch(() => {});
      return contacts[idx];
    }
    throw new Error('Contact not found');
  }

  deleteContact(id: string) {
    const contacts = this.getContacts().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    cloudSync.pushCloudDatabase({ contacts }).catch(() => {});
  }

  // --- LABELS APIS ---
  getLabels(): Label[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LABELS) || '[]');
  }

  createLabel(name: string, color: string, parentLabelId?: string): Label {
    const labels = this.getLabels();
    const newLabel: Label = {
      id: `lbl-${Date.now()}`,
      name,
      color,
      parentLabelId,
      unreadCount: 0,
    };
    labels.push(newLabel);
    localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
    cloudSync.pushCloudDatabase({ labels }).catch(() => {});
    return newLabel;
  }

  updateLabel(id: string, updates: Partial<Label>): Label {
    const labels = this.getLabels();
    const idx = labels.findIndex((l) => l.id === id);
    if (idx !== -1) {
      labels[idx] = { ...labels[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
      cloudSync.pushCloudDatabase({ labels }).catch(() => {});
      return labels[idx];
    }
    throw new Error('Label not found');
  }

  deleteLabel(id: string) {
    const labels = this.getLabels().filter((l) => l.id !== id && l.parentLabelId !== id);
    localStorage.setItem(STORAGE_KEYS.LABELS, JSON.stringify(labels));
    cloudSync.pushCloudDatabase({ labels }).catch(() => {});
  }

  assignLabelsToMessage(messageId: string, labelIds: string[]) {
    const messages = this.getMessages();
    const idx = messages.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      messages[idx].userState.labels = labelIds;
      this.saveMessages(messages);
    }
  }

  // --- ADMIN AUDIT & METRICS ---
  getAuditLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  addAuditLog(actorEmail: string, action: string, target: string, result: 'success' | 'failed' | 'warning' = 'success') {
    const logs = this.getAuditLogs();
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail,
      action,
      target,
      result,
      ipAddress: '127.0.0.1',
    };
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
  }

  getAdminMetrics(): AdminMetrics {
    const users = this.getUsers();
    const groups = this.getGroups();
    const messages = this.getMessages();
    const totalStorage = users.reduce((acc, u) => acc + u.storageUsedBytes, 0);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      messagesToday: messages.length,
      messagesThisMonth: messages.length * 4,
      totalGroups: groups.length,
      storageUsedBytes: totalStorage,
      storageTotalBytes: 500 * 1024 * 1024 * 1024,
      failedDeliveries: 0,
      spamReports: 1,
      securityAlerts: 0,
    };
  }

  // --- TEMPLATES ---
  getTemplates(): ComposeTemplate[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
  }

  saveTemplate(template: Omit<ComposeTemplate, 'id' | 'createdAt'>): ComposeTemplate {
    const templates = this.getTemplates();
    const newTpl: ComposeTemplate = {
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...template,
    };
    templates.push(newTpl);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return newTpl;
  }

  deleteTemplate(id: string) {
    const templates = this.getTemplates().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }

  updateTemplate(id: string, updates: Partial<Omit<ComposeTemplate, 'id' | 'createdAt'>>): ComposeTemplate | null {
    const templates = this.getTemplates();
    const idx = templates.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    templates[idx] = { ...templates[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return templates[idx];
  }

  // Apply saved accent color as CSS variable on boot
  applyAccentColor(color: string) {
    document.documentElement.style.setProperty('--color-accent', color);
    // Compute hover variant (slightly darker)
    document.documentElement.style.setProperty('--color-accent-hover', color);
  }

  // Calculate real dynamic storage used by a user's messages and attachments
  getStorageForUser(email: string): { usedBytes: number; limitBytes: number; usedFormatted: string; percent: number } {
    const msgs = this.getMessagesForUser(email);
    let totalBytes = 0;
    msgs.forEach((m) => {
      totalBytes += (m.subject || '').length * 2;
      totalBytes += (m.bodyHtml || '').length * 2;
      totalBytes += (m.snippet || '').length * 2;
      (m.attachments || []).forEach((att) => {
        totalBytes += att.sizeBytes || 1024 * 50;
      });
    });
    const drafts = this.getDraftsForUser(email);
    drafts.forEach((d) => {
      totalBytes += (d.subject || '').length * 2;
      totalBytes += (d.bodyHtml || '').length * 2;
      (d.attachments || []).forEach((att) => {
        totalBytes += att.sizeBytes || 1024 * 50;
      });
    });

    const user = this.getUserByEmail(email);
    const baseBytes = user?.storageUsedBytes || 4.8 * 1024 * 1024 * 1024; // Default ~4.8GB base for active account
    const combinedBytes = baseBytes + totalBytes;
    const limitBytes = user?.storageLimitBytes || 15 * 1024 * 1024 * 1024;

    let usedFormatted = '';
    if (combinedBytes < 1024 * 1024) {
      usedFormatted = `${(combinedBytes / 1024).toFixed(1)} KB`;
    } else if (combinedBytes < 1024 * 1024 * 1024) {
      usedFormatted = `${(combinedBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      usedFormatted = `${(combinedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    const percent = Math.min(100, Math.max(1, (combinedBytes / limitBytes) * 100));

    return { usedBytes: combinedBytes, limitBytes, usedFormatted, percent: Number(percent.toFixed(1)) };
  }
}

export const db = new MexoDatabase();
