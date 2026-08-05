import React from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthIndicatorProps {
  password?: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password = '',
  className = '',
}) => {
  if (!password) return null;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteria = [
    { label: '8+ characters', met: hasMinLength },
    { label: 'Uppercase letter (A-Z)', met: hasUppercase },
    { label: 'Lowercase letter (a-z)', met: hasLowercase },
    { label: 'Number (0-9)', met: hasNumber },
    { label: 'Special character (!@#$...)', met: hasSpecial },
  ];

  const passedCount = criteria.filter((c) => c.met).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500';
  let textColor = 'text-rose-600 dark:text-rose-400';
  let badgeBg = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
  let scoreBars = 1;

  if (passedCount <= 2) {
    strengthLabel = 'Weak';
    strengthColor = 'bg-rose-500';
    textColor = 'text-rose-600 dark:text-rose-400';
    badgeBg = 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300';
    scoreBars = 1;
  } else if (passedCount === 3) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-amber-500';
    textColor = 'text-amber-600 dark:text-amber-400';
    badgeBg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300';
    scoreBars = 2;
  } else if (passedCount === 4) {
    strengthLabel = 'Good';
    strengthColor = 'bg-sky-500';
    textColor = 'text-sky-600 dark:text-sky-400';
    badgeBg = 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300';
    scoreBars = 3;
  } else if (passedCount === 5) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-500';
    textColor = 'text-emerald-600 dark:text-emerald-400';
    badgeBg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
    scoreBars = 4;
  }

  return (
    <div className={`space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Password Strength
        </span>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeBg}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Segmented Meter */}
      <div className="grid grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((barIndex) => (
          <div
            key={barIndex}
            className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden transition-all duration-300"
          >
            <div
              className={`h-full transition-all duration-300 ${
                barIndex <= scoreBars ? strengthColor : 'w-0'
              }`}
              style={{ width: barIndex <= scoreBars ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
        {criteria.map((c, idx) => (
          <div key={idx} className="flex items-center space-x-1.5">
            {c.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            )}
            <span
              className={`font-medium ${
                c.met
                  ? 'text-slate-800 dark:text-slate-200 font-semibold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
