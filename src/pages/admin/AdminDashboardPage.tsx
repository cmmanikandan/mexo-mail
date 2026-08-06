import React, { useRef } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { db } from '../../services/db';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { useUIStore } from '../../store/uiStore';
import {
  Users,
  Mail,
  HardDrive,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Radio,
  Download,
  Upload,
  Database,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = React.useState(db.getUsers());
  const metrics = db.getAdminMetrics();
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let isMounted = true;
    db.syncCloudUsers().then((synced) => {
      if (isMounted && synced) setUsers(synced);
    });
    return () => { isMounted = false; };
  }, []);

  const totalCapacityBytes = 500 * 1024 * 1024 * 1024; // 500 GB
  const usedPercentage = Math.min(
    Math.round((metrics.storageUsedBytes / totalCapacityBytes) * 100),
    100
  );

  const formatStorage = (bytes: number) => {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const topStorageUsers = [...users]
    .sort((a, b) => b.storageUsedBytes - a.storageUsedBytes)
    .slice(0, 4);

  // Handle Database Export
  const handleExportDatabase = () => {
    const jsonString = db.exportDatabase();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `mexo_database_backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ message: 'Database backup downloaded successfully (.JSON)', type: 'success' });
  };

  // Handle Database Restore
  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const result = db.importDatabase(content);
      if (result.success) {
        addToast({ message: result.message, type: 'success' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        addToast({ message: result.message, type: 'error' });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-app-border">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
              <Shield className="w-6 h-6 mr-2.5 text-[#7C3AED] dark:text-indigo-400" />
              System Overview & Metrics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Real-time platform metrics, active directory accounts, database backup, and storage visualizer.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-app-border">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Live Platform Engine Active</span>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Registered Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3 hover:shadow-mexo-md transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Directory Users</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{metrics.totalUsers}</p>
            <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>{metrics.activeUsers} Active Accounts Enrolled</span>
            </div>
          </div>

          {/* Card 2: Delivered Messages */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3 hover:shadow-mexo-md transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Delivered Messages</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0878e8] flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{metrics.messagesToday}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 100% Delivery Success Rate &bull; 0 Failures
            </p>
          </div>

          {/* Card 3: Storage Capacity */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3 hover:shadow-mexo-md transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">System Storage Capacity</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{formatStorage(metrics.storageUsedBytes)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{usedPercentage}% of 500 GB Total Capacity</p>
          </div>
        </div>

        {/* Database Backup & Maintenance Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
                <Database className="w-4 h-4 mr-2 text-[#7C3AED]" /> Database Backup & Disaster Recovery
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Export full system snapshot (users, messages, settings, audit logs) to a JSON file or restore from a previous backup.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <button
                onClick={handleExportDatabase}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs inline-flex items-center space-x-1.5 border border-indigo-200/50 dark:border-indigo-800/40 cursor-pointer shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Backup (.JSON)</span>
              </button>

              <label className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs inline-flex items-center space-x-1.5 border border-app-border cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-[#7C3AED]" />
                <span>Restore Backup (.JSON)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreDatabase}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Storage Infrastructure Visualizer Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
              <HardDrive className="w-4 h-4 mr-2 text-[#7C3AED]" /> Storage Infrastructure Visualizer
            </h2>
            <span className="text-xs font-mono font-extrabold text-[#7C3AED] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/40">
              {formatStorage(metrics.storageUsedBytes)} / 500 GB
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-app-border flex">
              <div
                style={{ width: `${Math.max(usedPercentage, 4)}%` }}
                className="h-full bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] rounded-full transition-all duration-500 shadow-xs"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono font-medium">
              <span>0 GB</span>
              <span>250 GB</span>
              <span>500 GB (Hard Cap)</span>
            </div>
          </div>
        </div>

        {/* Top Storage Consumers Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-2 text-[#7C3AED]" /> Top Storage Consumers
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">4 Accounts</span>
          </div>

          <div className="divide-y divide-app-border text-xs">
            {topStorageUsers.map((u) => {
              const limit = u.storageLimitBytes || 15 * 1024 * 1024 * 1024;
              const userPct = Math.round((u.storageUsedBytes / limit) * 100);
              return (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MexoAvatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="sm" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-slate-100 font-mono">{formatStorage(u.storageUsedBytes)}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">{userPct}% of limit</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
