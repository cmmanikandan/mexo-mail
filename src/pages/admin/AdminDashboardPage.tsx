import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';
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
  RefreshCw,
} from 'lucide-react';
import { MexoUser } from '../../types/user';
import { AdminMetrics } from '../../types/admin';

export const AdminDashboardPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = useState<MexoUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    messagesToday: 0,
    messagesThisMonth: 0,
    totalGroups: 0,
    storageUsedBytes: 0,
    storageTotalBytes: 500 * 1024 * 1024 * 1024,
    failedDeliveries: 0,
    spamReports: 0,
    securityAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allUsers, liveMetrics] = await Promise.all([
        api.getAllUsers(),
        api.getAdminMetrics(),
      ]);
      setUsers(allUsers);
      setMetrics(liveMetrics);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatStorage = (bytes: number) => {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const topStorageUsers = [...users]
    .sort((a, b) => b.storageUsedBytes - a.storageUsedBytes)
    .slice(0, 4);

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
              Real-Time Cloud Database Platform Metrics (Single Source of Truth)
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center space-x-2 border border-indigo-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-app-border">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Cloud Database Live</span>
            </div>
          </div>
        </div>

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Directory Users */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3 hover:shadow-mexo-md transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Total Directory Users</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : metrics.totalUsers}
            </p>
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
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {loading ? '...' : metrics.messagesToday}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Cloud Message Records
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
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatStorage(metrics.storageUsedBytes)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Calculated from stored attachments & messages</p>
          </div>
        </div>

        {/* Top Storage Consumers Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center">
              <Users className="w-4 h-4 mr-2 text-[#7C3AED]" /> Directory Accounts Overview
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">{users.length} Accounts</span>
          </div>

          {users.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No user accounts found in cloud database.</p>
          ) : (
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
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
