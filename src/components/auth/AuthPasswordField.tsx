import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface AuthPasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const AuthPasswordField = forwardRef<HTMLInputElement, AuthPasswordFieldProps>(
  ({ label = 'Password', error, helperText, className = '', id, value, onChange, onFocus, onBlur, placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `pass-${Math.random().toString(36).substring(2, 9)}`;

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
          className={`relative flex items-center h-14 rounded-lg bg-white dark:bg-auth-darkInputBg border transition-all ${
            error
              ? 'border-rose-600 ring-1 ring-rose-600'
              : isFocused
              ? 'border-mexo-600 ring-1 ring-mexo-600'
              : 'border-auth-inputBorder dark:border-auth-darkInputBorder hover:border-auth-inputHover'
          }`}
        >
          {/* Floating Label */}
          <label
            htmlFor={inputId}
            className={`absolute left-3.5 pointer-events-none transition-all duration-150 ease-in-out select-none ${
              isLabelFloating
                ? '-top-2.5 text-[11px] font-semibold px-1.5 rounded bg-white dark:bg-auth-darkInputBg z-20 ' +
                  (error ? 'text-rose-600' : isFocused ? 'text-mexo-600 dark:text-mexo-400' : 'text-auth-textSecondary dark:text-auth-darkTextSecondary')
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {label}
          </label>

          <input
            id={inputId}
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isLabelFloating && isFocused ? placeholder : ''}
            className={`w-full h-full bg-transparent text-auth-textPrimary dark:text-auth-darkTextPrimary text-base px-4 pr-12 border-none outline-none font-normal ${
              isLabelFloating ? 'pt-2' : ''
            } ${className}`}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 p-1.5 text-auth-textMuted hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none rounded-md"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error ? (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-auth-textSecondary dark:text-auth-darkTextSecondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

AuthPasswordField.displayName = 'AuthPasswordField';
