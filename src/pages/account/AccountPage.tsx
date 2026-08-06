import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AccountSettingsLayout } from '../../components/layout/AccountSettingsLayout';
import { AccountNavigation, ACCOUNT_ITEMS } from '../../components/account/AccountNavigation';
import { PersonalInfoView } from './views/PersonalInfoView';
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

const SecurityView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  return (
    <div className="space-y-6 mx-4 md:mx-0">
      <PasswordChangeSuggestionBanner />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Lock className="w-5 h-5 text-emerald-600 mr-2" /> Security Dashboard
          </h2>
          <p className="text-xs text-app-body mt-1">Manage your credentials, 2-step verification, and login activity.</p>
        </div>
        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h4 className="font-bold text-app-heading flex items-center">
                Password
                {(currentUser?.requiresPasswordChange || currentUser?.createdByAdmin) && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Update Recommended
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5">
                {currentUser?.requiresPasswordChange || currentUser?.createdByAdmin
                  ? 'Temporary admin-assigned password in use'
                  : 'Protected by MEXO Account identity'}
              </p>
            </div>
            <MexoButton onClick={() => setIsChangeModalOpen(true)} variant="outline" size="sm">
              Change Password
            </MexoButton>
          </div>
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-app-heading">Two-Step Verification (2FA)</h4>
              <p className="text-[11px] text-app-muted mt-0.5">Extra authentication security layer.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex-shrink-0">
              {currentUser?.twoFactorEnabled ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
      />
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

    if (isSessions) return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-5 mx-4 md:mx-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-app-heading flex items-center">
              <Monitor className="w-5 h-5 text-indigo-600 mr-2" /> Devices & Sessions
            </h2>
            <p className="text-xs text-app-body mt-1">Devices currently signed into your MEXO Mail account.</p>
          </div>
          <MexoButton onClick={() => addToast({ message: 'Other sessions signed out.', type: 'info' })} variant="outline" size="sm">
            Sign Out Others
          </MexoButton>
        </div>
      </div>
    );

    if (isRecovery) return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-5 mx-4 md:mx-0">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <KeyRound className="w-5 h-5 text-amber-500 mr-2" /> Account Recovery
          </h2>
        </div>
        <div className="p-4 rounded-xl border border-app-border flex items-center justify-between text-xs gap-3">
          <div>
            <h4 className="font-bold text-app-heading">Recovery Email</h4>
            <p className="text-[11px] text-app-muted mt-0.5">{currentUser?.recoveryEmail || 'No recovery email set'}</p>
          </div>
          <MexoButton variant="outline" size="sm">Update</MexoButton>
        </div>
      </div>
    );

    if (isApps) return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-5 mx-4 md:mx-0">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Grid className="w-5 h-5 text-app-primary mr-2" /> Connected MEXO Apps
          </h2>
        </div>
      </div>
    );

    if (isPrivacy) return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-5 mx-4 md:mx-0">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Eye className="w-5 h-5 text-purple-600 mr-2" /> Account Privacy
          </h2>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-app-border text-xs gap-3">
          <div>
            <h4 className="font-bold text-app-heading">MEXO Contact Discovery</h4>
            <p className="text-[11px] text-app-muted mt-0.5">Allow other MEXO users to find you via address ({currentUser?.email}).</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-app-primary rounded flex-shrink-0" />
        </div>
      </div>
    );

    if (isStorage) {
      const storageInfo = db.getStorageForUser(currentUser?.email || '');
      const limitGB = (storageInfo.limitBytes / (1024 * 1024 * 1024)).toFixed(0);
      const freeGB = ((storageInfo.limitBytes - storageInfo.usedBytes) / (1024 * 1024 * 1024)).toFixed(1);

      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6 mx-4 md:mx-0">
          <div>
            <h2 className="text-lg font-extrabold text-app-heading flex items-center">
              <HardDrive className="w-5 h-5 text-sky-600 mr-2" /> Data & Storage
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-app-border space-y-4 text-xs">
            <div className="flex justify-between items-center font-bold">
              <span className="text-app-heading">Account Storage</span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-[#0878e8] dark:text-blue-300">
                  {storageInfo.percent}%
                </span>
                <span className="text-[#0878e8] font-bold">{storageInfo.usedFormatted} of {limitGB} GB used</span>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0878e8] via-[#0668cc] to-[#0052b3] shadow-md transition-all duration-500"
                style={{ width: `${Math.max(storageInfo.percent, 3)}%` }}
              />
            </div>
          </div>
        </div>
      );
    };

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
