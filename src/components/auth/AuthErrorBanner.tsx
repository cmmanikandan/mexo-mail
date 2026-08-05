import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface AuthErrorBannerProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({
  title,
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`w-full my-4 p-4 rounded-xl bg-gradient-to-r from-rose-50/95 via-red-50/90 to-rose-50/95 dark:from-rose-950/95 dark:via-red-950/90 dark:to-rose-950/95 border-2 border-rose-500/40 dark:border-rose-500/60 text-rose-950 dark:text-rose-100 shadow-md shadow-rose-500/10 animate-shake flex items-start space-x-3.5 relative overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Subtle left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-600 dark:bg-rose-500" />

      {/* Icon Badge */}
      <div className="w-9 h-9 rounded-full bg-rose-500/15 dark:bg-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
      </div>

      {/* Content */}
      <div className="flex-1 pr-6">
        {title && (
          <h4 className="text-xs uppercase font-extrabold text-rose-700 dark:text-rose-300 tracking-wider mb-0.5">
            {title}
          </h4>
        )}
        <p className="text-sm font-bold text-rose-900 dark:text-rose-100 leading-snug tracking-tight">
          {message}
        </p>
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
          aria-label="Dismiss error message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
