import React from 'react';

export const MexoSkeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} />;
};

export const MexoMailRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-x-4 animate-pulse">
      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
      <div className="w-32 h-4 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="w-16 h-3 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
};
