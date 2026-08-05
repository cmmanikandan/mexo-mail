import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useMailStore, MailFolder } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { db } from '../../services/db';
import {
  X,
  Plus,
  Inbox,
  Star,
  Clock,
  Bookmark,
  Send,
  Calendar,
  FileText,
  Archive,
  ChevronDown,
  ChevronRight,
  Mail,
  ShieldAlert,
  Trash2,
  BookOpen,
  Settings,
} from 'lucide-react';

export const MobileMailDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { isMobileDrawerOpen, setMobileDrawerOpen } = useUIStore();
  const { currentFolder, activeLabelId, setCurrentFolder, lastUpdated } = useMailStore();
  const { openCompose } = useComposeStore();

  const [isMoreExpanded, setIsMoreExpanded] = useState(false);
  const labels = db.getLabels();
  const currentUser = db.getCurrentUser();

  const { unreadInboxCount, draftCount } = React.useMemo(() => {
    const msgs = db.getMessagesForUser(currentUser.email);
    const unread = msgs.filter(
      (m) => !m.userState.isRead && !m.userState.isArchived && !m.userState.isDeleted && !m.userState.isSpam
    ).length;
    const drafts = db.getDraftsForUser(currentUser.email).length;
    return { unreadInboxCount: unread, draftCount: drafts };
  }, [currentUser.email, lastUpdated, labels]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Auto-expand "More" section if active route is under More items
  useEffect(() => {
    const isMoreRoute = ['all', 'spam', 'trash'].some(
      (f) => path.includes(`/mail/${f}`) || (currentFolder === f && path.startsWith('/mail'))
    );
    if (isMoreRoute) {
      setIsMoreExpanded(true);
    }
  }, [path, currentFolder]);

  if (!isMobileDrawerOpen) return null;

  const mainFolderItems: { folder: MailFolder; label: string; icon: React.ReactNode; count?: number }[] = [
    { folder: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, count: unreadInboxCount },
    { folder: 'starred', label: 'Starred', icon: <Star className="w-4 h-4" /> },
    { folder: 'snoozed', label: 'Snoozed', icon: <Clock className="w-4 h-4" /> },
    { folder: 'important', label: 'Important', icon: <Bookmark className="w-4 h-4" /> },
    { folder: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" /> },
    { folder: 'scheduled', label: 'Scheduled', icon: <Calendar className="w-4 h-4" /> },
    { folder: 'drafts', label: 'Drafts', icon: <FileText className="w-4 h-4" />, count: draftCount },
    { folder: 'archive', label: 'Archive', icon: <Archive className="w-4 h-4" /> },
  ];

  const moreFolderItems: { folder: MailFolder; label: string; icon: React.ReactNode }[] = [
    { folder: 'all', label: 'All Mail', icon: <Mail className="w-4 h-4" /> },
    { folder: 'spam', label: 'Spam', icon: <ShieldAlert className="w-4 h-4" /> },
    { folder: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
  ];

  const isFolderActive = (folder: MailFolder) => {
    if (activeLabelId) return false;
    return path.includes(`/mail/${folder}`) || (currentFolder === folder && path.startsWith('/mail'));
  };

  const isContactsActive = path.startsWith('/contacts');
  const isSettingsActive = path.startsWith('/settings');

  const handleNavClick = (folder: MailFolder) => {
    setCurrentFolder(folder);
    setMobileDrawerOpen(false);
    navigate(`/mail/${folder}`);
  };

  const handleLabelClick = (labelId: string) => {
    setCurrentFolder('inbox', labelId, undefined);
    setMobileDrawerOpen(false);
    navigate(`/mail/inbox`);
  };

  const handleComposeClick = () => {
    setMobileDrawerOpen(false);
    openCompose();
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none md:hidden font-sans text-slate-900 dark:text-slate-100">
      {/* Dark Translucent Backdrop */}
      <div
        onClick={() => setMobileDrawerOpen(false)}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Slide-in Drawer Container */}
      <aside className="relative w-[min(82vw,290px)] h-full bg-white dark:bg-slate-900 border-r border-app-border flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="p-3.5 overflow-y-auto flex-1 space-y-3.5">
          {/* Drawer Top Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-app-border">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="MEXO Mail" className="w-6 h-6 object-contain" />
              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
                MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-base ml-1">Mail</span>
              </span>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1 rounded-xl text-app-muted hover:text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Compose Button */}
          <button
            onClick={handleComposeClick}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 active:scale-98 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/30 transition-all cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Compose</span>
          </button>

          {/* Main Navigation Folders */}
          <nav className="space-y-0.5">
            {mainFolderItems.map((item) => {
              const isActive = isFolderActive(item.folder);
              return (
                <button
                  key={item.folder}
                  onClick={() => handleNavClick(item.folder)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
                      : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={isActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-app-muted'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full ${
                        isActive
                          ? 'bg-[#7C3AED] text-white font-extrabold'
                          : 'bg-indigo-100 dark:bg-indigo-900/60 text-[#7C3AED] dark:text-indigo-300 font-bold'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* More Expandable */}
            <div>
              <button
                onClick={() => setIsMoreExpanded(!isMoreExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70"
              >
                <div className="flex items-center space-x-2.5">
                  {isMoreExpanded ? <ChevronDown className="w-4 h-4 text-app-muted" /> : <ChevronRight className="w-4 h-4 text-app-muted" />}
                  <span>More</span>
                </div>
              </button>

              {isMoreExpanded && (
                <div className="ml-3 pl-2 border-l border-app-border space-y-0.5 mt-0.5">
                  {moreFolderItems.map((item) => {
                    const isActive = isFolderActive(item.folder);
                    return (
                      <button
                        key={item.folder}
                        onClick={() => handleNavClick(item.folder)}
                        className={`w-full flex items-center px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
                            : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                        }`}
                      >
                        <span className={`mr-2.5 ${isActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-app-muted'}`}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* LABELS Section */}
          <div className="pt-2.5 border-t border-app-border">
            <div className="px-3 mb-1.5 text-[10px] font-extrabold tracking-wider uppercase text-app-muted">
              LABELS
            </div>
            <div className="space-y-0.5">
              {labels.map((lbl) => {
                const isActive = activeLabelId === lbl.id;
                return (
                  <button
                    key={lbl.id}
                    onClick={() => handleLabelClick(lbl.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
                        : 'text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lbl.color || '#7C3AED' }} />
                    <span className="truncate">{lbl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Links: Contacts & Settings */}
        <div className="p-3 border-t border-app-border space-y-0.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              setMobileDrawerOpen(false);
              navigate('/contacts');
            }}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs transition-colors ${
              isContactsActive
                ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
                : 'text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
            }`}
          >
            <BookOpen className={`w-4 h-4 mr-2.5 ${isContactsActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-app-muted'}`} />
            <span>Contacts</span>
          </button>
          <button
            onClick={() => {
              setMobileDrawerOpen(false);
              navigate('/settings');
            }}
            className={`w-full flex items-center px-3 py-2 rounded-xl text-xs transition-colors ${
              isSettingsActive
                ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold shadow-xs'
                : 'text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
            }`}
          >
            <Settings className={`w-4 h-4 mr-2.5 ${isSettingsActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-app-muted'}`} />
            <span>Settings</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
