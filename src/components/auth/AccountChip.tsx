import React from 'react';
import { MexoAvatar } from '../common/MexoAvatar';
import { ChevronDown } from 'lucide-react';

export interface AccountChipProps {
  email: string;
  name?: string;
  avatarUrl?: string;
  onClickChange?: () => void;
}

export const AccountChip: React.FC<AccountChipProps> = ({
  email,
  name,
  avatarUrl,
  onClickChange,
}) => {
  return (
    <div
      onClick={onClickChange}
      className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none mb-6"
    >
      <MexoAvatar name={name || email} src={avatarUrl} size="xs" />
      <span className="text-xs font-semibold">{email}</span>
      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
    </div>
  );
};
