import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { MexoButton } from '../../components/common/MexoButton';
import { useUIStore } from '../../store/uiStore';
import { FileCheck2, Shield, Save, Paperclip, Send, AlertTriangle, Trash2 } from 'lucide-react';

export const AdminMailPoliciesPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [maxAttachmentMb, setMaxAttachmentMb] = useState('25');
  const [dailySendLimit, setDailySendLimit] = useState('500');
  const [spamThreshold, setSpamThreshold] = useState('8.5');
  const [trashRetentionDays, setTrashRetentionDays] = useState('30');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({ message: 'System mail policies updated successfully.', type: 'success' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-app-border">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <FileCheck2 className="w-6 h-6 mr-2.5 text-[#7C3AED] dark:text-indigo-400" />
            Platform Mail Policies & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Global delivery quotas, attachment file limits, automatic trash retention, and spam detection sensitivity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Policy 1: Attachment Size */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                <Paperclip className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-extrabold text-sm">Attachment File Limit</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maximum allowed size per individual attachment uploaded or sent.
              </p>
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={maxAttachmentMb}
                    onChange={(e) => setMaxAttachmentMb(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-xs font-bold text-slate-500">MB</span>
                </div>
              </div>
            </div>

            {/* Policy 2: Daily Send Limit */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                <Send className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-extrabold text-sm">Daily Sending Limit</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Maximum outbound email messages permitted per user per 24 hours.
              </p>
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={dailySendLimit}
                    onChange={(e) => setDailySendLimit(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-xs font-bold text-slate-500">Mails</span>
                </div>
              </div>
            </div>

            {/* Policy 3: Spam Detection Sensitivity */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-sm">Spam Sensitivity Score</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Threshold score for auto-tagging inbound emails as Spam.
              </p>
              <div className="pt-2">
                <input
                  type="text"
                  value={spamThreshold}
                  onChange={(e) => setSpamThreshold(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            {/* Policy 4: Trash Retention */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <h3 className="font-extrabold text-sm">Trash & Spam Retention</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Number of days messages remain in Trash before permanent purge.
              </p>
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={trashRetentionDays}
                    onChange={(e) => setTrashRetentionDays(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold outline-none focus:border-[#7C3AED]"
                  />
                  <span className="text-xs font-bold text-slate-500">Days</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <MexoButton type="submit" leftIcon={<Save className="w-4 h-4" />} className="font-bold text-xs px-6 py-2.5">
              Save Policy Rules
            </MexoButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
