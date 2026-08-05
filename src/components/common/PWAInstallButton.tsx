import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string; variant?: 'button' | 'icon' }> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    return (
      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50">
        <Check className="w-3.5 h-3.5" />
        <span>App Installed</span>
      </span>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={promptInstall}
        className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${className}`}
        title="Install MEXO Mail App"
        aria-label="Install MEXO Mail App"
      >
        <Download className="w-4 h-4 text-[#7C3AED]" />
      </button>
    );
  }

  return (
    <button
      onClick={promptInstall}
      className={`px-3 py-1.5 rounded-xl bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 text-[#7C3AED] dark:text-indigo-300 font-extrabold text-xs border border-[#7C3AED]/20 transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs ${className}`}
      title="Install MEXO Mail Desktop & Mobile App"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
};
