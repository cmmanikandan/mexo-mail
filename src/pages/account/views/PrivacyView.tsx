import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { Eye, ShieldCheck, UserCheck, Lock, BellRing } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [discoveryEnabled, setDiscoveryEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [activitySyncEnabled, setActivitySyncEnabled] = useState(true);

  const handleToggleDiscovery = () => {
    const nextState = !discoveryEnabled;
    setDiscoveryEnabled(nextState);
    addToast({
      message: nextState ? 'Contact discovery enabled.' : 'Contact discovery disabled.',
      type: 'info',
    });
  };

  const handleToggleReadReceipts = () => {
    const nextState = !readReceiptsEnabled;
    setReadReceiptsEnabled(nextState);
    addToast({
      message: nextState ? 'Read receipts enabled.' : 'Read receipts disabled.',
      type: 'info',
    });
  };

  const handleToggleSync = () => {
    const nextState = !activitySyncEnabled;
    setActivitySyncEnabled(nextState);
    addToast({
      message: nextState ? 'Cross-app activity sync enabled.' : 'Cross-app activity sync disabled.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" /> Data & Privacy Controls
          </h2>
          <p className="text-xs text-app-body mt-1">
            Manage your account privacy preferences, discovery settings, and activity data across the MEXO platform.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Contact Discovery Switch */}
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="space-y-1">
              <h4 className="font-bold text-app-heading flex items-center">
                <UserCheck className="w-4 h-4 text-purple-500 mr-1.5" /> MEXO Contact Discovery
              </h4>
              <p className="text-[11px] text-app-muted">
                Allow other MEXO Mail & MEXO Forms users to discover your address ({currentUser?.email}) when sending emails.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={discoveryEnabled}
                onChange={handleToggleDiscovery}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {/* Email Read Receipts Switch */}
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-app-heading flex items-center">
                <BellRing className="w-4 h-4 text-sky-500 mr-1.5" /> Read Receipts & Activity Signals
              </h4>
              <p className="text-[11px] text-app-muted">
                Send read confirmation status when opening internal MEXO ecosystem emails.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={readReceiptsEnabled}
                onChange={handleToggleReadReceipts}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {/* Cross-App Ecosystem Sync Switch */}
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-app-heading flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" /> Ecosystem Activity Sync
              </h4>
              <p className="text-[11px] text-app-muted">
                Synchronize email notifications and form submission alerts between MEXO Mail and MEXO Forms.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={activitySyncEnabled}
                onChange={handleToggleSync}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>
        </div>

        {/* Informational Explanation */}
        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 space-y-1">
          <p className="font-bold flex items-center">
            <Lock className="w-4 h-4 mr-1.5 text-purple-600 dark:text-purple-400" /> Data Isolation & Privacy Policy
          </p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300">
            MEXO Mail does not sell or share personal email contents or document attachment data with third parties. Your data remains protected by Supabase security policies.
          </p>
        </div>
      </div>
    </div>
  );
};
