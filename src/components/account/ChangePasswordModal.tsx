import React, { useState } from 'react';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert, Check, X } from 'lucide-react';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isForcedChange?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isForcedChange = false,
}) => {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Verification 1: Current Password Check (unless forced/default password reset where current can be empty or verified)
    const expectedCurrent = currentUser.password || 'password123';
    if (!isForcedChange && currentPassword.trim() !== expectedCurrent.trim()) {
      setError('Current password is incorrect.');
      return;
    }

    // Verification 2: New Password Length
    if (newPassword.trim().length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    // Verification 3: New Password vs Current Password
    if (newPassword.trim() === expectedCurrent.trim()) {
      setError('New password must be different from your current password.');
      return;
    }

    // Verification 4: Password Match
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await api.updateUserPassword(newPassword.trim());

      if (res.success) {
        db.changeUserPassword(currentUser.id, newPassword.trim());
        updateCurrentUser({
          password: newPassword.trim(),
          requiresPasswordChange: false,
          createdByAdmin: false,
        });

        addToast({
          message: 'Your MEXO Account password was updated successfully!',
          type: 'success',
        });

        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Password update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MexoModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Account Password"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {isForcedChange ? (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admin Notice: Password Update Suggested</p>
              <p className="mt-0.5">
                Your account password was assigned by an administrator. Please set a new secure password.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-app-muted">
            Create a strong password with at least 6 characters to secure your MEXO Account.
          </p>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Current Password Field (only if not forced change with missing current pass) */}
        {!isForcedChange && (
          <div>
            <label className="block text-xs font-bold text-app-heading mb-1">
              Current Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-white dark:bg-slate-900 text-sm text-app-heading placeholder-app-muted focus:outline-none focus:border-app-primary pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-heading"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* New Password Field */}
        <div>
          <label className="block text-xs font-bold text-app-heading mb-1">
            New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-white dark:bg-slate-900 text-sm text-app-heading placeholder-app-muted focus:outline-none focus:border-app-primary pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-heading"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <div>
          <label className="block text-xs font-bold text-app-heading mb-1">
            Confirm New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-sm text-app-heading placeholder-app-muted outline-none transition-colors pr-10 ${
                isMatching
                  ? 'border-emerald-500 focus:border-emerald-600'
                  : isMismatch
                  ? 'border-rose-500 focus:border-rose-600'
                  : 'border-app-border focus:border-app-primary'
              }`}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-heading"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Confirm Password Live Match Validator Feedback */}
          {confirmPassword.length > 0 && (
            <div className="mt-1.5 text-xs font-semibold flex items-center space-x-1.5">
              {isMatching ? (
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-500 flex-shrink-0" />
                  <span>Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                  <X className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" />
                  <span>Passwords do not match</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-app-border">
          <MexoButton type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </MexoButton>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white text-xs font-extrabold shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 flex items-center cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Save Password
              </>
            )}
          </button>
        </div>
      </form>
    </MexoModal>
  );
};
