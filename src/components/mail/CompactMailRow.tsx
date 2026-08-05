import React from 'react';
import { Message, Label } from '../../types/mail';
import { db } from '../../services/db';
import { Star, Bookmark, Paperclip, Archive, Trash2, Mail, MailOpen } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export interface CompactMailRowProps {
  message: Message;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onToggleStar: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  onClick: (message: Message) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleRead?: (id: string) => void;
}

export const CompactMailRow: React.FC<CompactMailRowProps> = ({
  message,
  isSelected,
  onSelect,
  onToggleStar,
  onToggleImportant,
  onClick,
  onArchive,
  onDelete,
  onToggleRead,
}) => {
  const isUnread = !message.userState.isRead;
  const isStarred = message.userState.isStarred;
  const isImportant = message.userState.isImportant;

  const formattedDate = () => {
    try {
      const date = new Date(message.createdAt);
      const isToday = new Date().toDateString() === date.toDateString();
      return isToday ? format(date, 'h:mm a') : format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => onClick(message)}
      className={`group relative flex items-center h-12 px-3 border-b border-app-border cursor-pointer transition-colors select-none text-xs ${
        isUnread
          ? 'bg-white dark:bg-slate-900 font-bold text-app-heading'
          : 'bg-app-secondarySurface/50 dark:bg-slate-950/40 text-app-body font-normal'
      } ${isSelected ? 'bg-mexo-50/80 dark:bg-mexo-950/60' : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/60'}`}
    >
      {/* Checkbox */}
      <div className="flex items-center space-x-2 mr-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(message.id, e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-mexo-600 focus:ring-mexo-500 cursor-pointer"
        />
        {/* Star */}
        <button
          type="button"
          onClick={() => onToggleStar(message.id)}
          className={`p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors ${
            isStarred ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
        </button>

        {/* Importance Marker */}
        {onToggleImportant && (
          <button
            type="button"
            onClick={() => onToggleImportant(message.id)}
            className={`p-0.5 rounded transition-colors ${
              isImportant ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700 hover:text-slate-500'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 transition-all duration-150 ${isImportant ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        )}
      </div>

      {/* Sender */}
      <div className="w-48 truncate flex-shrink-0 font-medium mr-4">
        {message.senderName || message.senderEmail}
      </div>

      {/* Subject & Snippet + Label Chips */}
      <div className="flex-1 truncate pr-4 flex items-center space-x-2">
        {/* Label Chips */}
        {message.userState.labels && message.userState.labels.length > 0 && (
          <div className="flex items-center space-x-1 flex-shrink-0">
            {message.userState.labels.map((lblId) => {
              const lbl = db.getLabels().find((l: Label) => l.id === lblId);
              if (!lbl) return null;
              return (
                <span
                  key={lbl.id}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md border truncate max-w-[100px]"
                  style={{
                    borderColor: `${lbl.color || '#0878e8'}40`,
                    color: lbl.color || '#0878e8',
                    backgroundColor: `${lbl.color || '#0878e8'}15`,
                  }}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>
        )}
        <span className={isUnread ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-300'}>
          {message.subject || '(No Subject)'}
        </span>
        <span className="text-slate-400 dark:text-slate-500 font-normal truncate">
          - {message.snippet}
        </span>
      </div>

      {/* Attachment icon */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="mr-3 text-slate-400 flex-shrink-0">
          <Paperclip className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Date */}
      <div className="text-right text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 w-16 font-medium group-hover:hidden">
        {formattedDate()}
      </div>

      {/* Quick Action Hover Toolbar */}
      <div
        className="hidden group-hover:flex items-center space-x-1 bg-white dark:bg-slate-900 pl-2 pr-1 shadow-sm flex-shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {onArchive && (
          <button
            type="button"
            onClick={() => onArchive(message.id)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(message.id)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggleRead && (
          <button
            type="button"
            onClick={() => onToggleRead(message.id)}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            title={isUnread ? 'Mark as read' : 'Mark as unread'}
          >
            {isUnread ? <MailOpen className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
