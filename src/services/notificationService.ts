/**
 * Browser Push Notification Service for MEXO Mail
 * Requests permission and shows desktop notifications for new mail.
 */

class MexoNotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return 'granted';
    }
    if (Notification.permission !== 'denied') {
      this.permission = await Notification.requestPermission();
    }
    return this.permission;
  }

  isGranted(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  showNewMailNotification(senderName: string, subject: string, preview?: string) {
    if (!this.isGranted()) return;
    try {
      const n = new Notification(`New mail from ${senderName}`, {
        body: subject + (preview ? `\n${preview}` : ''),
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `mexo-mail-${Date.now()}`,
        silent: false,
      });
      // Auto-close after 6 seconds
      setTimeout(() => n.close(), 6000);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // Silently ignore notification errors
    }
  }
}

export const notificationService = new MexoNotificationService();
