import React, { useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ComposeContainer } from '../compose/ComposeModal';
import { MexoToastContainer } from '../common/MexoToast';

import { ContactFormModal } from '../contacts/ContactFormModal';
import { AdvancedSearchModal } from '../mail/AdvancedSearchModal';
import { KeyboardShortcutsModal } from '../mail/KeyboardShortcutsModal';
import { useUIStore } from '../../store/uiStore';
import { useMailStore } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { useRealtime } from '../../hooks/useRealtime';
import { usePageTitle } from '../../hooks/usePageTitle';
import { MailNotificationToast } from '../mail/MailNotificationToast';

import { MobileComposeFAB } from '../common/MobileComposeFAB';
import { MobileBottomNav } from './MobileBottomNav';
import { useFaviconBadge } from '../../hooks/useFaviconBadge';
import { db } from '../../services/db';
import { useAuthStore } from '../../store/authStore';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isCreateGroupOpen, setCreateGroupOpen, isCreateContactOpen, setCreateContactOpen, isAdvancedSearchOpen, setAdvancedSearchOpen, isKeyboardShortcutsOpen, setKeyboardShortcutsOpen } = useUIStore();
  const { openCompose } = useComposeStore();
  const { currentFolder, setCurrentFolder, lastUpdated } = useMailStore();
  const { currentUser } = useAuthStore();

  // 🔔 Tab Favicon badge with unread count
  const unreadCount = React.useMemo(() => {
    if (!currentUser.email) return 0;
    const msgs = db.getMessagesForUser(currentUser.email);
    const now = Date.now();
    return msgs.filter((m) => {
      const st = m.userState;
      const isSnoozed = st.snoozedUntil ? new Date(st.snoozedUntil).getTime() > now : false;
      return !st.isRead && !st.isArchived && !st.isDeleted && !st.isSpam && !isSnoozed;
    }).length;
  }, [currentUser.email, lastUpdated]);

  useFaviconBadge(unreadCount);

  // ⚡ Real-time mail sync (BroadcastChannel + storage events + polling)
  useRealtime();

  // 📄 Dynamic page title (Gmail-style: "Inbox (3) – MEXO Mail")
  usePageTitle();

  // Register Global Keyboard Shortcuts (C = Compose, / = Search, ? = Shortcuts)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ignore if Control, Meta/Cmd, or Alt modifier is held (e.g. Ctrl+C to copy text)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Don't trigger if user is typing inside an input, textarea, select, or editable element
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(targetTag) || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openCompose();
      } else if (e.key === '/') {
        e.preventDefault();
        setAdvancedSearchOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [openCompose, setAdvancedSearchOpen, setKeyboardShortcutsOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <AppHeader />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col">
          {children}
        </main>
      </div>

      {/* Mobile Floating Compose Button */}
      <MobileComposeFAB />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Compose Windows */}
      <ComposeContainer />

      {/* Toast Notifications */}
      <MexoToastContainer />

      {/* Real-Time Mail Notification Toasts */}
      <MailNotificationToast />

      {/* Shared Dialog Modals */}
      <ContactFormModal isOpen={isCreateContactOpen} onClose={() => setCreateContactOpen(false)} />
      <AdvancedSearchModal isOpen={isAdvancedSearchOpen} onClose={() => setAdvancedSearchOpen(false)} />
      <KeyboardShortcutsModal isOpen={isKeyboardShortcutsOpen} onClose={() => setKeyboardShortcutsOpen(false)} />
    </div>
  );
};
