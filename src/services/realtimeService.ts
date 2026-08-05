/**
 * MEXO Mail Real-Time Sync Service
 *
 * Since this app uses localStorage (no WebSocket backend), we use:
 *  1. BroadcastChannel API — instant cross-tab communication (fast, 0ms latency)
 *  2. window.storage event — cross-tab localStorage change detection
 *  3. setInterval polling (1.5s) — same-tab fallback & message count watcher
 *
 * All three work together to give a "WebSocket-like" experience.
 */

export type RealtimeEvent =
  | { type: 'NEW_MESSAGE'; messageId: string; senderName: string; subject: string; recipientEmail: string }
  | { type: 'MESSAGE_STATE_UPDATED'; messageId: string }
  | { type: 'MESSAGES_REFRESHED' };

type RealtimeListener = (event: RealtimeEvent) => void;

const CHANNEL_NAME = 'mexo-mail-sync';
const STORAGE_KEYS_MESSAGES = 'mexo_messages_v1';

class RealtimeService {
  private channel: BroadcastChannel | null = null;
  private listeners: RealtimeListener[] = [];
  private lastMessageCount = 0;
  private lastMessageIds = new Set<string>();
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private currentUserEmail = '';

  /** Call once on app mount with the logged-in user's email */
  connect(userEmail: string) {
    this.currentUserEmail = userEmail.toLowerCase();

    // Snapshot current message IDs to track new arrivals
    this.snapshotMessages();

    // 1. BroadcastChannel: zero-latency cross-tab sync
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e) => {
          const event = e.data as RealtimeEvent;
          if (event.type === 'NEW_MESSAGE' && event.recipientEmail === this.currentUserEmail) {
            this.emit(event);
          } else if (event.type === 'MESSAGES_REFRESHED') {
            this.emit(event);
          }
        };
      } catch {
        // BroadcastChannel not supported — silently fall back
      }
    }

    // 2. storage event: detects localStorage writes from other tabs
    window.addEventListener('storage', this.handleStorageEvent);

    // 3. Interval polling (1.5s): catches same-tab sends & any missed events
    this.pollInterval = setInterval(this.pollMessages, 1500);
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    window.removeEventListener('storage', this.handleStorageEvent);
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners = [];
  }

  /** Broadcast that a new message was sent (called by sendMessage flows) */
  broadcastNewMessage(event: Extract<RealtimeEvent, { type: 'NEW_MESSAGE' }>) {
    this.channel?.postMessage(event);
  }

  broadcastRefresh() {
    this.channel?.postMessage({ type: 'MESSAGES_REFRESHED' } as RealtimeEvent);
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

  private snapshotMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_MESSAGES);
      const msgs: Array<{ id: string; userState: { recipientEmail: string } }> = raw ? JSON.parse(raw) : [];
      const mine = msgs.filter((m) => m.userState.recipientEmail?.toLowerCase() === this.currentUserEmail);
      this.lastMessageCount = mine.length;
      this.lastMessageIds = new Set(mine.map((m) => m.id));
    } catch {
      // ignore parse errors
    }
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS_MESSAGES) {
      this.checkForNewMessages();
    }
  };

  private pollMessages = () => {
    this.checkForNewMessages();
  };

  private checkForNewMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS_MESSAGES);
      if (!raw) return;
      const msgs: Array<{
        id: string;
        senderName: string;
        subject: string;
        userState: { recipientEmail: string; isDeleted: boolean };
      }> = JSON.parse(raw);

      const mine = msgs.filter(
        (m) =>
          m.userState.recipientEmail?.toLowerCase() === this.currentUserEmail && !m.userState.isDeleted
      );

      const newIds = mine.filter((m) => !this.lastMessageIds.has(m.id));

      if (newIds.length > 0) {
        // Update snapshot
        this.snapshotMessages();

        newIds.forEach((m) => {
          this.emit({
            type: 'NEW_MESSAGE',
            messageId: m.id,
            senderName: m.senderName || 'Unknown',
            subject: m.subject || '(no subject)',
            recipientEmail: this.currentUserEmail,
          });
        });
      } else if (mine.length !== this.lastMessageCount) {
        // Message count changed (deletion / state update)
        this.snapshotMessages();
        this.emit({ type: 'MESSAGES_REFRESHED' });
      }
    } catch {
      // ignore parse errors
    }
  }
}

export const realtimeService = new RealtimeService();
