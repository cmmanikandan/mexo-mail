import { useEffect, useCallback, useRef } from 'react';
import { realtimeService, RealtimeEvent } from '../services/realtimeService';
import { useMailStore } from '../store/mailStore';
import { useAuthStore } from '../store/authStore';
import { useMailToastStore } from '../store/mailToastStore';

/**
 * useRealtime - connects the RealtimeService to Zustand store on mount.
 *
 * - Subscribes to NEW_MESSAGE events → triggers mail store refresh + toast
 * - Subscribes to MESSAGES_REFRESHED events → refreshes mail list silently
 * - Disconnects on unmount
 */
export function useRealtime() {
  const { currentUser } = useAuthStore();
  const { triggerRefresh } = useMailStore();
  const { showToast } = useMailToastStore();

  const userEmail = currentUser?.email || '';

  // Keep stable callback references
  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      if (event.type === 'NEW_MESSAGE') {
        // 1. Refresh the mail list reactively
        triggerRefresh();

        // 2. Show in-app toast notification
        showToast({
          id: event.messageId,
          senderName: event.senderName,
          subject: event.subject,
        });
      } else if (event.type === 'MESSAGES_REFRESHED') {
        triggerRefresh();
      }
    },
    [triggerRefresh, showToast]
  );

  useEffect(() => {
    if (!userEmail) return;

    realtimeService.connect(userEmail);
    const unsubscribe = realtimeService.subscribe(handleEvent);

    return () => {
      unsubscribe();
      realtimeService.disconnect();
    };
  }, [userEmail, handleEvent]);
}
