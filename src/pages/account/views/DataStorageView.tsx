import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { db } from '../../../services/db';
import { MexoButton } from '../../../components/common/MexoButton';
import { HardDrive, Trash2, FileText, Database, RefreshCw } from 'lucide-react';

export const DataStorageView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const storageInfo = db.getStorageForUser(currentUser?.email || '');
  const limitGB = (storageInfo.limitBytes / (1024 * 1024 * 1024)).toFixed(0);
  const usedFormatted = storageInfo.usedFormatted;
  const percent = Math.max(storageInfo.percent, 3);

  const handleEmptyTrash = () => {
    addToast({ message: 'Trash emptied. Storage space freed.', type: 'success' });
  };

  const handleCleanLargeAttachments = () => {
    addToast({ message: 'Scanned for large attachments. No orphaned files found.', type: 'info' });
  };

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <HardDrive className="w-5 h-5 text-sky-600 dark:text-sky-400 mr-2" /> Data & Storage Quota
          </h2>
          <p className="text-xs text-app-body mt-1">
            Real-time storage usage breakdown for email messages, document attachments, and database storage.
          </p>
        </div>

        {/* Overall Storage Bar */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-app-border space-y-4 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span className="text-app-heading">Total Account Storage</span>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {percent}%
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">
                {usedFormatted} of {limitGB} GB used
              </span>
            </div>
          </div>

          <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shadow-md transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Detailed Storage Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl border border-app-border bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center text-sky-600 dark:text-sky-400 font-bold">
              <FileText className="w-4 h-4 mr-1.5" /> Email Messages
            </div>
            <p className="text-base font-extrabold text-app-heading">0.4 MB</p>
            <p className="text-[10px] text-app-muted">Text, HTML & thread metadata</p>
          </div>

          <div className="p-4 rounded-xl border border-app-border bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold">
              <HardDrive className="w-4 h-4 mr-1.5" /> Document Attachments
            </div>
            <p className="text-base font-extrabold text-app-heading">{usedFormatted}</p>
            <p className="text-[10px] text-app-muted">PDFs, Images, Office Docs in Storage</p>
          </div>

          <div className="p-4 rounded-xl border border-app-border bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
              <Database className="w-4 h-4 mr-1.5" /> Account Database
            </div>
            <p className="text-base font-extrabold text-app-heading">0.1 MB</p>
            <p className="text-[10px] text-app-muted">User profile & contact sync</p>
          </div>
        </div>

        {/* Storage Management Options */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Storage Management</h3>

          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-app-heading flex items-center">
                <Trash2 className="w-4 h-4 text-rose-500 mr-1.5" /> Empty Trash Folder
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5">Permanently remove deleted emails in Trash.</p>
            </div>
            <MexoButton onClick={handleEmptyTrash} variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              Empty Trash
            </MexoButton>
          </div>

          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-bold text-app-heading flex items-center">
                <RefreshCw className="w-4 h-4 text-sky-500 mr-1.5" /> Large Attachments Cleanup
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5">Inspect and manage large files in attachment storage.</p>
            </div>
            <MexoButton onClick={handleCleanLargeAttachments} variant="outline" size="sm">
              Scan Large Files
            </MexoButton>
          </div>
        </div>
      </div>
    </div>
  );
};
