import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { ComposeContainer } from '../compose/ComposeModal';
import { MexoToastContainer } from '../common/MexoToast';
import { ArrowLeft } from 'lucide-react';

export interface AccountSettingsLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  sidebar?: React.ReactNode;
  /** Where the mobile back arrow navigates. Defaults to navigate(-1). */
  mobileBackPath?: string;
}

export const AccountSettingsLayout: React.FC<AccountSettingsLayoutProps> = ({
  children,
  title,
  subtitle,
  sidebar,
  mobileBackPath,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (mobileBackPath) {
      navigate(mobileBackPath);
    } else {
      navigate('/mail/inbox');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#0D1117] font-sans text-slate-900 dark:text-slate-100">

      {/* ── Desktop: Full App Header ── */}
      <div className="hidden md:block">
        <AppHeader />
      </div>

      {/* ── Mobile: Compact Top App Bar ── */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-app-border shadow-sm select-none">
        <div
          onClick={handleBack}
          className="flex items-center h-14 px-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        >
          <button
            onClick={handleBack}
            className="p-2 rounded-xl text-app-heading flex-shrink-0"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-base font-bold text-app-heading truncate px-1">{title}</h1>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto md:px-6 md:py-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1">

          {/* Desktop Sidebar — always hidden on mobile */}
          {sidebar && (
            <aside className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-4 shadow-mexo-sm">
                <button
                  onClick={() => navigate('/mail/inbox')}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#0878e8] hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Inbox</span>
                </button>
                <div className="px-3 py-2 mb-2 border-b border-app-border">
                  <h2 className="text-sm font-extrabold text-app-heading tracking-tight">{title}</h2>
                  {subtitle && <p className="text-[11px] text-app-muted mt-0.5">{subtitle}</p>}
                </div>
                {sidebar}
              </div>
            </aside>
          )}

          {/* Content Panel */}
          <main className="flex-1 min-w-0 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      <ComposeContainer />
      <MexoToastContainer />
    </div>
  );
};
