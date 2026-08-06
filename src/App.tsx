import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { MailFolderPage, ThreadDetailPage } from './pages/mail/MailFolderPages';
import { GroupsPage } from './pages/groups/GroupsPage';
import { GroupDetailPage } from './pages/groups/GroupDetailPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AccountPage } from './pages/account/AccountPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminStoragePage } from './pages/admin/AdminStoragePage';
import { AdminMailPoliciesPage } from './pages/admin/AdminMailPoliciesPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { LandingPage } from './pages/landing/LandingPage';
import { HelpPage } from './pages/support/HelpPage';
import { PrivacyPage } from './pages/support/PrivacyPage';
import { TermsPage } from './pages/support/TermsPage';
import { useAuthStore } from './store/authStore';
import { db } from './services/db';
import { SplashScreen } from './components/common/SplashScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || currentUser.role !== 'system_admin') {
    return <Navigate to="/mail/inbox" replace />;
  }
  return <>{children}</>;
};

/** Sets the browser tab title for non-mail pages based on the route. */
const RoutePageTitle: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const APP = 'MEXO Mail';

    const titleMap: Record<string, string> = {
      '/': `MEXO Mail – Simple & Intelligent Email`,
      '/signin': `Sign In – ${APP}`,
      '/signup': `Create Account – ${APP}`,
      '/forgot-password': `Reset Password – ${APP}`,
      '/contacts': `Contacts – ${APP}`,
      '/settings': `Settings – ${APP}`,
      '/account': `Account – ${APP}`,
      '/help': `Help Center – ${APP}`,
      '/privacy': `Privacy Policy – ${APP}`,
      '/terms': `Terms of Service – ${APP}`,
      '/admin': `Admin Dashboard – ${APP}`,
      '/admin/users': `User Management – ${APP}`,
      '/admin/mail-policies': `Mail Policies – ${APP}`,
      '/admin/storage': `Storage Analytics – ${APP}`,
      '/admin/security': `Security Audit – ${APP}`,
      '/admin/audit': `Audit Logs – ${APP}`,
    };

    // Check exact matches first
    if (titleMap[path]) {
      document.title = titleMap[path];
      return;
    }

    // Match prefix patterns
    if (path.startsWith('/settings')) {
      const section = path.split('/')[2];
      document.title = `${section ? section.charAt(0).toUpperCase() + section.slice(1) : 'Settings'} – ${APP}`;
      return;
    }

    if (path.startsWith('/account')) {
      const section = path.split('/')[2];
      const sectionLabel = section
        ? section.charAt(0).toUpperCase() + section.slice(1).replace(/-/g, ' ')
        : '';
      document.title = sectionLabel ? `${sectionLabel} – Account – ${APP}` : `Account – ${APP}`;
      return;
    }

    if (path.startsWith('/mail/thread/')) {
      // ThreadView title — set a placeholder; ThreadView component will override
      document.title = `Mail – ${APP}`;
      return;
    }

    // /mail/:folder handled by usePageTitle in AppLayout — don't override here
    if (path.startsWith('/mail/')) return;

    // Default fallback
    document.title = APP;
  }, [location]);

  return null;
};

const RootRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/mail/inbox" replace />;
  }
  return <LandingPage />;
};

export const AppContent: React.FC = () => {
  return (
    <>
      <RoutePageTitle />
      <Routes>
        {/* Landing Page for unauthenticated users, direct Inbox for authenticated users */}
        <Route path="/" element={<RootRoute />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public Support & Legal Routes */}
        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Mail Routes */}
        <Route path="/mail" element={<Navigate to="/mail/inbox" replace />} />
        <Route path="/mail/:folder" element={<ProtectedRoute><MailFolderPage /></ProtectedRoute>} />
        <Route path="/mail/thread/:id" element={<ProtectedRoute><ThreadDetailPage /></ProtectedRoute>} />

        {/* Contacts Route */}
        <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />

        {/* Settings Routes */}
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/*" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* Account Routes */}
        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/mail-policies" element={<AdminRoute><AdminMailPoliciesPage /></AdminRoute>} />
        <Route path="/admin/storage" element={<AdminRoute><AdminStoragePage /></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />

        {/* Default Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const AppBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let isMounted = true;

    // Stage 1: Auth check (120ms)
    const t1 = setTimeout(() => {
      if (isMounted) setProgress(35);
    }, 120);

    // Stage 2: Account & profile data check (280ms)
    const t2 = setTimeout(() => {
      if (isMounted) {
        try {
          const user = db.getCurrentUser();
          if (user) db.sendWelcomeEmail(user);
        } catch (e) {
          console.error(e);
        }
        setProgress(68);
      }
    }, 280);

    // Stage 3: Initializing mailbox (450ms)
    const t3 = setTimeout(() => {
      if (isMounted) setProgress(88);
    }, 450);

    // Stage 4: Preparing route & data (600ms)
    const t4 = setTimeout(() => {
      if (isMounted) setProgress(95);
    }, 600);

    // Stage 5: App ready (750ms) -> reach 100% -> fade out -> unmount
    const t5 = setTimeout(() => {
      if (isMounted) {
        setProgress(100);
        setTimeout(() => {
          if (isMounted) {
            setIsFadingOut(true);
            setTimeout(() => {
              if (isMounted) setIsInitializing(false);
            }, 300);
          }
        }, 150);
      }
    }, 750);

    // Maximum safety fallback (3s max)
    const safetyTimer = setTimeout(() => {
      if (isMounted && isInitializing) {
        setProgress(100);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => setIsInitializing(false), 300);
        }, 100);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(safetyTimer);
    };
  }, []);

  return (
    <>
      {isInitializing && <SplashScreen progress={progress} isFadingOut={isFadingOut} />}
      {children}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppBootstrap>
        <AppContent />
      </AppBootstrap>
    </BrowserRouter>
  );
};

export default App;
