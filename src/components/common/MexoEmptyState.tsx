import React from 'react';
import { Mail, Star, Clock, AlertCircle, Trash2, ShieldAlert, Edit3, Send, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useComposeStore } from '../../store/composeStore';

export interface MexoEmptyStateProps {
  folder?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const MexoEmptyState: React.FC<MexoEmptyStateProps> = ({
  folder = 'inbox',
  title,
  description,
  action,
}) => {
  const { currentUser } = useAuthStore();
  const { openCompose } = useComposeStore();

  const getIcon = () => {
    switch (folder) {
      case 'starred':
        return <Star className="w-8 h-8 text-amber-400 fill-amber-400" />;
      case 'snoozed':
        return <Clock className="w-8 h-8 text-app-primary" />;
      case 'important':
        return <AlertCircle className="w-8 h-8 text-app-primary" />;
      case 'sent':
        return <Send className="w-8 h-8 text-app-primary" />;
      case 'scheduled':
        return <Calendar className="w-8 h-8 text-app-primary" />;
      case 'trash':
        return <Trash2 className="w-8 h-8 text-app-muted" />;
      case 'spam':
        return <ShieldAlert className="w-8 h-8 text-rose-500" />;
      default:
        return <Mail className="w-8 h-8 text-app-primary" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (folder) {
      case 'starred':
        return 'No starred messages';
      case 'snoozed':
        return 'No snoozed messages';
      case 'important':
        return 'No important messages';
      case 'drafts':
        return 'No drafts saved';
      case 'sent':
        return 'No sent messages';
      case 'scheduled':
        return 'No scheduled messages';
      case 'spam':
        return 'Hooray! No spam messages';
      case 'trash':
        return 'Trash is empty';
      case 'search':
        return 'No messages found';
      default:
        return 'No messages';
    }
  };

  const getDescription = () => {
    if (description) return description;
    switch (folder) {
      case 'starred':
        return 'Messages you star will appear here for quick access.';
      case 'snoozed':
        return 'Messages you snooze will return to your inbox at your designated time.';
      case 'drafts':
        return 'Messages you start writing and save for later will appear here.';
      case 'sent':
        return 'Messages you send to others will appear here.';
      case 'scheduled':
        return 'Messages scheduled for later delivery will appear here.';
      case 'search':
        return 'Try checking for spelling errors or adjusting search terms.';
      case 'trash':
        return 'Items in trash will automatically be permanently deleted.';
      case 'inbox':
      default:
        return `Messages sent to ${currentUser?.email || 'your account'} will appear here.`;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
      <div className="w-14 h-14 rounded-2xl bg-app-softBrandSurface dark:bg-slate-800 flex items-center justify-center mb-3.5 shadow-sm">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-app-heading mb-1">{getTitle()}</h3>
      <p className="text-xs text-app-body max-w-sm mb-5 font-normal">{getDescription()}</p>
      {action || (
        <button
          type="button"
          onClick={() => openCompose()}
          className="px-4 py-2 bg-app-primary hover:bg-app-primaryHover text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-2"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Compose message</span>
        </button>
      )}
    </div>
  );
};
