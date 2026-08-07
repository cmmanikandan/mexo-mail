import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { MexoButton } from '../../../components/common/MexoButton';
import { KeyRound, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

export const RecoveryView: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [recoveryEmailInput, setRecoveryEmailInput] = useState(currentUser?.recoveryEmail || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmailInput || !recoveryEmailInput.includes('@')) {
      addToast({ message: 'Please enter a valid recovery email address.', type: 'warning' });
      return;
    }

    await updateCurrentUser({ recoveryEmail: recoveryEmailInput.trim() });
    setIsEditing(false);
    addToast({ message: 'Recovery email updated successfully.', type: 'success' });
  };

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <KeyRound className="w-5 h-5 text-amber-500 mr-2" /> Account Recovery
          </h2>
          <p className="text-xs text-app-body mt-1">
            Configure recovery email options to secure and recover your MEXO identity if you lose access.
          </p>
        </div>

        {/* Recovery Email Box */}
        <div className="p-5 rounded-2xl border border-app-border bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-app-heading">Recovery Email</h4>
                <p className="text-xs text-app-muted mt-0.5">
                  Used for password resets, security alerts, and account recovery.
                </p>
              </div>
            </div>

            {!isEditing && (
              <MexoButton onClick={() => setIsEditing(true)} variant="outline" size="sm">
                {currentUser?.recoveryEmail ? 'Edit' : 'Add Recovery Email'}
              </MexoButton>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveRecoveryEmail} className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-app-heading mb-1">
                  New Recovery Email Address
                </label>
                <input
                  type="email"
                  value={recoveryEmailInput}
                  onChange={(e) => setRecoveryEmailInput(e.target.value)}
                  placeholder="e.g. personal.backup@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-app-heading focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <MexoButton type="submit" variant="primary" size="sm">
                  Save Recovery Email
                </MexoButton>
                <MexoButton type="button" onClick={() => setIsEditing(false)} variant="ghost" size="sm">
                  Cancel
                </MexoButton>
              </div>
            </form>
          ) : (
            <div className="pt-1 flex items-center justify-between text-xs font-mono text-app-heading border-t border-slate-200 dark:border-slate-700/60">
              <span className="font-bold">{currentUser?.recoveryEmail || 'No recovery email configured'}</span>
              {currentUser?.recoveryEmail && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-sans font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Security Recovery Code Notice */}
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <p className="font-bold flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" /> Backup Recovery Key
          </p>
          <p className="text-[11px] text-blue-700 dark:text-blue-300">
            Your MEXO Account identity is linked to your central Supabase credentials. Ensure your recovery email remains updated.
          </p>
        </div>
      </div>
    </div>
  );
};
