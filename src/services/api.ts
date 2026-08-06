import { supabase } from './supabaseClient';
import { MexoUser, UserSession, SecurityEvent } from '../types/user';
import { Message, Label, Draft, UserSignature } from '../types/mail';
import { MexoGroup, GroupMember } from '../types/group';
import { Contact } from '../types/contact';
import { AuditLog, AdminMetrics } from '../types/admin';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export const api = {
  // --- AUTH & PROFILE ---
  async getCurrentUserProfile(userId: string): Promise<MexoUser | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) return null;

      return {
        id: profile.id,
        username: profile.username,
        email: profile.primary_address,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        avatarUrl: profile.avatar_url || undefined,
        role: profile.role || 'user',
        status: profile.status === 'suspended' ? 'suspended' : 'active',
        storageUsedBytes: Number(profile.storage_used_bytes || 0),
        storageLimitBytes: Number(profile.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
        createdAt: profile.created_at,
        lastActiveAt: profile.updated_at,
        twoFactorEnabled: false,
      };
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  },

  async getUserProfileByEmail(email: string): Promise<MexoUser | null> {
    try {
      const clean = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`primary_address.eq.${clean},username.eq.${clean.split('@')[0]}`)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        username: data.username,
        email: data.primary_address,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        avatarUrl: data.avatar_url || undefined,
        role: data.role || 'user',
        status: data.status === 'suspended' ? 'suspended' : 'active',
        storageUsedBytes: Number(data.storage_used_bytes || 0),
        storageLimitBytes: Number(data.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
        createdAt: data.created_at,
        lastActiveAt: data.updated_at,
        twoFactorEnabled: false,
      };
    } catch (err) {
      console.error('Error fetching user profile by email:', err);
      return null;
    }
  },

  async resolveUsernameToEmail(usernameOrEmail: string): Promise<string> {
    const clean = usernameOrEmail.trim().toLowerCase();
    if (clean.includes('@')) return clean;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_address')
        .eq('username', clean)
        .maybeSingle();

      if (profile?.primary_address) {
        return profile.primary_address;
      }
    } catch (err) {
      console.warn('Username resolution error:', err);
    }
    return `${clean}@mexo.com`;
  },

  async getAllUsers(): Promise<MexoUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        email: profile.primary_address,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        avatarUrl: profile.avatar_url || undefined,
        role: profile.role || 'user',
        status: profile.status === 'suspended' ? 'suspended' : 'active',
        storageUsedBytes: Number(profile.storage_used_bytes || 0),
        storageLimitBytes: Number(profile.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
        createdAt: profile.created_at,
        lastActiveAt: profile.updated_at,
        twoFactorEnabled: false,
      }));
    } catch (err) {
      console.error('Error fetching all users:', err);
      return [];
    }
  },

  async checkUsernameAvailable(username: string): Promise<{ available: boolean; reason?: string }> {
    const clean = username.toLowerCase().trim();
    if (!clean) return { available: false, reason: 'Username cannot be empty.' };
    if (clean.length < 3) return { available: false, reason: 'Minimum length is 3 characters.' };
    if (clean.length > 30) return { available: false, reason: 'Maximum length is 30 characters.' };

    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .maybeSingle();

      if (data) {
        return { available: false, reason: 'Already taken.' };
      }
      return { available: true };
    } catch {
      return { available: true };
    }
  },

  async createUserAccount(userData: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    recoveryEmail?: string;
    dob?: string;
    gender?: string;
    avatarUrl?: string;
    createdByAdmin?: boolean;
    role?: 'system_admin' | 'admin' | 'user';
  }): Promise<{ user: MexoUser | null; error: string | null }> {
    try {
      const cleanUsername = userData.username.toLowerCase().trim();
      const primaryEmail = `${cleanUsername}@mexo.com`;
      const pwd = userData.password || cleanUsername;

      // Use the SECURITY DEFINER database function which:
      // 1. Creates auth.users entry directly (no email confirmation required)
      // 2. Inserts the profile linked to that auth user
      // 3. Handles re-imports gracefully (upsert on existing users)
      const { data: rpcResult, error: rpcError } = await supabase.rpc('admin_create_user', {
        p_email:      primaryEmail,
        p_password:   pwd,
        p_first_name: userData.firstName,
        p_last_name:  userData.lastName,
        p_username:   cleanUsername,
        p_role:       userData.role || 'user',
      });

      if (rpcError) {
        console.error('admin_create_user RPC error:', rpcError);
        // Fallback: try client-side signUp path for compatibility
        return await this._createUserClientSide(userData);
      }

      const result = rpcResult as any;

      if (!result?.success) {
        const errMsg = result?.error || 'Failed to create user via database function.';
        console.warn('admin_create_user returned failure:', errMsg);
        // Fallback to client-side path
        return await this._createUserClientSide(userData);
      }

      const profile = result.profile;
      if (!profile) {
        return { user: null, error: 'No profile returned from create function.' };
      }

      const createdUser: MexoUser = {
        id: profile.id,
        username: profile.username,
        email: profile.primary_address,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        avatarUrl: profile.avatar_url || undefined,
        role: profile.role || 'user',
        status: profile.status || 'active',
        storageUsedBytes: Number(profile.storage_used_bytes || 0),
        storageLimitBytes: Number(profile.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
        createdAt: profile.created_at,
        lastActiveAt: profile.updated_at,
        twoFactorEnabled: false,
      };

      await this.addAuditLog('admin@mexo.com', 'ACCOUNT_CREATED', primaryEmail, 'success');
      return { user: createdUser, error: null };

    } catch (err: any) {
      console.error('createUserAccount failed:', err);
      return { user: null, error: err?.message || 'Failed to create user account.' };
    }
  },

  // Fallback: client-side user creation (used when RPC is unavailable)
  // IMPORTANT: saves & restores the current admin session so bulk imports
  // don't replace the admin's Supabase auth session with the newly-created user.
  async _createUserClientSide(userData: {
    firstName: string;
    lastName: string;
    username: string;
    password?: string;
    role?: string;
  }): Promise<{ user: MexoUser | null; error: string | null }> {
    try {
      const cleanUsername = userData.username.toLowerCase().trim();
      const primaryEmail = `${cleanUsername}@mexo.com`;
      const pwd = userData.password || cleanUsername;

      // Check if profile already exists in DB
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('primary_address', primaryEmail)
        .maybeSingle();

      if (existingProfile) {
        return {
          user: {
            id: existingProfile.id,
            username: existingProfile.username,
            email: existingProfile.primary_address,
            firstName: existingProfile.first_name || '',
            lastName: existingProfile.last_name || '',
            avatarUrl: existingProfile.avatar_url || undefined,
            role: existingProfile.role || 'user',
            status: 'active',
            storageUsedBytes: Number(existingProfile.storage_used_bytes || 0),
            storageLimitBytes: Number(existingProfile.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
            createdAt: existingProfile.created_at,
            lastActiveAt: existingProfile.updated_at,
            twoFactorEnabled: false,
          },
          error: null,
        };
      }

      // ── Save admin session BEFORE signUp hijacks it ──────────────────────
      const { data: currentSession } = await supabase.auth.getSession();
      const adminSession = currentSession?.session ?? null;
      // ─────────────────────────────────────────────────────────────────────

      const { data: authResult, error: authError } = await supabase.auth.signUp({
        email: primaryEmail,
        password: pwd,
        options: {
          data: { username: cleanUsername, first_name: userData.firstName, last_name: userData.lastName },
        },
      });

      let userId: string | undefined = authResult?.user?.id;
      if (!userId) {
        const { data: signInResult } = await supabase.auth.signInWithPassword({ email: primaryEmail, password: pwd });
        userId = signInResult?.user?.id;
      }

      // ── Restore admin session immediately after getting the new userId ───
      if (adminSession?.access_token && adminSession?.refresh_token) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }
      // ─────────────────────────────────────────────────────────────────────

      if (!userId) {
        return { user: null, error: authError?.message || 'Could not obtain Auth user ID.' };
      }

      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: cleanUsername,
          primary_address: primaryEmail,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role || 'user',
          status: 'active',
          storage_used_bytes: 0,
          storage_limit_bytes: 15 * 1024 * 1024 * 1024,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (profError || !profile) {
        return { user: null, error: profError?.message || 'Failed to create profile.' };
      }

      return {
        user: {
          id: profile.id,
          username: profile.username,
          email: profile.primary_address,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          avatarUrl: profile.avatar_url || undefined,
          role: profile.role || 'user',
          status: 'active',
          storageUsedBytes: Number(profile.storage_used_bytes || 0),
          storageLimitBytes: Number(profile.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
          createdAt: profile.created_at,
          lastActiveAt: profile.updated_at,
          twoFactorEnabled: false,
        },
        error: null,
      };
    } catch (err: any) {
      return { user: null, error: err?.message || 'Failed to create user account.' };
    }
  },


  async updateUserProfile(userId: string, updates: Partial<MexoUser>): Promise<MexoUser | null> {

    try {
      const dbUpdates: any = {};
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.storageUsedBytes !== undefined) dbUpdates.storage_used_bytes = updates.storageUsedBytes;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) return null;
      return this.getCurrentUserProfile(userId);
    } catch {
      return null;
    }
  },

  async deleteUserAccount(userId: string, email: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) return false;
      await this.addAuditLog('admin@mexo.com', 'ACCOUNT_DELETED', email, 'warning');
      return true;
    } catch {
      return false;
    }
  },

  // --- MAIL & MESSAGES ---
  async getMessagesForUser(userId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('message_states')
        .select(`
          id,
          message_id,
          folder,
          is_read,
          is_archived,
          is_deleted,
          is_spam,
          is_important,
          starred,
          labels,
          updated_at,
          messages!inner (
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
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error || !data) return [];

      return data.map((item: any) => {
        const msg = item.messages;
        return {
          id: item.id,
          threadId: msg.thread_id,
          senderName: msg.sender_address.split('@')[0],
          senderEmail: msg.sender_address,
          recipients: [],
          subject: msg.subject || '(no subject)',
          bodyHtml: msg.body_html || '',
          snippet: msg.body_text?.substring(0, 100) || '',
          createdAt: msg.created_at || msg.sent_at,
          attachments: [],
          userState: {
            recipientEmail: msg.sender_address,
            isRead: item.is_read,
            isStarred: Boolean(item.starred),
            isArchived: item.is_archived,
            isDeleted: item.is_deleted,
            isSpam: item.is_spam,
            isImportant: item.is_important,
            labels: item.labels || [],
          },
        };
      });
    } catch (err) {
      console.error('Error getting messages:', err);
      return [];
    }
  },

  async sendMessage(params: {
    senderUserId: string;
    senderEmail: string;
    senderName: string;
    recipients: string[];
    subject: string;
    bodyHtml: string;
    attachments?: any[];
    clientMessageId?: string;
  }): Promise<boolean> {
    try {
      const cleanSender = params.senderEmail.trim().toLowerCase();
      const bodyText = params.bodyHtml.replace(/<[^>]*>?/gm, '');

      // 1. Insert master message
      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .insert({
          sender_user_id: params.senderUserId,
          sender_address: cleanSender,
          subject: params.subject || '(no subject)',
          body_html: params.bodyHtml,
          body_text: bodyText,
          status: 'sent',
        })
        .select()
        .single();

      if (msgErr || !msgData) {
        console.error('Error inserting message:', msgErr);
        return false;
      }

      // 2. Insert message state for sender (sent folder)
      await supabase.from('message_states').insert({
        message_id: msgData.id,
        user_id: params.senderUserId,
        folder: 'sent',
        is_read: true,
      });

      // 3. Resolve recipients & create inbox states for recipients
      for (const recip of params.recipients) {
        const recipEmail = await this.resolveUsernameToEmail(recip);
        if (recipEmail !== cleanSender) {
          const { data: recipProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('primary_address', recipEmail)
            .maybeSingle();

          if (recipProfile?.id) {
            await supabase.from('message_recipients').insert({
              message_id: msgData.id,
              recipient_user_id: recipProfile.id,
              recipient_address: recipEmail,
              recipient_type: 'to',
            });

            await supabase.from('message_states').insert({
              message_id: msgData.id,
              user_id: recipProfile.id,
              folder: 'inbox',
              is_read: false,
            });
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  },

  async updateMessageState(stateId: string, updates: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_states')
        .update(updates)
        .eq('id', stateId);
      return !error;
    } catch {
      return false;
    }
  },

  async deleteMessageState(stateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('message_states')
        .delete()
        .eq('id', stateId);
      return !error;
    } catch {
      return false;
    }
  },

  // --- DRAFTS ---
  async getDraftsForUser(userId: string): Promise<Draft[]> {
    try {
      const { data, error } = await supabase
        .from('drafts')
        .select('*')
        .eq('owner_user_id', userId);

      if (error || !data) return [];

      return data.map((d: any) => ({
        id: d.id,
        to: d.to_recipients || [],
        cc: d.cc_recipients || [],
        bcc: d.bcc_recipients || [],
        subject: d.subject || '',
        bodyHtml: d.body_html || '',
        attachments: [],
        lastSavedAt: d.last_saved_at,
      }));
    } catch {
      return [];
    }
  },

  async saveDraft(userId: string, draft: Partial<Draft>): Promise<Draft | null> {
    try {
      const draftData = {
        owner_user_id: userId,
        to_recipients: draft.to || [],
        cc_recipients: draft.cc || [],
        bcc_recipients: draft.bcc || [],
        subject: draft.subject || '',
        body_html: draft.bodyHtml || '',
        last_saved_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('drafts')
        .upsert(draftData)
        .select()
        .single();

      if (error || !data) return null;
      return {
        id: data.id,
        to: data.to_recipients || [],
        cc: data.cc_recipients || [],
        bcc: data.bcc_recipients || [],
        subject: data.subject || '',
        bodyHtml: data.body_html || '',
        attachments: [],
        lastSavedAt: data.last_saved_at,
      };
    } catch {
      return null;
    }
  },

  async deleteDraft(draftId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('drafts').delete().eq('id', draftId);
      return !error;
    } catch {
      return false;
    }
  },

  // --- CONTACTS ---
  async getContactsForUser(userId: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('owner_user_id', userId)
        .order('display_name', { ascending: true });

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

  async createContact(userId: string, contactData: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact | null> {
    try {
      const payload = {
        owner_user_id: userId,
        first_name: contactData.firstName,
        last_name: contactData.lastName || '',
        display_name: contactData.displayName || `${contactData.firstName} ${contactData.lastName || ''}`.trim(),
        email: contactData.email,
        phone: contactData.phone || null,
        organization: contactData.organization || null,
        job_title: contactData.jobTitle || null,
        favorite: contactData.isFavorite || false,
      };

      const { data, error } = await supabase.from('contacts').insert(payload).select().single();
      if (error || !data) return null;

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name || '',
        displayName: data.display_name,
        email: data.email,
        phone: data.phone || undefined,
        organization: data.organization || undefined,
        jobTitle: data.job_title || undefined,
        isFavorite: Boolean(data.favorite),
        isFrequent: false,
        createdAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  async deleteContact(contactId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', contactId);
      return !error;
    } catch {
      return false;
    }
  },

  // --- GROUPS ---
  async getGroupsForUser(userId: string): Promise<MexoGroup[]> {
    try {
      const { data, error } = await supabase.from('groups').select('*');
      if (error || !data) return [];

      return data.map((g: any) => ({
        id: g.id,
        name: g.name,
        address: g.group_address,
        description: g.description || '',
        memberCount: 1,
        privacy: g.privacy?.toLowerCase() || 'private',
        postingPermission: 'members',
        viewMembersPermission: 'members',
        members: [],
        createdAt: g.created_at,
      }));
    } catch {
      return [];
    }
  },

  // --- LABELS ---
  async getLabelsForUser(userId: string): Promise<Label[]> {
    try {
      const { data, error } = await supabase
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

  async createLabel(userId: string, name: string, color: string): Promise<Label | null> {
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({ owner_user_id: userId, name, color })
        .select()
        .single();

      if (error || !data) return null;
      return { id: data.id, name: data.name, color: data.color, unreadCount: 0 };
    } catch {
      return null;
    }
  },

  // --- AUDIT LOGS & ADMIN METRICS ---
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error || !data) return [];

      return data.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        actorEmail: log.actor_email,
        action: log.action,
        target: log.target || '',
        result: log.result || 'success',
        ipAddress: log.ip_address || '127.0.0.1',
      }));
    } catch {
      return [];
    }
  },

  async addAuditLog(actorEmail: string, action: string, target: string, result: 'success' | 'failed' | 'warning' = 'success'): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        actor_email: actorEmail,
        action,
        target,
        result,
        ip_address: '127.0.0.1',
      });
    } catch (err) {
      console.warn('Failed to add audit log:', err);
    }
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      const { count: totalGroups } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true });

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        messagesToday: totalMessages || 0,
        messagesThisMonth: (totalMessages || 0) * 4,
        totalGroups: totalGroups || 0,
        storageUsedBytes: 0,
        storageTotalBytes: 500 * 1024 * 1024 * 1024,
        failedDeliveries: 0,
        spamReports: 0,
        securityAlerts: 0,
      };
    } catch {
      return {
        totalUsers: 0,
        activeUsers: 0,
        messagesToday: 0,
        messagesThisMonth: 0,
        totalGroups: 0,
        storageUsedBytes: 0,
        storageTotalBytes: 500 * 1024 * 1024 * 1024,
        failedDeliveries: 0,
        spamReports: 0,
        securityAlerts: 0,
      };
    }
  },
};
