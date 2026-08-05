/**
 * useFaviconBadge
 * Dynamically draws an unread count badge over the browser tab favicon.
 * Uses canvas to composite the original favicon + a red pill with the count.
 */
import { useEffect, useRef } from 'react';

export function useFaviconBadge(unreadCount: number) {
  const originalHref = useRef<string>('/logo.png');

  useEffect(() => {
    const faviconEl = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!faviconEl) return;

    if (!originalHref.current || originalHref.current === '/logo.png') {
      originalHref.current = faviconEl.href || '/logo.png';
    }

    if (unreadCount === 0) {
      faviconEl.href = originalHref.current;
      document.title = document.title.replace(/^\(\d+\)\s/, '');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw base icon
      ctx.drawImage(img, 0, 0, 32, 32);

      // Badge size & position
      const badgeSize = unreadCount > 99 ? 18 : 14;
      const x = 32 - badgeSize;
      const y = 0;

      // Red circle background
      ctx.beginPath();
      ctx.arc(x + badgeSize / 2, y + badgeSize / 2, badgeSize / 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#e53e3e';
      ctx.fill();

      // White number text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${badgeSize > 14 ? 9 : 8}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = unreadCount > 99 ? '99+' : String(unreadCount);
      ctx.fillText(label, x + badgeSize / 2, y + badgeSize / 2 + 0.5);

      // Apply to favicon
      faviconEl.href = canvas.toDataURL('image/png');
    };

    img.onerror = () => {
      // Fallback: just draw a plain red circle
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, 2 * Math.PI);
      ctx.fillStyle = '#e53e3e';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(unreadCount > 99 ? '99+' : String(unreadCount), 16, 16);
      faviconEl.href = canvas.toDataURL('image/png');
    };

    img.src = originalHref.current;

    // Also update document title
    const titleWithoutBadge = document.title.replace(/^\(\d+\)\s/, '');
    document.title = `(${unreadCount > 99 ? '99+' : unreadCount}) ${titleWithoutBadge}`;
  }, [unreadCount]);
}
