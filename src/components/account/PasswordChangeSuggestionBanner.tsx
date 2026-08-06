import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export const PasswordChangeSuggestionBanner: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show banner if admin created the user, or if password change is flagged
  const needsChange = Boolean(currentUser.requiresPasswordChange || currentUser.createdByAdmin);

  if (!needsChange) return null;

  return (
    <>
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 border-2 border-amber-500/30 dark:border-amber-700/50 shadow-mexo-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Security Action Suggested: Change Password
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                Admin Notice
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Your account was created or reset by a MEXO administrator. For privacy and security, we strongly recommend updating your temporary password.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 flex items-center justify-center space-x-2 transition-all active:scale-98 flex-shrink-0 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 mr-1" />
          <span>Change Password Now</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      <ChangePasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isForcedChange={true}
      />
    </>
  );
};
