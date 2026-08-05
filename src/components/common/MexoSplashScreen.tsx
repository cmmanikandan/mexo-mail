import React, { useEffect, useState } from 'react';

export interface MexoSplashScreenProps {
  progress?: number;
  statusText?: string;
}

export const MexoSplashScreen: React.FC<MexoSplashScreenProps> = ({
  progress: externalProgress,
  statusText: externalStatusText,
}) => {
  const [internalProgress, setInternalProgress] = useState(15);
  const [internalStatus, setInternalStatus] = useState('Initializing MEXO Mail identity...');

  useEffect(() => {
    if (externalProgress !== undefined) return;

    const t1 = setTimeout(() => {
      setInternalProgress(48);
      setInternalStatus('Connecting to encrypted mail server...');
    }, 200);

    const t2 = setTimeout(() => {
      setInternalProgress(82);
      setInternalStatus('Syncing inbox & preferences...');
    }, 500);

    const t3 = setTimeout(() => {
      setInternalProgress(100);
      setInternalStatus('Loading complete');
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [externalProgress]);

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;
  const currentStatus = externalStatusText || internalStatus;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 md:p-14 bg-[#F8FAFD] dark:bg-[#0B0F17] select-none transition-opacity duration-300 overflow-hidden">
      {/* Background Ambient Radial Light Effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0878E8]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Placeholder */}
      <div className="w-full h-4 md:h-8" />

      {/* Center Hero Branding & Progress Section */}
      <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 text-center max-w-md w-full my-auto z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Prominent Hero Emblem Card with Dual Halo */}
        <div className="relative flex items-center justify-center">
          {/* Outer Glowing Halo */}
          <div className="absolute inset-0 rounded-full bg-[#0878E8]/20 blur-3xl transform scale-150 animate-pulse pointer-events-none" />

          {/* Hero Emblem Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-[2.25rem] bg-white dark:bg-slate-900 shadow-[0_25px_60px_rgba(8,120,232,0.16)] border border-app-border flex items-center justify-center p-5 md:p-7 transition-all duration-300 hover:scale-105">
            <img
              src="/logo.png"
              alt="MEXO Mail"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain transition-transform duration-500"
            />
          </div>
        </div>

        {/* Branding Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-app-heading tracking-tight">
            MEXO <span className="text-[#0878E8] font-semibold ml-0.5">Mail</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-app-muted font-medium tracking-wide">
            Made to Connect.
          </p>
        </div>

        {/* High-Impact Gmail-Style Shimmer Progress Bar */}
        <div className="w-56 sm:w-64 md:w-80 space-y-2.5 pt-2">
          <div className="w-full h-1.5 sm:h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#0878E8] via-[#2563EB] to-[#3B82F6] rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(8,120,232,0.6)]"
              style={{ width: `${Math.min(100, Math.max(0, currentProgress))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-app-muted px-1">
            <span className="truncate max-w-[200px] sm:max-w-none">{currentStatus}</span>
            <span className="font-mono font-bold text-[#0878E8]">{currentProgress}%</span>
          </div>
        </div>
      </div>

      {/* Footer Security Engine Indicator */}
      <div className="text-[11px] sm:text-xs font-medium text-app-muted flex items-center space-x-2.5 z-10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span>Protected by MEXO Identity Engine</span>
      </div>
    </div>
  );
};
