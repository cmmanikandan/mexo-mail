import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { MexoBadge } from '../../components/common/MexoBadge';
import { db } from '../../services/db';
import { History, Search } from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const auditLogs = db.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = resultFilter === 'all' || log.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-app-border">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
            <History className="w-6 h-6 mr-2.5 text-[#7C3AED] dark:text-indigo-400" />
            Administrative Audit Log & Security Events
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Immutable system event recording for governance, login attempts, user creations, and privilege updates.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm">
          <div className="relative w-full sm:w-80 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit logs by actor, action, or target..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-app-border font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Event Results</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table Card */}
        <div className="border border-app-border rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-mexo-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-app-border text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Resource</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-slate-800 dark:text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-[#7C3AED] dark:text-indigo-400 font-mono">{log.actorEmail}</td>
                    <td className="p-4 font-mono font-extrabold text-slate-900 dark:text-slate-100">{log.action}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{log.target}</td>
                    <td className="p-4">
                      <MexoBadge
                        variant={
                          log.result === 'success' ? 'success' : log.result === 'failed' ? 'danger' : 'warning'
                        }
                      >
                        {log.result}
                      </MexoBadge>
                    </td>
                    <td className="p-4 text-slate-400 font-mono">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
