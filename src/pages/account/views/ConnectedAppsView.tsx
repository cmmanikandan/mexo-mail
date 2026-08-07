import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { MexoButton } from '../../../components/common/MexoButton';
import { Grid, Mail, FileText, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

export const ConnectedAppsView: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const apps = [
    {
      id: 'mexo-mail',
      name: 'MEXO Mail',
      status: 'Connected',
      badge: 'Current Application',
      description: 'Intelligent email client & document storage.',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center p-2.5 shadow-md">
          <Mail className="w-full h-full object-contain" />
        </div>
      ),
      lastUsed: 'Active Now',
      permissions: ['Read & Send Emails', 'Storage Access', 'Account Identity'],
    },
    {
      id: 'mexo-forms',
      name: 'MEXO Forms',
      status: 'Connected',
      badge: 'Shared Identity',
      description: 'Smart form builder & submission analytics.',
      icon: (
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center p-2.5 shadow-md">
          <FileText className="w-full h-full object-contain" />
        </div>
      ),
      lastUsed: 'Today at 08:15 AM',
      permissions: ['Form Creations', 'Submission Responses', 'Account Identity'],
    },
  ];

  if (selectedApp) {
    const appInfo = apps.find((a) => a.id === selectedApp);

    return (
      <div className="space-y-6 mx-4 md:mx-0 pb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
          <button
            type="button"
            onClick={() => setSelectedApp(null)}
            className="flex items-center text-xs font-bold text-app-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Connected MEXO Apps
          </button>

          <div className="flex items-center space-x-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            {appInfo?.icon}
            <div>
              <h3 className="text-lg font-extrabold text-app-heading flex items-center">
                {appInfo?.name}
                <span className="ml-2.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {appInfo?.status}
                </span>
              </h3>
              <p className="text-xs text-app-muted mt-0.5">{appInfo?.description}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-app-heading mb-1">Central Identity Session</h4>
              <p className="text-app-muted">
                This app uses central MEXO Supabase authentication. User profile ({currentUser?.email}) is synchronized across MEXO ecosystem apps.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-app-heading mb-2">Access Scope & Permissions</h4>
              <div className="space-y-1.5">
                {appInfo?.permissions.map((perm) => (
                  <div key={perm} className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <MexoButton
                onClick={() => {
                  setSelectedApp(null);
                  addToast({ message: `${appInfo?.name} session access verified.`, type: 'info' });
                }}
                variant="outline"
                size="sm"
              >
                Return to Apps List
              </MexoButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-4 md:mx-0 pb-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-8 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Grid className="w-5 h-5 text-app-primary mr-2" /> Connected MEXO Apps
          </h2>
          <p className="text-xs text-app-body mt-1">
            Applications sharing your central MEXO account identity and ecosystem authorization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-2xl border border-app-border bg-white dark:bg-slate-900/90 shadow-mexo-sm flex flex-col justify-between space-y-4 hover:border-app-primary/40 transition-all"
            >
              <div className="flex items-start space-x-3.5">
                {app.icon}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-app-heading truncate">{app.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-app-muted mt-1 leading-snug">{app.description}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-2">Last used: {app.lastUsed}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <MexoButton onClick={() => setSelectedApp(app.id)} variant="outline" size="sm">
                  Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </MexoButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
