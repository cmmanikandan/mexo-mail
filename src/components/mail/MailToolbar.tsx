import React from 'react';
import { useMailStore } from '../../store/mailStore';
import { db } from '../../services/db';
import {
  RotateCw,
  Archive,
  Trash2,
  ShieldAlert,
  Mail,
  MailOpen,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArchiveRestore,
  RotateCcw,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface MailToolbarProps {
  totalCount: number;
  allVisibleIds: string[];
}

export const MailToolbar: React.FC<MailToolbarProps> = ({ totalCount, allVisibleIds }) => {
  const {
    selectedMessageIds,
    selectAllMessages,
    clearSelection,
    archiveMessages,
    unarchiveMessages,
    deleteMessages,
    restoreFromTrash,
    permanentlyDeleteMessages,
    markSpam,
    markAsRead,
    snoozeMessages,
    applyLabelToMessages,
    emptyTrash,
    currentFolder,
  } = useMailStore();

  const labels = db.getLabels();
  const isAllSelected = allVisibleIds.length > 0 && selectedMessageIds.length === allVisibleIds.length;
  const isSomeSelected = selectedMessageIds.length > 0 && !isAllSelected;

  const handleMasterCheckboxToggle = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllMessages(allVisibleIds);
    }
  };

  return (
    <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between select-none">
      {/* Left Selection & Bulk Action Bar */}
      <div className="flex items-center space-x-2">
        {/* Master Select Dropdown */}
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isSomeSelected;
            }}
            onChange={handleMasterCheckboxToggle}
            className="w-4 h-4 rounded text-mexo-600 focus:ring-mexo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={() => window.location.reload()}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Inbox"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Bulk Action Buttons (Visible when messages selected) */}
        {selectedMessageIds.length > 0 && (
          <div className="flex items-center space-x-1 pl-2 border-l border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
            {currentFolder === 'trash' ? (
              // Trash folder: show Restore + Permanent Delete
              <>
                <button
                  onClick={() => restoreFromTrash(selectedMessageIds)}
                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center space-x-1"
                  title="Restore to Inbox"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => permanentlyDeleteMessages(selectedMessageIds)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Delete Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              // All other folders: Archive/Unarchive, Spam, Delete
              <>
                {currentFolder === 'archive' ? (
                  <button
                    onClick={() => unarchiveMessages(selectedMessageIds)}
                    className="p-1.5 rounded-lg text-[#0878e8] hover:bg-blue-50 dark:hover:bg-slate-800"
                    title="Unarchive (Move to Inbox)"
                  >
                    <ArchiveRestore className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => archiveMessages(selectedMessageIds)}
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Archive selected"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => markSpam(selectedMessageIds, true)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Report Spam"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>

                <button
                  onClick={() => deleteMessages(selectedMessageIds)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Move to Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <button
              onClick={() => markAsRead(selectedMessageIds, true)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Mark as Read"
            >
              <MailOpen className="w-4 h-4" />
            </button>

            <button
              onClick={() => snoozeMessages(selectedMessageIds, new Date(Date.now() + 24 * 3600 * 1000).toISOString())}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Snooze"
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Label Picker Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="p-1.5 rounded-lg text-app-body hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Apply Label"
                >
                  <Tag className="w-4 h-4 text-app-primary" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-mexo-popover border border-app-border p-2 z-50 animate-in fade-in duration-150"
                  align="start"
                >
                  <div className="px-2 py-1.5 text-[11px] font-extrabold uppercase text-app-muted tracking-wider">
                    Label selected as:
                  </div>

                  <div className="space-y-0.5 my-1 max-h-56 overflow-y-auto">
                    {labels.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-app-muted text-center">
                        No labels yet — create one from the sidebar
                      </div>
                    ) : (
                      labels.map((lbl) => {
                        // Check if ALL selected messages have this label
                        const allMessages = db.getMessages();
                        const selectedMsgs = allMessages.filter((m) => selectedMessageIds.includes(m.id));
                        const allHaveLabel = selectedMsgs.length > 0 && selectedMsgs.every((m) =>
                          (m.userState.labels || []).includes(lbl.id)
                        );
                        const someHaveLabel = selectedMsgs.some((m) =>
                          (m.userState.labels || []).includes(lbl.id)
                        );

                        return (
                          <DropdownMenu.Item
                            key={lbl.id}
                            onClick={() => applyLabelToMessages(selectedMessageIds, lbl.id)}
                            className="flex items-center px-2.5 py-2 text-xs text-app-heading font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2.5"
                              style={{ backgroundColor: lbl.color || '#0878e8' }}
                            />
                            <span className="flex-1 truncate">{lbl.name}</span>
                            {allHaveLabel && (
                              <span className="ml-2 text-[#0878e8] font-bold text-[10px]">✓</span>
                            )}
                            {someHaveLabel && !allHaveLabel && (
                              <span className="ml-2 text-slate-400 font-bold text-[10px]">–</span>
                            )}
                          </DropdownMenu.Item>
                        );
                      })
                    )}
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}

        {/* Empty Trash Button if inside Trash folder */}
        {currentFolder === 'trash' && totalCount > 0 && (
          <button
            onClick={() => emptyTrash()}
            className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
          >
            Empty Trash Now
          </button>
        )}
      </div>

      {/* Right Pagination Info */}
      <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
        <span>
          {totalCount === 0 ? '0 of 0' : `1–${totalCount > 50 ? 50 : totalCount} of ${totalCount}`}
        </span>
        <div className="flex items-center space-x-1">
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40" disabled={totalCount <= 50}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
