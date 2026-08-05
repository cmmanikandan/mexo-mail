import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { MexoAvatar } from '../../../components/common/MexoAvatar';
import { MexoButton } from '../../../components/common/MexoButton';
import { PWAInstallButton } from '../../../components/common/PWAInstallButton';
import {
  User,
  Shield,
  Monitor,
  KeyRound,
  Grid,
  Eye,
  HardDrive,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

export const OverviewView: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();

  const formattedCreatedDate = () => {
    try {
      return format(new Date(currentUser.createdAt), 'MMMM d, yyyy');
    } catch {
      return 'January 2025';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Identity Card */}
      <section className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-app-border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-mexo-sm">
        <div className="flex items-center space-x-5">
          <MexoAvatar
            name={`${currentUser.firstName} ${currentUser.lastName}`}
            src={currentUser.avatarUrl}
            size="xl"
          />
          <div>
            <h2 className="text-xl font-extrabold text-app-heading flex items-center">
              {currentUser.firstName} {currentUser.lastName}
              <Sparkles className="w-4 h-4 text-amber-500 ml-2" />
            </h2>
            <p className="text-sm font-mono font-bold text-app-primary dark:text-mexo-400 mt-0.5">
              {currentUser.email}
            </p>
            <p className="text-xs text-app-muted mt-1.5 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
              Member since {formattedCreatedDate()} &bull;{' '}
              <span className="text-emerald-600 font-semibold ml-1">Active Identity</span>
            </p>
          </div>
        </div>

        <MexoButton
          onClick={() => navigate('/account/personal-info')}
          variant="outline"
          size="sm"
          className="self-start sm:self-center"
        >
          Edit Profile
        </MexoButton>
      </section>

      {/* PWA App Installation Card */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-[#7C3AED]/10 via-[#6366F1]/10 to-[#0878e8]/10 border border-[#7C3AED]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white flex items-center justify-center shadow-mexo-sm flex-shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-app-heading flex items-center">
              Install MEXO Mail App
            </h3>
            <p className="text-xs text-app-body font-medium mt-0.5">
              Get the standalone desktop & mobile app experience with offline support and instant notifications.
            </p>
          </div>
        </div>

        <PWAInstallButton className="self-start sm:self-center py-2.5 px-5 text-xs shadow-md" />
      </section>

      {/* Grid of Dedicated Sub-Pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Personal Info Card */}
        <div
          onClick={() => navigate('/account/personal-info')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <User className="w-6 h-6 text-app-primary mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Personal Information
            </h3>
            <p className="text-xs text-app-body font-medium">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-[11px] text-app-muted font-mono">{currentUser.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>

        {/* Security Card */}
        <div
          onClick={() => navigate('/account/security')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <Shield className="w-6 h-6 text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Security Dashboard
            </h3>
            <p className="text-xs text-app-body font-medium">Password & authentication methods</p>
            <p className="text-[11px] text-emerald-600 font-bold">Protected</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>

        {/* Devices & Sessions Card */}
        <div
          onClick={() => navigate('/account/devices')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <Monitor className="w-6 h-6 text-indigo-600 mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Devices & Sessions
            </h3>
            <p className="text-xs text-app-body font-medium">1 active web browser session</p>
            <p className="text-[11px] text-app-muted">Current session active</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>

        {/* Recovery Card */}
        <div
          onClick={() => navigate('/account/recovery')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <KeyRound className="w-6 h-6 text-amber-500 mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Account Recovery
            </h3>
            <p className="text-xs text-app-body font-medium">
              {currentUser.recoveryEmail ? currentUser.recoveryEmail : 'No recovery email set'}
            </p>
            <p className="text-[11px] text-app-muted">Password recovery protection</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>

        {/* Connected Apps Card */}
        <div
          onClick={() => navigate('/account/connected-apps')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <Grid className="w-6 h-6 text-sky-600 mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Connected MEXO Apps
            </h3>
            <p className="text-xs text-app-body font-medium">MEXO Mail Authorized</p>
            <p className="text-[11px] text-app-muted">1 app connected</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>

        {/* Data & Storage Card */}
        <div
          onClick={() => navigate('/account/storage')}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-app-border hover:border-app-primary transition-all cursor-pointer group shadow-sm flex justify-between items-start"
        >
          <div className="space-y-1.5">
            <HardDrive className="w-6 h-6 text-purple-600 mb-2" />
            <h3 className="text-base font-bold text-app-heading group-hover:text-app-primary">
              Data & Storage
            </h3>
            <p className="text-xs text-app-body font-medium">0 KB of 15 GB used</p>
            <p className="text-[11px] text-app-muted">Storage breakdown & data export</p>
          </div>
          <ChevronRight className="w-5 h-5 text-app-muted group-hover:text-app-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};
