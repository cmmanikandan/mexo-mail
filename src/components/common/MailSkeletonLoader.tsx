import React from 'react';

export interface MailSkeletonLoaderProps {
  count?: number;
}

export const MailSkeletonLoader: React.FC<MailSkeletonLoaderProps> = ({ count = 6 }) => {
  return (
    <div className="divide-y divide-app-border animate-pulse select-none" aria-label="Loading messages...">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex items-center px-4 py-3.5 space-x-3 bg-white dark:bg-slate-900/50">
          {/* Avatar Skeleton */}
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

          {/* Text Content Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-32" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-14" />
            </div>
            <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
