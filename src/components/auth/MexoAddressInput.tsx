import React, { useState, forwardRef } from 'react';

export interface MexoAddressInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  suffixDomain?: string;
}

export const MexoAddressInput = forwardRef<HTMLInputElement, MexoAddressInputProps>(
  ({ label = 'Choose your MEXO address', error, helperText, suffixDomain = '@mexo.com', className = '', id, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `addr-${Math.random().toString(36).substring(2, 9)}`;

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
              ? 'border-[#0878e8] ring-1 ring-[#0878e8]'
              : 'border-auth-inputBorder dark:border-auth-darkInputBorder hover:border-auth-inputHover'
          }`}
        >
          {/* Floating Label - Positioned safely with no parent overflow clipping */}
          <label
            htmlFor={inputId}
            className={`absolute left-3.5 pointer-events-none transition-all duration-150 ease-in-out select-none ${
              isLabelFloating
                ? '-top-2.5 text-[11px] font-semibold px-1.5 rounded bg-white dark:bg-auth-darkInputBg z-20 ' +
                  (error ? 'text-rose-600' : isFocused ? 'text-[#0878e8] dark:text-blue-400' : 'text-auth-textSecondary dark:text-auth-darkTextSecondary')
                : 'top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500 font-normal'
            }`}
          >
            {label}
          </label>

          {/* Editable Username Input */}
          <input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`flex-1 h-full bg-transparent text-auth-textPrimary dark:text-auth-darkTextPrimary text-base px-4 border-none outline-none font-normal ${
              isLabelFloating ? 'pt-2' : ''
            } ${className}`}
            {...props}
          />

          {/* Integrated Suffix Box */}
          <div className="h-full px-4 rounded-r-[7px] bg-auth-leftTint dark:bg-slate-800/80 border-l border-auth-separator dark:border-slate-700 text-auth-textSecondary dark:text-slate-300 font-semibold text-base flex items-center select-none flex-shrink-0">
            {suffixDomain}
          </div>
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

MexoAddressInput.displayName = 'MexoAddressInput';
