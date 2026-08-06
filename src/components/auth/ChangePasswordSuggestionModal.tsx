import React, { useState } from 'react';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { ShieldAlert, Eye, EyeOff, CheckCircle2, Lock, Check, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface ChangePasswordSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordSuggestionModal: React.FC<ChangePasswordSuggestionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addToast } = useUIStore();
  const { currentUser, signOut, clearDefaultPasswordFlag } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isFormValid = newPassword.length >= 8 && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSessionExpired(false);

      const res = await api.updateUserPassword(newPassword);
      if (res.success) {
        // Clear security flag ONLY after successful Supabase Auth password update
        clearDefaultPasswordFlag();
        setIsSuccess(true);
        addToast({ message: 'Your MEXO Account password has been changed successfully.', type: 'success' });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (res.error === 'SESSION_EXPIRED') {
        setSessionExpired(true);
        setError('Your session has expired. Please sign in again.');
      } else {
        setError(res.error || 'Unable to update password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionExpired) {
    return (
      <MexoModal isOpen={isOpen} onClose={onClose} title="Session Expired" maxWidth="md">
        <div className="p-6 text-center space-y-4 select-none">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Session Expired
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            Your session has expired. Please sign in again to update your MEXO Account password.
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="w-full py-2.5 bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:opacity-95 transition-all"
          >
            Sign In Again
          </button>
        </div>
      </MexoModal>
    );
  }

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Security Recommendation" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Default Password Detected
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Your account was setup with a default password (same as your username). For your privacy & security, we strongly recommend choosing a custom password.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* New Password Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter new strong password"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <PasswordStrengthIndicator password={newPassword} />
        </div>

        {/* Confirm Password Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Re-enter new password"
              required
              className={`w-full pl-9 pr-10 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none transition-colors ${
                isMatching
                  ? 'border-emerald-500 focus:border-emerald-600'
                  : isMismatch
                  ? 'border-rose-500 focus:border-rose-600'
                  : 'border-app-border focus:border-[#7C3AED]'
              }`}
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Remind Me Later
          </button>

          <MexoButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || (confirmPassword.length > 0 && !isMatching)}
            size="md"
            className="px-6 rounded-xl font-bold text-xs disabled:opacity-60 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
            Update Password Now
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
