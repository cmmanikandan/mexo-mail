import React from 'react';
import { Link } from 'react-router-dom';

export interface MexoAuthShellProps {
  children: React.ReactNode;
  stepProgress?: number;
  leftBrandTitle?: string;
  leftBrandSubtitle?: string;
}

export const MexoAuthShell: React.FC<MexoAuthShellProps> = ({
  children,
  stepProgress,
  leftBrandSubtitle = 'Your conversations, connected in one place.',
}) => {
  return (
    <div className="min-h-screen bg-auth-pageBg dark:bg-auth-darkPageBg flex flex-col justify-between items-center p-0 md:p-6 lg:p-8 font-sans antialiased text-auth-textPrimary dark:text-auth-darkTextPrimary selection:bg-mexo-100 selection:text-mexo-900">
      <div className="flex-1 flex items-center justify-center w-full max-w-[1000px]">
        {/* Main Unified Authentication Surface Container */}
        <div className="w-full min-h-none md:min-h-[540px] bg-auth-surface dark:bg-auth-darkSurface rounded-none md:rounded-[24px] border-0 md:border border-auth-border dark:border-auth-darkInputBorder shadow-mexo-md overflow-hidden flex flex-col md:flex-row transition-all duration-200">
          
          {/* Subtle Top Progress Bar (Mobile) */}
          {stepProgress !== undefined && (
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0 z-10 md:hidden">
              <div
                className="h-full bg-mexo-600 transition-all duration-300"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
          )}

          {/* Left Brand Panel (~42% width, subtle MEXO-tinted neutral surface #F7F9FF) */}
          <div className="w-full md:w-[42%] p-6 md:p-10 flex flex-col justify-between bg-auth-leftTint dark:bg-auth-darkLeftTint border-b md:border-b-0 md:border-r border-auth-separator dark:border-auth-darkInputBorder">
            <div>
              {/* MEXO Mail Logo */}
              <div className="flex items-center space-x-3.5 mb-6">
                <img
                  src="/logo.png"
                  alt="MEXO"
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
                <div>
                  <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-auth-textPrimary dark:text-auth-darkTextPrimary flex items-center">
                    MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-xl md:text-2xl ml-1.5">Mail</span>
                  </h1>
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1.5 mt-4">
                <p className="text-xs font-extrabold text-[#7C3AED] dark:text-indigo-400 uppercase tracking-wider">
                  Made to Connect.
                </p>
                <p className="text-sm text-auth-textSecondary dark:text-auth-darkTextSecondary leading-relaxed font-normal">
                  {leftBrandSubtitle}
                </p>
              </div>
            </div>

            {/* Bottom Brand Indicator */}
            <div className="hidden md:block pt-6 text-[11px] text-auth-textMuted font-medium">
              MEXO Account System &bull; Secure Authentication
            </div>
          </div>

          {/* Right Form Panel (~58% width, clean white #FFFFFF) */}
          <div className="w-full md:w-[58%] p-6 md:p-10 flex flex-col justify-between bg-auth-surface dark:bg-auth-darkSurface relative">
            {/* Desktop Progress Line */}
            {stepProgress !== undefined && (
              <div className="hidden md:block w-full h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] transition-all duration-300"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            )}

            {/* Content Slot */}
            <div className="w-full my-auto animate-in fade-in slide-in-from-right-2 duration-200">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-[1000px] px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-auth-textSecondary dark:text-auth-darkTextSecondary space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <select className="bg-transparent border-none text-xs font-medium text-auth-textSecondary dark:text-auth-darkTextSecondary cursor-pointer focus:outline-none">
            <option>English (United States)</option>
            <option>English (United Kingdom)</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </div>
        <div className="flex items-center space-x-6">
          <Link to="/help" className="hover:text-auth-textPrimary dark:hover:text-auth-darkTextPrimary transition-colors">
            Help
          </Link>
          <Link to="/privacy" className="hover:text-auth-textPrimary dark:hover:text-auth-darkTextPrimary transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-auth-textPrimary dark:hover:text-auth-darkTextPrimary transition-colors">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
};
