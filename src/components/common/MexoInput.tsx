import React, { forwardRef } from 'react';

export interface MexoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffixDomain?: string; // e.g. "@mexo.com"
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const MexoInput = forwardRef<HTMLInputElement, MexoInputProps>(
  ({ label, error, helperText, suffixDomain, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className="w-full text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-mexo-500/20 focus:border-mexo-600 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800 ${
              error
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 dark:border-slate-700'
            } ${leftIcon ? 'pl-10' : ''} ${suffixDomain ? 'pr-28' : rightIcon ? 'pr-10' : ''} ${className}`}
            {...props}
          />
          {suffixDomain && (
            <span className="absolute right-3.5 text-sm font-semibold text-slate-400 select-none pointer-events-none">
              {suffixDomain}
            </span>
          )}
          {rightIcon && !suffixDomain && (
            <div className="absolute right-3 text-slate-400 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

MexoInput.displayName = 'MexoInput';
