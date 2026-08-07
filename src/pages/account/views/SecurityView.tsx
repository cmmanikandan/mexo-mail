import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { MexoButton } from '../../../components/common/MexoButton';
import { ChangePasswordModal } from '../../../components/account/ChangePasswordModal';
import { PasswordChangeSuggestionBanner } from '../../../components/account/PasswordChangeSuggestionBanner';
import { Lock, ShieldCheck, KeyRound, Smartphone, Clock, History } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const securityLogs = [
    {
      id: 'log-1',
      event: 'Password Sign-In',
      device: 'Current Browser Session (Web)',
      ip: '127.0.0.1 (Current)',
      timestamp: 'Just now',
      status: 'success',
    },
    {
      id: 'log-2',
      event: 'Session Authenticated',
      device: 'MEXO Mail Client',
      ip: 'Local Network',
      timestamp: 'Today at 09:30 AM',
      status: 'success',
    },
    {
      id: 'log-3',
      event: 'Identity Verification',
      device: 'Central Supabase Auth Provider',
      ip: 'Verified',
      timestamp: 'Yesterday',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      <PasswordChangeSuggestionBanner />

      {/* Main Security Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" /> Security Dashboard
          </h2>
          <p className="text-xs text-app-body mt-1">
            Manage your password, authentication security, and recent identity activity across MEXO services.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Password Card */}
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
                  ? 'Temporary password in use. Change password for enhanced account security.'
                  : 'Protected by MEXO Central Account identity.'}
              </p>
            </div>
            <MexoButton onClick={() => setIsChangeModalOpen(true)} variant="outline" size="sm">
              Change Password
            </MexoButton>
          </div>

          {/* 2-Step Verification Card */}
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-app-heading flex items-center">
                <ShieldCheck className="w-4 h-4 text-indigo-500 mr-1.5" /> Two-Step Verification (2FA)
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5">
                Adds an additional verification layer to your MEXO account login.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
              Active Protected
            </span>
          </div>
        </div>
      </div>

      {/* Recent Security Activity Log */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-app-heading flex items-center">
            <History className="w-4 h-4 text-app-primary mr-2" /> Recent Security Activity
          </h3>
          <p className="text-xs text-app-muted mt-0.5">
            Logins, authentication refreshes, and security events associated with your account.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {securityLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-app-heading">{log.event}</p>
                  <p className="text-[11px] text-app-muted">{log.device} • {log.ip}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-app-muted flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" /> {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
      />
    </div>
  );
};
