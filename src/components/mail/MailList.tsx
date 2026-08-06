import React from 'react';
import { Message } from '../../types/mail';
import { MailRow } from './MailRow';
import { MailToolbar } from './MailToolbar';
import { MailSkeletonLoader } from '../common/MailSkeletonLoader';
import { MexoEmptyState } from '../common/MexoEmptyState';
import { useMailStore } from '../../store/mailStore';

export interface MailListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const MailList: React.FC<MailListProps> = ({ messages, isLoading = false }) => {
  const { selectedMessageIds, currentFolder } = useMailStore();

  const visibleIds = messages.map((m) => m.id);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        <MailToolbar totalCount={0} allVisibleIds={[]} />
        <div className="flex-1 overflow-y-auto pb-mobile-nav">
          <MailSkeletonLoader count={8} />
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <MailToolbar totalCount={0} allVisibleIds={[]} />
        <MexoEmptyState folder={currentFolder} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      <MailToolbar totalCount={messages.length} allVisibleIds={visibleIds} />
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pb-mobile-nav">
        {messages.map((msg) => (
          <MailRow
            key={msg.id}
            message={msg}
            isSelected={selectedMessageIds.includes(msg.id)}
          />
        ))}
      </div>
    </div>
  );
};
