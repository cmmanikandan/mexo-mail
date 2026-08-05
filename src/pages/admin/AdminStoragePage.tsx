import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoModal } from '../../components/common/MexoModal';
import { db } from '../../services/db';
import { useUIStore } from '../../store/uiStore';
import { HardDrive, Search, Edit3 } from 'lucide-react';
import { MexoUser } from '../../types/user';

export const AdminStoragePage: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = useState<MexoUser[]>(db.getUsers());
  const [selectedUser, setSelectedUser] = useState<MexoUser | null>(null);
  const [newQuotaGb, setNewQuotaGb] = useState('15');
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = db.getAdminMetrics();
  const totalCapacityBytes = 500 * 1024 * 1024 * 1024;
  const totalUsedGb = (metrics.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const usedPercent = Math.min(100, Math.round((metrics.storageUsedBytes / totalCapacityBytes) * 100));

  const filteredUsers = users.filter((u) => {
    return (
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleQuotaSave = () => {
    if (selectedUser) {
      const bytes = parseFloat(newQuotaGb) * 1024 * 1024 * 1024;
      db.updateUser(selectedUser.id, { storageLimitBytes: bytes });
      db.addAuditLog('admin@mexo.com', 'QUOTA_CHANGED', selectedUser.email, 'success');
      setUsers(db.getUsers());
      addToast({ message: `Storage quota updated for ${selectedUser.email}`, type: 'success' });
      setSelectedUser(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-app-border">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <HardDrive className="w-6 h-6 mr-2.5 text-[#7C3AED] dark:text-indigo-400" />
            Storage Quotas & Allocation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Organization storage allocation, user mail capacity limits, and system volume analytics.
          </p>
        </div>

        {/* Global Storage Meter Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Total Storage Pool
            </span>
            <span className="text-xs font-mono font-extrabold text-[#7C3AED] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200/50 dark:border-indigo-800/40">
              {totalUsedGb} GB / 500 GB ({usedPercent}%)
            </span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-app-border">
            <div
              style={{ width: `${Math.max(usedPercent, 4)}%` }}
              className="h-full bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] rounded-full transition-all duration-500 shadow-xs"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm flex items-center">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts to manage storage quotas..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
        </div>

        {/* User Quotas Table Card */}
        <div className="border border-app-border rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-mexo-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-app-border text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Storage Used</th>
                  <th className="p-4">Quota Allocation</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-slate-800 dark:text-slate-200">
                {filteredUsers.map((u) => {
                  const usedGb = (u.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
                  const limitGb = (u.storageLimitBytes / (1024 * 1024 * 1024)).toFixed(0);
                  const userPct = Math.min(100, Math.round((u.storageUsedBytes / u.storageLimitBytes) * 100));

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 flex items-center space-x-3">
                        <MexoAvatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="md" />
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-slate-100">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-[#7C3AED] dark:text-indigo-400 font-mono font-semibold">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-slate-100">
                        {usedGb} GB
                      </td>
                      <td className="p-4 font-mono">
                        <div className="space-y-1 max-w-[180px]">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span>{usedGb} GB used</span>
                            <span className="text-slate-400">{limitGb} GB max</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${userPct}%` }}
                              className={`h-full rounded-full ${
                                userPct > 90 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#7C3AED] to-[#0878e8]'
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewQuotaGb((u.storageLimitBytes / (1024 * 1024 * 1024)).toString());
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs transition-colors inline-flex items-center space-x-1.5 border border-indigo-200/50 dark:border-indigo-800/40"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Quota</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quota Modal */}
      {selectedUser && (
        <MexoModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Update Quota — ${selectedUser.firstName} ${selectedUser.lastName}`}
        >
          <div className="space-y-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set storage space quota allocated for <strong className="text-slate-900 dark:text-slate-100 font-mono">{selectedUser.email}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Storage Limit (GB)
              </label>
              <input
                type="number"
                value={newQuotaGb}
                onChange={(e) => setNewQuotaGb(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-app-border">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleQuotaSave}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white shadow-xs"
              >
                Save Quota
              </button>
            </div>
          </div>
        </MexoModal>
      )}
    </AdminLayout>
  );
};
