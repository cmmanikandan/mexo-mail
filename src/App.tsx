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
import { SplashScreen } from './components/common/SplashScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated || currentUser?.role !== 'system_admin') {
    return <Navigate to="/mail/inbox" replace />;
  }
  return <>{children}</>;
};

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

    if (titleMap[path]) {
      document.title = titleMap[path];
      return;
    }

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
      document.title = `Mail – ${APP}`;
      return;
    }

    if (path.startsWith('/mail/')) return;
    document.title = APP;
  }, [location]);

  return null;
};

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
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
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/help" element={<HelpPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        <Route path="/mail" element={<Navigate to="/mail/inbox" replace />} />
        <Route path="/mail/:folder" element={<ProtectedRoute><MailFolderPage /></ProtectedRoute>} />
        <Route path="/mail/thread/:id" element={<ProtectedRoute><ThreadDetailPage /></ProtectedRoute>} />

        <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/*" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/mail-policies" element={<AdminRoute><AdminMailPoliciesPage /></AdminRoute>} />
        <Route path="/admin/storage" element={<AdminRoute><AdminStoragePage /></AdminRoute>} />
        <Route path="/admin/security" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const AppBootstrap: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(15);
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    // Trigger Cloud Auth Initialization
    initializeAuth();

    const t1 = setTimeout(() => { if (isMounted) setProgress(35); }, 120);
    const t2 = setTimeout(() => { if (isMounted) setProgress(68); }, 280);
    const t3 = setTimeout(() => { if (isMounted) setProgress(88); }, 450);
    const t4 = setTimeout(() => { if (isMounted) setProgress(95); }, 600);
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

    return () => {
      isMounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [initializeAuth]);

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
