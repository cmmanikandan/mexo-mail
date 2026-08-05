import React, { useState, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface AuthTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AuthTextField = forwardRef<HTMLInputElement, AuthTextFieldProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, value, onChange, onFocus, onBlur, placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `field-${Math.random().toString(36).substring(2, 9)}`;

    const isFilled = value !== undefined && value !== null && String(value).length > 0;
    const isLabelFloating = isFocused || isFilled;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div className="w-full text-left">
        <div
          className={`relative flex items-center h-14 rounded-lg bg-white dark:bg-auth-darkInputBg border transition-all ${error
              ? 'border-rose-600 ring-1 ring-rose-600'
              : isFocused
                ? 'border-[#0878e8] ring-1 ring-[#0878e8]'
                : 'border-auth-inputBorder dark:border-auth-darkInputBorder hover:border-auth-inputHover'
            }`}
        >
          {leftIcon && (
            <div className="pl-4 text-auth-textMuted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}

          {/* Floating Label */}
          <label
            htmlFor={inputId}
            className={`absolute pointer-events-none transition-all duration-150 ease-in-out select-none ${leftIcon ? (isLabelFloating ? 'left-3.5' : 'left-11') : 'left-3.5'
              } ${isLabelFloating
                ? '-top-2.5 text-[11px] font-semibold px-1.5 rounded bg-white dark:bg-auth-darkInputBg z-20 ' +
                (error ? 'text-rose-600' : isFocused ? 'text-[#0878e8] dark:text-blue-400' : 'text-auth-textSecondary dark:text-auth-darkTextSecondary')
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500 font-normal'
              }`}
          >
            {label}
          </label>

          <input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isLabelFloating && isFocused ? placeholder : ''}
            className={`w-full h-full bg-transparent text-auth-textPrimary dark:text-auth-darkTextPrimary text-base px-4 border-none outline-none font-normal ${isLabelFloating ? 'pt-2' : ''
              } ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 text-auth-textMuted flex items-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-auth-textSecondary dark:text-auth-darkTextSecondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

AuthTextField.displayName = 'AuthTextField';
