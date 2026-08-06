import { MexoUser, UserSession } from '../types/user';
import { Message, Draft, Label } from '../types/mail';
import { MexoGroup, GroupMember } from '../types/group';
import { Contact } from '../types/contact';
import { AuditLog, AdminMetrics } from '../types/admin';
import { api } from './api';

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
  signatureContent: 'Best regards,\nMEXO Mail User',
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
  private cachedUsers: MexoUser[] = [];
  private cachedMessages: Message[] = [];
  private cachedDrafts: Draft[] = [];
  private cachedContacts: Contact[] = [];
  private cachedGroups: MexoGroup[] = [];
  private cachedLabels: Label[] = [];
  private cachedTemplates: ComposeTemplate[] = [];

  constructor() {
    this.cachedMessages = this.loadMessagesFromStorage();
  }

  private loadMessagesFromStorage(): Message[] {
    try {
      const raw = localStorage.getItem('mexo_messages_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error loading cached messages:', e);
    }
    return [];
  }

  private saveMessagesToStorage(): void {
    try {
      localStorage.setItem('mexo_messages_v1', JSON.stringify(this.cachedMessages));
    } catch (e) {
      console.warn('Error saving cached messages:', e);
    }
  }

  // --- SETTINGS ---
  getSettings(): UserSettings {
    const stored = localStorage.getItem('mexo_ui_settings');
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
    localStorage.setItem('mexo_ui_settings', JSON.stringify(updated));
    return updated;
  }

  // --- USERS & AUTH ---
  async syncCloudDatabase(): Promise<void> {
    await this.syncCloudUsers();
  }

  async syncCloudUsers(): Promise<MexoUser[]> {
    const users = await api.getAllUsers();
    this.cachedUsers = users;
    return users;
  }

  getUsers(): MexoUser[] {
    return this.cachedUsers;
  }

  getUserById(id: string): MexoUser | undefined {
    return this.cachedUsers.find((u) => u.id === id);
  }

  getUserByEmail(email: string): MexoUser | undefined {
    const clean = email.toLowerCase().trim();
    return this.cachedUsers.find((u) => u.email.toLowerCase() === clean);
  }

  getCurrentUser(): MexoUser | null {
    if (this.cachedUsers.length > 0) return this.cachedUsers[0];
    return null;
  }

  async checkUsernameAvailable(username: string): Promise<{ available: boolean; reason?: string }> {
    return api.checkUsernameAvailable(username);
  }

  async createUser(userData: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    recoveryEmail?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
    createdByAdmin?: boolean;
  }): Promise<MexoUser | null> {
    const res = await api.createUserAccount(userData);
    if (res.user) {
      this.cachedUsers.unshift(res.user);
    }
    return res.user;
  }

  async updateUser(id: string, updates: Partial<MexoUser>): Promise<MexoUser | null> {
    const updated = await api.updateUserProfile(id, updates);
    if (updated) {
      const idx = this.cachedUsers.findIndex((u) => u.id === id);
      if (idx !== -1) this.cachedUsers[idx] = updated;
    }
    return updated;
  }

  async changeUserPassword(userId: string, newPassword: string): Promise<MexoUser | null> {
    return this.updateUser(userId, { requiresPasswordChange: false });
  }

  async deleteUser(id: string, email: string): Promise<boolean> {
    const success = await api.deleteUserAccount(id, email);
    if (success) {
      this.cachedUsers = this.cachedUsers.filter((u) => u.id !== id);
    }
    return success;
  }

  // --- MESSAGES ---
  async fetchMessagesForUser(userId: string): Promise<Message[]> {
    if (!userId || userId === 'guest-user') return this.cachedMessages;
    try {
      const msgs = await api.getMessagesForUser(userId);
      this.cachedMessages = msgs || [];
      return this.cachedMessages;
    } catch (err) {
      console.error('Error fetching messages in db:', err);
      return this.cachedMessages;
    }
  }

  getMessages(): Message[] {
    return this.cachedMessages;
  }

  getMessagesForUser(userEmail: string): Message[] {
    const clean = userEmail.toLowerCase().trim();
    if (!clean) return this.cachedMessages;
    const cleanUsername = clean.includes('@') ? clean.split('@')[0] : clean;
    const fullEmail = clean.includes('@') ? clean : `${clean}@mexo.com`;

    return this.cachedMessages.filter((m) => {
      const recip = m.userState?.recipientEmail?.toLowerCase().trim() || '';
      const sender = m.senderEmail?.toLowerCase().trim() || '';

      const isSender = sender === clean || sender === cleanUsername || sender === fullEmail;
      const isRecipientState = recip === clean || recip === cleanUsername || recip === fullEmail;
      const isRecipientList = (m.recipients || []).some((r) => {
        const cleanR = r.toLowerCase().trim();
        return cleanR === clean || cleanR === cleanUsername || cleanR === fullEmail;
      });

      return isSender || isRecipientState || isRecipientList;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async sendMessage(params: {
    senderUserId?: string;
    senderEmail: string;
    senderName: string;
    recipients: string[];
    subject: string;
    bodyHtml: string;
    attachments?: any[];
    clientMessageId?: string;
    draftId?: string;
  }): Promise<{ success: boolean; error?: string; messageId?: string }> {
    const res = await api.sendMessage(params);
    if (res.success && params.senderUserId) {
      // Refresh messages for sender from central DB
      await this.fetchMessagesForUser(params.senderUserId);
    }
    return res;
  }

  async updateMessageState(stateId: string, updates: any): Promise<boolean> {
    const idx = this.cachedMessages.findIndex((m) => m.id === stateId);
    if (idx !== -1) {
      this.cachedMessages[idx] = {
        ...this.cachedMessages[idx],
        userState: {
          ...this.cachedMessages[idx].userState,
          ...updates,
        },
      };
    }
    return api.updateMessageState(stateId, updates);
  }

  async deleteMessagePermanently(stateId: string): Promise<boolean> {
    this.cachedMessages = this.cachedMessages.filter((m) => m.id !== stateId);
    return api.deleteMessageState(stateId);
  }

  // --- DRAFTS ---
  getDrafts(): Draft[] {
    return this.cachedDrafts;
  }

  getDraftsForUser(userEmail: string): Draft[] {
    const clean = userEmail.toLowerCase().trim();
    if (!clean) return this.cachedDrafts;
    return this.cachedDrafts.filter(
      (d) => !d.userEmail || d.userEmail.toLowerCase() === clean
    );
  }

  async fetchDraftsForUser(userId: string): Promise<Draft[]> {
    if (!userId || userId === 'guest-user') return this.cachedDrafts;
    try {
      const drafts = await api.getDraftsForUser(userId);
      this.cachedDrafts = drafts || [];
      return this.cachedDrafts;
    } catch (err) {
      console.error('Error fetching drafts in db:', err);
      return this.cachedDrafts;
    }
  }

  async saveDraft(userId: string, draft: Partial<Draft>): Promise<Draft | null> {
    const draftId = draft.id || `drf-${Date.now()}`;
    const newDraft: Draft = {
      id: draftId,
      userEmail: draft.userEmail || '',
      to: draft.to || [],
      cc: draft.cc || [],
      bcc: draft.bcc || [],
      subject: draft.subject || '',
      bodyHtml: draft.bodyHtml || '',
      attachments: draft.attachments || [],
      lastSavedAt: draft.lastSavedAt || new Date().toISOString(),
    };

    const idx = this.cachedDrafts.findIndex((d) => d.id === draftId);
    if (idx !== -1) {
      this.cachedDrafts[idx] = newDraft;
    } else {
      this.cachedDrafts.unshift(newDraft);
    }

    if (userId && userId !== 'guest-user') {
      const saved = await api.saveDraft(userId, newDraft);
      if (saved) return saved;
    }
    return newDraft;
  }

  async deleteDraft(draftId: string): Promise<boolean> {
    this.cachedDrafts = this.cachedDrafts.filter((d) => d.id !== draftId);
    if (draftId && !draftId.startsWith('drf-')) {
      await api.deleteDraft(draftId);
    }
    return true;
  }

  async clearDraftsForMessage(senderEmail: string, recipients: string[], subject: string): Promise<void> {
    const cleanSender = senderEmail.toLowerCase().trim();
    const cleanSubject = (subject || '').toLowerCase().trim();

    const draftsToDelete = this.cachedDrafts.filter((d) => {
      const sameSender = !d.userEmail || d.userEmail.toLowerCase().trim() === cleanSender;
      const sameSubject = (d.subject || '').toLowerCase().trim() === cleanSubject;
      return sameSender && sameSubject && cleanSubject.length > 0;
    });

    this.cachedDrafts = this.cachedDrafts.filter((d) => !draftsToDelete.includes(d));

    for (const d of draftsToDelete) {
      if (d.id && !d.id.startsWith('drf-')) {
        api.deleteDraft(d.id).catch(() => {});
      }
    }
  }

  // --- CONTACTS ---
  getContacts(): Contact[] {
    return this.cachedContacts;
  }

  async getContactsForUser(userId: string): Promise<Contact[]> {
    const contacts = await api.getContactsForUser(userId);
    this.cachedContacts = contacts;
    return contacts;
  }

  async createContact(userId: string | Omit<Contact, 'id' | 'createdAt'>, contactData?: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact | null> {
    if (typeof userId === 'object') {
      const created = await api.createContact('system-user', userId);
      if (created) this.cachedContacts.push(created);
      return created;
    }
    if (contactData) {
      const created = await api.createContact(userId, contactData);
      if (created) this.cachedContacts.push(created);
      return created;
    }
    return null;
  }

  updateContact(id: string, updates: Partial<Contact>): Contact {
    const idx = this.cachedContacts.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.cachedContacts[idx] = { ...this.cachedContacts[idx], ...updates };
      return this.cachedContacts[idx];
    }
    throw new Error('Contact not found');
  }

  async deleteContact(idOrUserId: string, contactId?: string): Promise<boolean> {
    const targetId = contactId || idOrUserId;
    const ok = await api.deleteContact(targetId);
    if (ok) {
      this.cachedContacts = this.cachedContacts.filter((c) => c.id !== targetId);
    }
    return ok;
  }

  // --- GROUPS ---
  getGroups(): MexoGroup[] {
    return this.cachedGroups;
  }

  async getGroupsForUser(userId: string): Promise<MexoGroup[]> {
    const groups = await api.getGroupsForUser(userId);
    this.cachedGroups = groups;
    return groups;
  }

  addMemberToGroup(groupId: string, memberEmail: string, role: string = 'member') {
    const grp = this.cachedGroups.find((g) => g.id === groupId);
    if (grp) {
      grp.members.push({
        userId: `usr-${Date.now()}`,
        email: memberEmail,
        firstName: memberEmail.split('@')[0],
        lastName: '',
        role: role as any,
        joinedAt: new Date().toISOString(),
      });
    }
  }

  // --- LABELS ---
  getLabels(): Label[] {
    return this.cachedLabels;
  }

  async getLabelsForUser(userId: string): Promise<Label[]> {
    const labels = await api.getLabelsForUser(userId);
    this.cachedLabels = labels;
    return labels;
  }

  async createLabel(userId: string, name: string, color?: string): Promise<Label | null> {
    const created = await api.createLabel(userId, name, color || '#0878e8');
    if (created) this.cachedLabels.push(created);
    return created;
  }

  updateLabel(id: string, updates: Partial<Label>): Label {
    const idx = this.cachedLabels.findIndex((l) => l.id === id);
    if (idx !== -1) {
      this.cachedLabels[idx] = { ...this.cachedLabels[idx], ...updates };
      return this.cachedLabels[idx];
    }
    throw new Error('Label not found');
  }

  deleteLabel(id: string) {
    this.cachedLabels = this.cachedLabels.filter((l) => l.id !== id);
  }

  // --- TEMPLATES ---
  getTemplates(): ComposeTemplate[] {
    return this.cachedTemplates;
  }

  saveTemplate(template: Omit<ComposeTemplate, 'id' | 'createdAt'>): ComposeTemplate {
    const newTpl: ComposeTemplate = {
      id: `tpl-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...template,
    };
    this.cachedTemplates.push(newTpl);
    return newTpl;
  }

  deleteTemplate(id: string) {
    this.cachedTemplates = this.cachedTemplates.filter((t) => t.id !== id);
  }

  updateTemplate(id: string, updates: Partial<Omit<ComposeTemplate, 'id' | 'createdAt'>>): ComposeTemplate | null {
    const idx = this.cachedTemplates.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.cachedTemplates[idx] = { ...this.cachedTemplates[idx], ...updates };
    return this.cachedTemplates[idx];
  }

  // --- AUDIT LOGS & METRICS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    return api.getAuditLogs();
  }

  async addAuditLog(actorEmail: string, action: string, target: string, result: 'success' | 'failed' | 'warning' = 'success'): Promise<void> {
    return api.addAuditLog(actorEmail, action, target, result);
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    return api.getAdminMetrics();
  }

  applyAccentColor(color: string) {
    document.documentElement.style.setProperty('--color-[#7C3AED]', color);
    document.documentElement.style.setProperty('--color-accent-hover', color);
  }

  getStorageForUser(email: string): { usedBytes: number; limitBytes: number; usedFormatted: string; percent: number } {
    const user = this.getUserByEmail(email);
    const usedBytes = user?.storageUsedBytes || 0;
    const limitBytes = user?.storageLimitBytes || 15 * 1024 * 1024 * 1024;

    let usedFormatted = '0 MB';
    if (usedBytes < 1024 * 1024) {
      usedFormatted = `${(usedBytes / 1024).toFixed(1)} KB`;
    } else if (usedBytes < 1024 * 1024 * 1024) {
      usedFormatted = `${(usedBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      usedFormatted = `${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    const percent = Math.min(100, Math.max(0, (usedBytes / limitBytes) * 100));

    return { usedBytes, limitBytes, usedFormatted, percent: Number(percent.toFixed(1)) };
  }
}

export const db = new MexoDatabase();
