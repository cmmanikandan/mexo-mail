import React from 'react';

export interface MexoBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'outline';
  colorHex?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const MexoBadge: React.FC<MexoBadgeProps> = ({
  children,
  variant = 'default',
  colorHex,
  size = 'sm',
  className = '',
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (colorHex) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-md border ${sizeStyles} ${className}`}
        style={{
          backgroundColor: `${colorHex}15`,
          color: colorHex,
          borderColor: `${colorHex}30`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: colorHex }} />
        {children}
      </span>
    );
  }

  const variantStyles = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-mexo-50 dark:bg-mexo-950 text-mexo-700 dark:text-mexo-300 border-mexo-200 dark:border-mexo-800',
    success: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    outline: 'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${sizeStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
