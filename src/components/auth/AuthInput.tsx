import React, { forwardRef } from 'react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffixDomain?: string; // e.g. "@mexo.com"
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, helperText, suffixDomain, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `auth-input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full h-13 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 text-base transition-all focus:outline-none focus:ring-2 focus:ring-mexo-500/20 focus:border-mexo-600 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700'
            } ${leftIcon ? 'pl-11' : ''} ${suffixDomain ? 'pr-28' : rightIcon ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {suffixDomain && (
            <span className="absolute right-4 text-base font-medium text-slate-400 select-none pointer-events-none">
              {suffixDomain}
            </span>
          )}
          {rightIcon && !suffixDomain && (
            <div className="absolute right-4 text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
