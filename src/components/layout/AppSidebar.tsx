import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useMailStore, MailFolder } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { CreateLabelModal } from '../labels/CreateLabelModal';
import { db } from '../../services/db';
import { Label } from '../../types/mail';
import {
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
  MoreVertical,
  Edit2,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const AppSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { isSidebarExpanded, addToast } = useUIStore();
  const { currentFolder, activeLabelId, setCurrentFolder, lastUpdated } = useMailStore();
  const { openCompose } = useComposeStore();

  const [isMoreExpanded, setIsMoreExpanded] = useState(false);

  // Label Modal States
  const [isCreateLabelOpen, setIsCreateLabelOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [nestParentId, setNestParentId] = useState<string | undefined>(undefined);

  // Read live labels from persistent DB
  const [labels, setLabels] = useState<Label[]>(db.getLabels());
  const currentUser = db.getCurrentUser();
  const userEmail = currentUser?.email || 'manikandanprabhu1221@mexo.com';

  const refreshLabels = () => {
    setLabels(db.getLabels());
  };

  const { unreadInboxCount, draftCount } = React.useMemo(() => {
    const msgs = db.getMessagesForUser(userEmail);
    const now = Date.now();
    const unread = msgs.filter((m) => {
      const st = m.userState;
      const isSnoozedActive = st.snoozedUntil ? new Date(st.snoozedUntil).getTime() > now : false;
      return !st.isRead && !st.isArchived && !st.isDeleted && !st.isSpam && !isSnoozedActive;
    }).length;
    const drafts = db.getDraftsForUser(userEmail);
    return { unreadInboxCount: unread, draftCount: drafts.length };
  }, [userEmail, lastUpdated, labels]);

  // Auto-expand "More" section if active route is under More items
  useEffect(() => {
    const isMoreRoute = ['all', 'spam', 'trash'].some(
      (f) => path.includes(`/mail/${f}`) || (currentFolder === f && path.startsWith('/mail'))
    );
    if (isMoreRoute) {
      setIsMoreExpanded(true);
    }
  }, [path, currentFolder]);



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

  const handleFolderClick = (folder: MailFolder) => {
    setCurrentFolder(folder);
    navigate(`/mail/${folder}`);
  };

  const handleLabelClick = (labelId: string) => {
    setCurrentFolder('inbox', labelId, undefined);
    navigate(`/mail/inbox`);
  };

  const handleDeleteLabel = (labelId: string, labelName: string) => {
    db.deleteLabel(labelId);
    refreshLabels();
    addToast({ message: `Label "${labelName}" deleted.`, type: 'info' });
  };

  // Separate top-level labels and nested sub-labels
  const topLevelLabels = labels.filter((l) => !l.parentLabelId);

  return (
    <aside
      className={`h-[calc(100vh-64px)] border-r border-app-border bg-gradient-to-b from-[#F8FAFD] via-[#F3F7FC] to-[#EEF4FD] dark:from-[#0D1117] dark:via-[#141A23] dark:to-[#0F172A] flex flex-col justify-between transition-all duration-200 select-none z-20 ${
        isSidebarExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-3 overflow-y-auto overflow-x-hidden flex-1">
        {/* Primary + Compose Button */}
        <div className="mb-4">
          <button
            onClick={() => openCompose()}
            className={`flex items-center justify-center font-bold text-white bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 active:scale-95 rounded-2xl shadow-md shadow-indigo-500/30 border border-indigo-400/30 transition-all cursor-pointer select-none ${
              isSidebarExpanded ? 'w-full py-3 px-4 text-sm' : 'w-12 h-12 mx-auto'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            {isSidebarExpanded && <span className="ml-2.5">Compose</span>}
          </button>
        </div>

        {/* Core Folders */}
        <nav className="space-y-1">
          {mainFolderItems.map((item) => {
            const isActive = isFolderActive(item.folder);
            return (
              <button
                key={item.folder}
                onClick={() => handleFolderClick(item.folder)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/60 dark:text-indigo-300 font-extrabold shadow-xs'
                    : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                } ${!isSidebarExpanded ? 'justify-center px-0' : ''}`}
                title={!isSidebarExpanded ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-app-muted'}>
                    {item.icon}
                  </span>
                  {isSidebarExpanded && <span>{item.label}</span>}
                </div>
                {isSidebarExpanded && item.count !== undefined && item.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[11px] rounded-full ${
                      isActive
                        ? 'bg-[#7C3AED] text-white font-extrabold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          {/* More expandable */}
          <div>
            <button
              onClick={() => setIsMoreExpanded(!isMoreExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 ${
                !isSidebarExpanded ? 'justify-center' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                {isMoreExpanded ? <ChevronDown className="w-4 h-4 text-app-muted" /> : <ChevronRight className="w-4 h-4 text-app-muted" />}
                {isSidebarExpanded && <span>More</span>}
              </div>
            </button>

            {isMoreExpanded && (
              <div className="ml-2 pl-2 border-l border-app-border space-y-1 mt-1">
                {moreFolderItems.map((item) => {
                  const isActive = isFolderActive(item.folder);
                  return (
                    <button
                      key={item.folder}
                      onClick={() => handleFolderClick(item.folder)}
                      className={`w-full flex items-center px-3 py-2 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-[#E8F1FF] text-[#0B57D0] dark:bg-blue-950/80 dark:text-blue-400 font-extrabold shadow-xs'
                          : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                      }`}
                    >
                      <span className={`mr-3 ${isActive ? 'text-[#0B57D0] dark:text-blue-400 font-bold' : 'text-app-muted'}`}>
                        {item.icon}
                      </span>
                      {isSidebarExpanded && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* LABELS Section */}
        {isSidebarExpanded && (
          <div className="mt-6 pt-4 border-t border-app-border">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-app-muted">
                LABELS
              </span>
              <button
                onClick={() => {
                  setEditingLabel(null);
                  setNestParentId(undefined);
                  setIsCreateLabelOpen(true);
                }}
                className="p-1 rounded-lg text-app-muted hover:text-app-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Create new label"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {topLevelLabels.map((lbl) => {
                const isActive = activeLabelId === lbl.id;
                const childLabels = labels.filter((l) => l.parentLabelId === lbl.id);

                return (
                  <div key={lbl.id} className="space-y-1">
                    <div
                      className={`group/lbl relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                        isActive
                          ? 'bg-[#E8F1FF] text-[#0B57D0] dark:bg-blue-950/80 dark:text-blue-400 font-extrabold shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
                      }`}
                    >
                      <button
                        onClick={() => handleLabelClick(lbl.id)}
                        className="flex-1 flex items-center space-x-2.5 text-left truncate"
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lbl.color || '#0878e8' }} />
                        <span className={`truncate ${isActive ? 'text-[#0B57D0] dark:text-blue-400' : 'text-app-heading'}`}>
                          {lbl.name}
                        </span>
                      </button>

                      {/* Hover ⋮ Context Menu */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="opacity-0 group-hover/lbl:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-app-muted">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="w-44 bg-white dark:bg-slate-900 rounded-xl shadow-mexo-popover border border-app-border p-1 z-50 text-xs font-medium"
                            align="end"
                          >
                            <DropdownMenu.Item
                              onClick={() => {
                                setEditingLabel(lbl);
                                setIsCreateLabelOpen(true);
                              }}
                              className="flex items-center px-3 py-2 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-app-muted" />
                              Rename / Edit
                            </DropdownMenu.Item>

                            <DropdownMenu.Item
                              onClick={() => {
                                setEditingLabel(null);
                                setNestParentId(lbl.id);
                                setIsCreateLabelOpen(true);
                              }}
                              className="flex items-center px-3 py-2 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
                            >
                              <Plus className="w-3.5 h-3.5 mr-2 text-app-muted" />
                              Add Sublabel
                            </DropdownMenu.Item>

                            <DropdownMenu.Separator className="h-px bg-app-border my-1" />

                            <DropdownMenu.Item
                              onClick={() => handleDeleteLabel(lbl.id, lbl.name)}
                              className="flex items-center px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer outline-none font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-500" />
                              Delete Label
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>

                    {/* Child nested sublabels */}
                    {childLabels.length > 0 && (
                      <div className="ml-4 pl-2 border-l border-app-border space-y-1">
                        {childLabels.map((child) => {
                          const isChildActive = activeLabelId === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleLabelClick(child.id)}
                              className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isChildActive
                                  ? 'bg-[#E8F1FF] text-[#0B57D0] dark:bg-blue-950/80 dark:text-blue-400 font-extrabold shadow-xs'
                                  : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: child.color || '#0878e8' }} />
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation: Contacts */}
      <div className="p-3 border-t border-app-border space-y-1">
        <button
          onClick={() => navigate('/contacts')}
          className={`w-full flex items-center px-3 py-2.5 rounded-2xl text-xs transition-colors ${
            isContactsActive
              ? 'bg-[#E8F1FF] text-[#0B57D0] dark:bg-blue-950/80 dark:text-blue-400 font-extrabold shadow-xs'
              : 'text-app-body hover:bg-slate-100 dark:hover:bg-slate-800/70 font-semibold'
          } ${!isSidebarExpanded ? 'justify-center' : ''}`}
          title="Contacts"
        >
          <BookOpen className={`w-4 h-4 ${isContactsActive ? 'text-[#0B57D0] dark:text-blue-400 font-bold' : 'text-app-muted'}`} />
          {isSidebarExpanded && <span className="ml-3">Contacts</span>}
        </button>
      </div>

      {/* Create / Edit Label Modal */}
      <CreateLabelModal
        isOpen={isCreateLabelOpen}
        onClose={() => setIsCreateLabelOpen(false)}
        initialParentId={nestParentId}
        editingLabel={editingLabel}
        onSaveSuccess={refreshLabels}
      />
    </aside>
  );
};
