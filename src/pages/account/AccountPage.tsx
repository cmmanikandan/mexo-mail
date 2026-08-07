import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccountSettingsLayout } from '../../components/layout/AccountSettingsLayout';
import { AccountNavigation, ACCOUNT_ITEMS } from '../../components/account/AccountNavigation';
import { PersonalInfoView } from './views/PersonalInfoView';
import { SecurityView } from './views/SecurityView';
import { DevicesSessionsView } from './views/DevicesSessionsView';
import { RecoveryView } from './views/RecoveryView';
import { ConnectedAppsView } from './views/ConnectedAppsView';
import { PrivacyView } from './views/PrivacyView';
import { DataStorageView } from './views/DataStorageView';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoButton } from '../../components/common/MexoButton';
import { ComposeContainer } from '../../components/compose/ComposeModal';
import { MexoToastContainer } from '../../components/common/MexoToast';
import { ChangePasswordModal } from '../../components/account/ChangePasswordModal';
import { PasswordChangeSuggestionBanner } from '../../components/account/PasswordChangeSuggestionBanner';
import {
  Monitor,
  KeyRound,
  Grid,
  Eye,
  HardDrive,
  CheckCircle2,
  Lock,
  Download,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

const MobileAccountHome: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const groups = [
    {
      label: 'ACCOUNT',
      items: ACCOUNT_ITEMS.filter((i) => ['personal', 'security', 'sessions'].includes(i.id)),
    },
    {
      label: 'ACCESS & RECOVERY',
      items: ACCOUNT_ITEMS.filter((i) => ['recovery', 'apps'].includes(i.id)),
    },
    {
      label: 'DATA & PRIVACY',
      items: ACCOUNT_ITEMS.filter((i) => ['privacy', 'storage'].includes(i.id)),
    },
  ];

  const handleBack = () => {
    navigate('/mail/inbox');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] dark:bg-[#0D1117] font-sans text-slate-900 dark:text-slate-100">
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-app-border shadow-sm select-none">
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
          <h1 className="flex-1 text-base font-bold text-app-heading truncate px-1">MEXO Account</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 pt-4">
          <PasswordChangeSuggestionBanner />
        </div>

        <div className="flex flex-col items-center text-center px-6 pt-6 pb-6">
          <div
            className="relative group cursor-pointer mb-4"
            onClick={() => navigate('/account/personal-info')}
          >
            <MexoAvatar
              name={`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}
              src={currentUser?.avatarUrl}
              size="xl"
              className="w-20 h-20 text-2xl shadow-mexo-md border-2 border-white dark:border-slate-700"
            />
          </div>
          <h2 className="text-xl font-extrabold text-app-heading leading-tight">
            {currentUser?.firstName} {currentUser?.lastName}
          </h2>
          <p className="text-sm text-app-primary font-mono mt-1 truncate max-w-full">{currentUser?.email}</p>
          <div className="flex items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            MEXO Account
          </div>
          <MexoButton
            variant="outline"
            size="sm"
            className="mt-4 px-6"
            onClick={() => navigate('/account/personal-info')}
          >
            Manage profile
          </MexoButton>
        </div>

        <div className="px-4 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
                {group.label}
              </p>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                {group.items.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center px-4 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 transition-colors min-h-[72px] ${
                      idx < group.items.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/40' : ''
                    }`}
                  >
                    <span className="text-app-muted mr-3.5 flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-app-heading">{item.label}</p>
                      <p className="text-xs text-app-muted mt-0.5">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ComposeContainer />
      <MexoToastContainer />
    </div>
  );
};

const DesktopAccountOverview: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  return (
    <div className="space-y-6">
      <PasswordChangeSuggestionBanner />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-6 shadow-mexo-sm flex items-center gap-5">
        <MexoAvatar
          name={`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}
          src={currentUser?.avatarUrl}
          size="xl"
          className="w-20 h-20 text-2xl shadow-mexo-md"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-extrabold text-app-heading">
            {currentUser?.firstName} {currentUser?.lastName}
          </h2>
          <p className="text-sm font-mono text-app-primary mt-0.5 truncate">{currentUser?.email}</p>
          <div className="flex items-center mt-2 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> MEXO Account · Active
          </div>
        </div>
        <MexoButton variant="outline" size="sm" onClick={() => navigate('/account/personal-info')}>
          Manage profile
        </MexoButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACCOUNT_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-app-border hover:border-app-primary/40 hover:bg-app-primarySoft/30 dark:hover:bg-mexo-950/40 transition-all text-left group shadow-mexo-sm"
          >
            <span className="text-app-primary">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-app-heading group-hover:text-app-primary transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-app-muted mt-0.5">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-app-muted flex-shrink-0 group-hover:text-app-primary transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};



export const AccountPage: React.FC = () => {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const currentPath = location.pathname;
  const isAccountRoot = currentPath === '/account' || currentPath === '/account/';

  const isPersonal  = currentPath.includes('/personal-info');
  const isSecurity  = currentPath.includes('/security');
  const isSessions  = currentPath.includes('/devices');
  const isRecovery  = currentPath.includes('/recovery');
  const isApps      = currentPath.includes('/connected-apps');
  const isPrivacy   = currentPath.includes('/privacy');
  const isStorage   = currentPath.includes('/storage');

  if (isAccountRoot) {
    return (
      <>
        <div className="hidden md:block">
          <AccountSettingsLayout
            title="MEXO Account"
            subtitle="Identity & Security Hub"
            sidebar={<AccountNavigation />}
          >
            <DesktopAccountOverview />
          </AccountSettingsLayout>
        </div>
        <div className="md:hidden">
          <MobileAccountHome />
        </div>
      </>
    );
  }

  const getSubpageTitle = () => {
    if (isPersonal)  return 'Personal info';
    if (isSecurity)  return 'Security';
    if (isSessions)  return 'Devices & sessions';
    if (isRecovery)  return 'Recovery';
    if (isApps)      return 'Connected MEXO Apps';
    if (isPrivacy)   return 'Privacy';
    if (isStorage)   return 'Data & Storage';
    return 'MEXO Account';
  };

  const renderContent = () => {
    if (isPersonal) return <PersonalInfoView />;
    if (isSecurity) return <SecurityView />;
    if (isSessions) return <DevicesSessionsView />;
    if (isRecovery) return <RecoveryView />;
    if (isApps)     return <ConnectedAppsView />;
    if (isPrivacy)  return <PrivacyView />;
    if (isStorage)  return <DataStorageView />;

    return <DesktopAccountOverview />;
  };

  return (
    <AccountSettingsLayout
      title={getSubpageTitle()}
      subtitle="MEXO Account"
      sidebar={<AccountNavigation />}
      mobileBackPath="/account"
    >
      <div className="py-4 md:py-0">
        {renderContent()}
      </div>
    </AccountSettingsLayout>
  );
};
