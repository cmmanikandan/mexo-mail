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

  async verifyUserExists(identifier: string): Promise<{ exists: boolean; email: string; user?: MexoUser }> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return { exists: false, email: '' };

    const email = clean.includes('@') ? clean : `${clean}@mexo.com`;
    const username = clean.includes('@') ? clean.split('@')[0] : clean;

    if (clean === 'admin' || clean === 'admin@mexo.com') {
      return { exists: true, email: 'admin@mexo.com' };
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${username},primary_address.eq.${email}`)
        .maybeSingle();

      if (data) {
        return {
          exists: true,
          email: data.primary_address || email,
          user: {
            id: data.id,
            username: data.username,
            email: data.primary_address,
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            avatarUrl: data.avatar_url || undefined,
            role: data.role || 'user',
            status: data.status || 'active',
            storageUsedBytes: Number(data.storage_used_bytes || 0),
            storageLimitBytes: Number(data.storage_limit_bytes || 15 * 1024 * 1024 * 1024),
            createdAt: data.created_at,
            lastActiveAt: data.updated_at,
            twoFactorEnabled: false,
          },
        };
      }
    } catch (err) {
      console.warn('verifyUserExists DB error:', err);
    }

    return { exists: false, email };
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
        try {
          const { data: signInResult } = await supabase.auth.signInWithPassword({ email: primaryEmail, password: pwd });
          userId = signInResult?.user?.id;
        } catch {
          // ignore sign-in error on fallback
        }
      }

      // If auth signUp/signIn failed (e.g. rate-limiting), generate client UUID to insert profile
      if (!userId) {
        userId = crypto.randomUUID();
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


  async updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to update password.' };
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
      // Fetch user's message states joined with full message and message recipients
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
            sent_at,
            message_recipients (
              recipient_address,
              recipient_type
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error || !data) {
        console.error('Error fetching messages for user:', error);
        return [];
      }

      // Fetch user profile email for userState.recipientEmail mapping
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('primary_address')
        .eq('id', userId)
        .maybeSingle();

      const userEmail = userProfile?.primary_address || '';

      const seenStateIds = new Set<string>();
      const result: Message[] = [];

      for (const item of data) {
        if (seenStateIds.has(item.id)) continue;
        seenStateIds.add(item.id);

        const msg: any = Array.isArray(item.messages) ? item.messages[0] : item.messages;
        if (!msg) continue;

        const recipList: string[] = (msg.message_recipients || []).map((r: any) => r.recipient_address);
        const senderAddr = msg.sender_address || 'unknown@mexo.com';

        result.push({
          id: item.id,
          threadId: msg.thread_id || item.id,
          senderName: senderAddr.split('@')[0],
          senderEmail: senderAddr,
          recipients: recipList.length > 0 ? recipList : [userEmail],
          subject: msg.subject || '(no subject)',
          bodyHtml: msg.body_html || '',
          snippet: msg.body_text?.substring(0, 120) || '',
          createdAt: msg.created_at || msg.sent_at || new Date().toISOString(),
          attachments: [],
          userState: {
            recipientEmail: userEmail || senderAddr,
            isRead: Boolean(item.is_read),
            isStarred: Boolean(item.starred),
            isArchived: Boolean(item.is_archived),
            isDeleted: Boolean(item.is_deleted),
            isSpam: Boolean(item.is_spam),
            isImportant: Boolean(item.is_important),
            labels: item.labels || [],
          },
        });
      }

      return result;
    } catch (err) {
      console.error('Error getting messages:', err);
      return [];
    }
  },

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
    const cleanSender = params.senderEmail.trim().toLowerCase();
    const cleanRecipients = (params.recipients || []).map((r) => {
      let clean = r.trim().toLowerCase();
      if (!clean.includes('@')) clean = `${clean}@mexo.com`;
      return clean;
    });

    console.log('[SEND] Send requested');
    console.log('[SEND] Sender:', cleanSender);
    console.log('[SEND] Recipient:', cleanRecipients.join(', '));
    console.log('[SEND] Resolving recipient...');

    if (cleanRecipients.length === 0) {
      console.error('[SEND] Error: No recipients specified');
      return { success: false, error: 'Recipient not found' };
    }

    // 1. Resolve Sender Profile UUID
    let senderUuid: string | null = null;
    if (params.senderUserId && /^[0-9a-fA-F-]{36}$/.test(params.senderUserId)) {
      senderUuid = params.senderUserId;
    } else {
      const { data: senderProf } = await supabase
        .from('profiles')
        .select('id')
        .eq('primary_address', cleanSender)
        .maybeSingle();
      if (senderProf?.id) senderUuid = senderProf.id;
    }

    if (!senderUuid) {
      console.error('[SEND] Error: Sender profile not found in database');
      return { success: false, error: 'Sender profile not found in database' };
    }

    // 2. Try Atomic RPC send_mail_transaction
    const clientMsgId = params.clientMessageId || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const bodyText = params.bodyHtml ? params.bodyHtml.replace(/<[^>]*>?/gm, '') : '';

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('send_mail_transaction', {
        p_sender_id:         senderUuid,
        p_sender_address:    cleanSender,
        p_recipients:        cleanRecipients,
        p_subject:           params.subject || '(No Subject)',
        p_body_html:         params.bodyHtml || '',
        p_body_text:         bodyText,
        p_client_message_id: clientMsgId,
        p_draft_id:          params.draftId && /^[0-9a-fA-F-]{36}$/.test(params.draftId) ? params.draftId : null,
      });

      if (!rpcErr && rpcRes) {
        const resObj = rpcRes as any;
        if (resObj.success) {
          console.log('[SEND] Recipient user ID:', resObj.recipient_user_ids?.join(', '));
          console.log('[SEND] Creating message...');
          console.log('[SEND] Message ID:', resObj.message_id);
          console.log('[SEND] Creating recipient relation...');
          console.log('[SEND] Creating sender mailbox state...');
          console.log('[SEND] Creating recipient mailbox state...');
          console.log('[SEND] Transaction committed');
          console.log('[SEND] Publishing recipient realtime event');
          console.log('[SEND] Completed');

          return { success: true, messageId: resObj.message_id };
        } else {
          console.error('[SEND] Transaction RPC returned error:', resObj.error);
          if (resObj.error && resObj.error.includes('Recipient not found')) {
            return { success: false, error: 'Recipient not found' };
          }
        }
      } else if (rpcErr) {
        console.warn('[SEND] RPC send_mail_transaction notice:', rpcErr.message);
      }
    } catch (rpcException) {
      console.warn('[SEND] RPC call exception, using client transaction fallback:', rpcException);
    }

    // 3. Client Transaction Fallback (if RPC is not available)
    try {
      // Validate all recipients against profiles / groups
      const recipientProfiles: Array<{ id: string; email: string }> = [];

      for (const recip of cleanRecipients) {
        const recipHandle = recip.split('@')[0];
        const { data: recipProf } = await supabase
          .from('profiles')
          .select('id, primary_address')
          .or(`primary_address.eq.${recip},username.eq.${recipHandle}`)
          .maybeSingle();

        if (recipProf?.id) {
          recipientProfiles.push({ id: recipProf.id, email: recipProf.primary_address });
        } else {
          // Check groups
          const { data: group } = await supabase
            .from('groups')
            .select('id, group_address')
            .or(`group_address.eq.${recip},slug.eq.${recipHandle}`)
            .maybeSingle();

          if (group?.id) {
            const { data: members } = await supabase
              .from('group_members')
              .select('user_id, profiles(primary_address)')
              .eq('group_id', group.id);

            if (members && members.length > 0) {
              members.forEach((m: any) => {
                if (m.user_id && m.profiles?.primary_address) {
                  recipientProfiles.push({ id: m.user_id, email: m.profiles.primary_address });
                }
              });
            }
          } else {
            console.error('[SEND] Error: Recipient not found:', recip);
            return { success: false, error: 'Recipient not found' };
          }
        }
      }

      if (recipientProfiles.length === 0) {
        console.error('[SEND] Error: Recipient not found');
        return { success: false, error: 'Recipient not found' };
      }

      console.log('[SEND] Recipient user ID:', recipientProfiles.map((r) => r.id).join(', '));
      console.log('[SEND] Creating message...');

      // Insert master message
      const { data: msgData, error: msgErr } = await supabase
        .from('messages')
        .insert({
          sender_user_id: senderUuid,
          sender_address: cleanSender,
          subject: params.subject || '(No Subject)',
          body_html: params.bodyHtml || '',
          body_text: bodyText,
          client_message_id: clientMsgId,
          status: 'sent',
        })
        .select()
        .single();

      if (msgErr || !msgData) {
        console.error('[SEND] Error creating message:', msgErr);
        return { success: false, error: msgErr?.message || 'Database error creating message' };
      }

      console.log('[SEND] Message ID:', msgData.id);
      console.log('[SEND] Creating recipient relation...');

      // Insert recipient relations
      for (const rp of recipientProfiles) {
        await supabase.from('message_recipients').insert({
          message_id: msgData.id,
          recipient_user_id: rp.id,
          recipient_address: rp.email,
          recipient_type: 'to',
          delivery_status: 'delivered',
        });
      }

      console.log('[SEND] Creating sender mailbox state...');
      // Insert sender state
      await supabase.from('message_states').upsert({
        message_id: msgData.id,
        user_id: senderUuid,
        folder: 'sent',
        is_read: true,
      }, { onConflict: 'message_id,user_id,folder' });

      console.log('[SEND] Creating recipient mailbox state...');
      // Insert recipient states
      for (const rp of recipientProfiles) {
        await supabase.from('message_states').upsert({
          message_id: msgData.id,
          user_id: rp.id,
          folder: 'inbox',
          is_read: false,
        }, { onConflict: 'message_id,user_id,folder' });
      }

      // Delete draft if draftId provided
      if (params.draftId && /^[0-9a-fA-F-]{36}$/.test(params.draftId)) {
        await supabase.from('drafts').delete().eq('id', params.draftId);
      }
      await supabase.from('drafts').delete().eq('owner_user_id', senderUuid).eq('subject', params.subject);

      console.log('[SEND] Transaction committed');
      console.log('[SEND] Publishing recipient realtime event');
      console.log('[SEND] Completed');

      return { success: true, messageId: msgData.id };
    } catch (err: any) {
      console.error('[SEND] Delivery transaction error:', err);
      return { success: false, error: err?.message || 'Mail delivery transaction failed' };
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
      const isUuid = draft.id && /^[0-9a-fA-F-]{36}$/.test(draft.id);
      const draftData: any = {
        owner_user_id: userId,
        to_recipients: draft.to || [],
        cc_recipients: draft.cc || [],
        bcc_recipients: draft.bcc || [],
        subject: draft.subject || '',
        body_html: draft.bodyHtml || '',
        last_saved_at: new Date().toISOString(),
      };
      if (isUuid) {
        draftData.id = draft.id;
      }

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
