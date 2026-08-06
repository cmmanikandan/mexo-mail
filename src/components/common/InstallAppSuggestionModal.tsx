import React from 'react';
import { MexoModal } from './MexoModal';
import { MexoButton } from './MexoButton';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Sparkles, Zap, Bell, ShieldCheck } from 'lucide-react';

interface InstallAppSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppSuggestionModal: React.FC<InstallAppSuggestionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    await promptInstall();
    onClose();
  };

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Install App Suggestion" maxWidth="md">
      <div className="space-y-5">
        {/* Header Hero */}
        <div className="text-center py-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Install MEXO Mail App
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Get the full desktop & mobile experience with instant access, native notifications, and lightning speed.
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 gap-2.5 p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center space-x-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-[#7C3AED] dark:text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
            <span className="font-semibold">One-tap launching directly from your Home Screen / Taskbar</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Bell className="w-4 h-4" />
            </div>
            <span className="font-semibold">Instant desktop & mobile push notifications for new mails</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-semibold">Offline read support & enhanced cloud synchronization</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-app-border">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Maybe Later
          </button>

          <MexoButton
            type="button"
            onClick={handleInstallClick}
            size="md"
            className="px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-[#7C3AED] to-[#0878e8] text-white shadow-md shadow-indigo-500/25"
          >
            <Sparkles className="w-4 h-4 mr-1.5 inline" />
            Install App Now
          </MexoButton>
        </div>
      </div>
    </MexoModal>
  );
};
