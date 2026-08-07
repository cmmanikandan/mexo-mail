import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { MexoButton } from '../../../components/common/MexoButton';
import { Monitor, Smartphone, Globe, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DevicesSessionsView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Chrome on Windows 11',
      browser: 'Chrome 122.0 / Desktop',
      location: 'Local Web Session',
      lastActive: 'Active Now (Current Device)',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'MEXO PWA Mobile Client',
      browser: 'Safari / iOS App Container',
      location: 'Mobile Device',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  const handleSignOutOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    addToast({ message: 'Signed out all other devices and active browser sessions.', type: 'success' });
  };

  const handleSignOutSingleSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    addToast({ message: 'Session signed out.', type: 'info' });
  };

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-app-heading flex items-center">
              <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" /> Devices & Sessions
            </h2>
            <p className="text-xs text-app-body mt-1">
              Devices and applications currently signed into your MEXO identity account.
            </p>
          </div>
          <MexoButton onClick={handleSignOutOtherSessions} variant="outline" size="sm">
            <LogOut className="w-3.5 h-3.5 mr-1 text-rose-500" /> Sign Out All Other Devices
          </MexoButton>
        </div>
      </div>

      {/* Current Device Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-3">
        <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Current Device</h3>

        {sessions.filter((s) => s.isCurrent).map((current) => (
          <div
            key={current.id}
            className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-4"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-app-heading flex items-center">
                  {current.device}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Current Device
                  </span>
                </h4>
                <p className="text-xs text-app-muted mt-0.5">{current.browser} • {current.location}</p>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">{current.lastActive}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Other Sessions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-4">
        <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Other Active Sessions</h3>

        {sessions.filter((s) => !s.isCurrent).length === 0 ? (
          <p className="text-xs text-app-muted py-2 italic">No other active devices or sessions.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.filter((s) => !s.isCurrent).map((sess) => (
              <div key={sess.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-app-heading">{sess.device}</h5>
                    <p className="text-[11px] text-app-muted mt-0.5">{sess.browser} • Last active {sess.lastActive}</p>
                  </div>
                </div>

                <MexoButton
                  onClick={() => handleSignOutSingleSession(sess.id)}
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                >
                  Sign out
                </MexoButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
