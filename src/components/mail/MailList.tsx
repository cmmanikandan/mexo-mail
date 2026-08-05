import React from 'react';
import { Message } from '../../types/mail';
import { MailRow } from './MailRow';
import { MailToolbar } from './MailToolbar';
import { MexoEmptyState } from '../common/MexoEmptyState';
import { useMailStore } from '../../store/mailStore';
import { db } from '../../services/db';

export interface MailListProps {
  messages: Message[];
}

export const MailList: React.FC<MailListProps> = ({ messages }) => {
  const { selectedMessageIds, currentFolder } = useMailStore();

  const visibleIds = messages.map((m) => m.id);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <MailToolbar totalCount={0} allVisibleIds={[]} />
        <MexoEmptyState folder={currentFolder} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      <MailToolbar totalCount={messages.length} allVisibleIds={visibleIds} />
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
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
