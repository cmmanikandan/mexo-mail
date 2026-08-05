import React, { useRef, useState } from 'react';

export interface AuthOtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

export const AuthOtpInput: React.FC<AuthOtpInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      // Clear digit
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    const char = val[val.length - 1]; // Get last typed char
    if (/[0-9]/.test(char)) {
      const newDigits = [...digits];
      newDigits[index] = char;
      onChange(newDigits.join(''));

      // Auto-advance to next box
      if (index < length - 1 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="w-full text-center space-y-2">
      <div className="flex items-center justify-center space-x-2 sm:space-x-3">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 sm:w-14 sm:h-14 text-center text-xl font-bold rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none transition-all ${
              error
                ? 'border-rose-600 ring-1 ring-rose-600'
                : 'border-slate-300 dark:border-slate-700 focus:border-mexo-600 focus:ring-2 focus:ring-mexo-500/20'
            }`}
          />
        ))}
      </div>
      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">{error}</p>}
    </div>
  );
};
