import { supabase } from './supabaseClient';
import { MexoUser, UserSession, SecurityEvent } from '../types/user';
import { Message, Label, Draft, UserSignature } from '../types/mail';
import { MexoGroup, GroupMember } from '../types/group';
import { Contact } from '../types/contact';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export const api = {
  // --- AUTH & PROFILE ---
  async getCurrentUserProfile(userId: string): Promise<MexoUser | null> {
    try {
      const { data: user, error: uErr } = await supabase
        .schema('mexo_identity')
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (uErr || !user) return null;

      const { data: profile } = await supabase
        .schema('mexo_identity')
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      return {
        id: user.id,
        username: user.username,
        email: user.primary_address,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        avatarUrl: profile?.avatar_object_id || undefined,
        role: user.status === 'ADMIN' ? 'system_admin' : 'user',
        status: user.status === 'ACTIVE' ? 'active' : 'suspended',
        storageUsedBytes: 0,
        storageLimitBytes: 15 * 1024 * 1024 * 1024,
        createdAt: user.created_at,
        lastActiveAt: user.updated_at,
        twoFactorEnabled: false,
      };
    } catch {
      return null;
    }
  },

  // --- MAIL & MESSAGES ---
  async getMessagesForUser(userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .schema('mexo_mail')
        .from('message_states')
        .select(`
          message_id,
          folder,
          is_read,
          read_at,
          is_archived,
          is_deleted,
          is_spam,
          is_important,
          updated_at,
          message:messages (
            id,
            thread_id,
            sender_user_id,
            sender_address,
            subject,
            body_html,
            body_text,
            message_type,
            status,
            created_at,
            sent_at
          )
        `)
        .eq('user_id', userId);

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.message.id,
        threadId: item.message.thread_id,
        senderName: item.message.sender_address.split('@')[0],
        senderEmail: item.message.sender_address,
        recipients: [],
        subject: item.message.subject,
        bodyHtml: item.message.body_html,
        snippet: item.message.body_text?.substring(0, 100) || '',
        createdAt: item.message.created_at || item.message.sent_at,
        attachments: [],
        userState: {
          recipientEmail: item.message.sender_address,
          isRead: item.is_read,
          isStarred: false,
          isArchived: item.is_archived,
          isDeleted: item.is_deleted,
          isSpam: item.is_spam,
          isImportant: item.is_important,
          labels: [],
        },
      }));
    } catch {
      return [];
    }
  },

  // --- DRAFTS ---
  async getDraftsForUser(userId: string): Promise<Draft[]> {
    try {
      const { data, error } = await supabase
        .schema('mexo_mail')
        .from('drafts')
        .select('*')
        .eq('owner_user_id', userId);

      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        to: [],
        cc: [],
        bcc: [],
        subject: d.subject || '',
        bodyHtml: d.body_html || '',
        attachments: [],
        lastSavedAt: d.last_saved_at,
      }));
    } catch {
      return [];
    }
  },

  // --- CONTACTS ---
  async getContactsForUser(userId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .schema('mexo_contacts')
        .from('contacts')
        .select('*')
        .eq('owner_user_id', userId);

      if (error || !data) return [];

      return data.map((c: any) => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name || '',
        displayName: c.display_name,
        email: c.email,
        phone: c.phone || undefined,
        organization: c.organization || undefined,
        jobTitle: c.job_title || undefined,
        isFavorite: Boolean(c.favorite),
        isFrequent: false,
        createdAt: c.created_at,
      }));
    } catch {
      return [];
    }
  },

  // --- GROUPS ---
  async getGroupsForUser(userId: string): Promise<MexoGroup[]> {
    try {
      const { data, error } = await supabase
        .schema('mexo_groups')
        .from('group_members')
        .select(`
          role,
          joined_at,
          group:groups (
            id,
            name,
            slug,
            group_address,
            description,
            privacy,
            send_policy,
            member_visibility,
            owner_user_id,
            status,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error || !data) return [];

      return data.map((gm: any) => ({
        id: gm.group.id,
        name: gm.group.name,
        address: gm.group.group_address,
        description: gm.group.description || '',
        memberCount: 1,
        privacy: gm.group.privacy?.toLowerCase() || 'private',
        postingPermission: 'members',
        viewMembersPermission: 'members',
        members: [],
        createdAt: gm.group.created_at,
      }));
    } catch {
      return [];
    }
  },

  // --- LABELS ---
  async getLabelsForUser(userId: string): Promise<Label[]> {
    try {
      const { data, error } = await supabase
        .schema('mexo_mail')
        .from('labels')
        .select('*')
        .eq('owner_user_id', userId);

      if (error || !data) return [];

      return data.map((l: any) => ({
        id: l.id,
        name: l.name,
        color: l.color || '#0878e8',
        unreadCount: 0,
      }));
    } catch {
      return [];
    }
  },
};
