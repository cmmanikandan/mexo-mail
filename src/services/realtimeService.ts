/**
 * MEXO Mail Real-Time Sync Service
 *
 * Direct Supabase Postgres Changes Realtime Subscriptions
 * Subscribes to message_states inserts for the authenticated recipient user.
 */
import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEvent =
  | { type: 'NEW_MESSAGE'; messageId: string; senderName: string; subject: string; recipientEmail: string }
  | { type: 'MESSAGE_STATE_UPDATED'; messageId: string }
  | { type: 'MESSAGES_REFRESHED' };

type RealtimeListener = (event: RealtimeEvent) => void;

const CHANNEL_NAME = 'mexo-mail-sync';

class RealtimeService {
  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private listeners: RealtimeListener[] = [];
  private currentUserId = '';
  private currentUserEmail = '';

  /** Call once on app mount with the logged-in user's credentials */
  connect(userEmail: string, userId?: string) {
    this.currentUserEmail = userEmail.toLowerCase().trim();
    this.currentUserId = userId || '';

    // 1. BroadcastChannel: zero-latency cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        if (this.broadcastChannel) this.broadcastChannel.close();
        this.broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
        this.broadcastChannel.onmessage = (e) => {
          const event = e.data as RealtimeEvent;
          if (event.type === 'NEW_MESSAGE' && event.recipientEmail === this.currentUserEmail) {
            this.emit(event);
          } else if (event.type === 'MESSAGES_REFRESHED') {
            this.emit(event);
          }
        };
      } catch {
        // BroadcastChannel fallback
      }
    }

    // 2. Supabase Realtime Channel for database-backed postgres_changes
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
    }

    if (this.currentUserId && this.currentUserId !== 'guest-user') {
      this.supabaseChannel = supabase
        .channel(`user-mailbox-${this.currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_states',
            filter: `user_id=eq.${this.currentUserId}`,
          },
          async (payload: any) => {
            if (payload?.new?.folder === 'inbox') {
              const msgId = payload.new.message_id;

              // Fetch message details for toast notification
              const { data: msg } = await supabase
                .from('messages')
                .select('sender_address, subject')
                .eq('id', msgId)
                .maybeSingle();

              const senderAddress = msg?.sender_address || 'Unknown';
              const subject = msg?.subject || '(No Subject)';

              this.emit({
                type: 'NEW_MESSAGE',
                messageId: msgId,
                senderName: senderAddress.split('@')[0],
                subject,
                recipientEmail: this.currentUserEmail,
              });
            }
          }
        )
        .subscribe();
    }
  }

  disconnect() {
    this.broadcastChannel?.close();
    this.broadcastChannel = null;
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
    this.listeners = [];
  }

  /** Broadcast that a new message was sent (called by sendMessage flows to notify recipient) */
  broadcastNewMessage(event: Extract<RealtimeEvent, { type: 'NEW_MESSAGE' }>) {
    this.broadcastChannel?.postMessage(event);
  }

  broadcastRefresh() {
    this.broadcastChannel?.postMessage({ type: 'MESSAGES_REFRESHED' } as RealtimeEvent);
  }

  subscribe(listener: RealtimeListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: RealtimeEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

export const realtimeService = new RealtimeService();
