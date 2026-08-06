import React, { useEffect, useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { ComposeContainer } from '../compose/ComposeModal';
import { MexoToastContainer } from '../common/MexoToast';

import { ContactFormModal } from '../contacts/ContactFormModal';
import { AdvancedSearchModal } from '../mail/AdvancedSearchModal';
import { KeyboardShortcutsModal } from '../mail/KeyboardShortcutsModal';
import { ChangePasswordSuggestionModal } from '../auth/ChangePasswordSuggestionModal';
import { InstallAppSuggestionModal } from '../common/InstallAppSuggestionModal';
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
  const { currentUser, isDefaultPasswordUser } = useAuthStore();
  const userEmail = currentUser?.email || 'manikandanprabhu1221@mexo.com';

  // Pop-up Suggestion Modals state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isInstallAppModalOpen, setIsInstallAppModalOpen] = useState(false);

  // Trigger Change Password modal if user logged in with default password (password == username)
  useEffect(() => {
    if (isDefaultPasswordUser) {
      const timer = setTimeout(() => setIsChangePasswordModalOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isDefaultPasswordUser]);

  // Trigger Install App suggestion modal if not dismissed for current session
  useEffect(() => {
    if (!isDefaultPasswordUser && !isChangePasswordModalOpen) {
      const dismissed = sessionStorage.getItem('mexo_pwa_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setIsInstallAppModalOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [isDefaultPasswordUser, isChangePasswordModalOpen]);

  // 🔔 Tab Favicon badge with unread count
  const unreadCount = React.useMemo(() => {
    if (!userEmail) return 0;
    const msgs = db.getMessagesForUser(userEmail);
    const now = Date.now();
    return msgs.filter((m) => {
      const st = m.userState;
      const isSnoozed = st.snoozedUntil ? new Date(st.snoozedUntil).getTime() > now : false;
      return !st.isRead && !st.isArchived && !st.isDeleted && !st.isSpam && !isSnoozed;
    }).length;
  }, [userEmail, lastUpdated]);

  useFaviconBadge(unreadCount);

  // ⚡ Real-time mail sync (BroadcastChannel + storage events + polling)
  useRealtime();

  // 📄 Dynamic page title (Gmail-style: "Inbox (3) – MEXO Mail")
  usePageTitle();

  // Register Global Keyboard Shortcuts (C = Compose, / = Search, ? = Shortcuts)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
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
    <div className="h-screen max-h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <AppHeader />
      
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col pb-mobile-nav md:pb-0">
          {children}
        </main>
      </div>

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

      {/* Suggestion Pop-up Modals */}
      <ChangePasswordSuggestionModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
      <InstallAppSuggestionModal
        isOpen={isInstallAppModalOpen}
        onClose={() => {
          sessionStorage.setItem('mexo_pwa_prompt_dismissed', 'true');
          setIsInstallAppModalOpen(false);
        }}
      />
    </div>
  );
};
