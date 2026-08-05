import React, { useEffect, useRef } from 'react';
import { Mail, X } from 'lucide-react';
import { useMailToastStore, MailToastItem } from '../../store/mailToastStore';
import { useMailStore } from '../../store/mailStore';
import { useNavigate } from 'react-router-dom';

interface ToastCardProps {
  toast: MailToastItem;
  index: number;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, index }) => {
  const { dismissToast } = useMailToastStore();
  const { setCurrentFolder } = useMailStore();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    // Animate in on mount
    const t = setTimeout(() => setIsVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClick = () => {
    setCurrentFolder('inbox');
    navigate('/mail/inbox');
    dismissToast(toast.id);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => dismissToast(toast.id), 300);
  };

  return (
    <div
      onClick={handleClick}
      style={{ bottom: `${20 + index * 84}px` }}
      className={`
        fixed right-4 z-[9999] w-80 cursor-pointer
        transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="
        flex items-start space-x-3 p-3.5
        bg-white dark:bg-slate-800
        border border-slate-200 dark:border-slate-700
        rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60
        hover:shadow-2xl hover:scale-[1.02]
        transition-all duration-200
      ">
        {/* Pulse dot + icon */}
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0878e8] to-[#0551a8] flex items-center justify-center shadow-sm">
            <Mail className="w-4 h-4 text-white" />
          </div>
          {/* Live pulse ring */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0878e8] opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0878e8]" />
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[11px] font-semibold text-[#0878e8] uppercase tracking-wide">New Mail</p>
            <button
              onClick={handleDismiss}
              className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{toast.senderName}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{toast.subject}</p>
        </div>
      </div>
    </div>
  );
};

export const MailNotificationToast: React.FC = () => {
  const { toasts } = useMailToastStore();

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Only show the latest 3 toasts */}
      {toasts.slice(-3).map((toast, i) => (
        <ToastCard key={toast.id} toast={toast} index={i} />
      ))}
    </>
  );
};
