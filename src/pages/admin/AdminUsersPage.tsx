import React, { useState, useRef } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoBadge } from '../../components/common/MexoBadge';
import { MexoModal } from '../../components/common/MexoModal';
import { db } from '../../services/db';
import { useUIStore } from '../../store/uiStore';
import {
  Users,
  Search,
  SlidersHorizontal,
  UserPlus,
  FileSpreadsheet,
  Download,
  Key,
  Trash2,
  Check,
  AlertCircle,
  Shield,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import { MexoUser } from '../../types/user';

export const AdminUsersPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = useState<MexoUser[]>(db.getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<MexoUser | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<MexoUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add User Form State
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'user' | 'system_admin'>('user');

  // Password Edit State
  const [newPassword, setNewPassword] = useState('');

  // CSV File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live username check state
  const usernameCheck = React.useMemo<{
    checked: boolean;
    available?: boolean;
    reason?: string;
    alternatives?: string[];
  }>(() => {
    if (!addUsername.trim()) return { checked: false };
    return { checked: true, ...db.checkUsernameAvailable(addUsername.trim()) };
  }, [addUsername]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  // Add Single User Submit
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addUsername.trim() || !addPassword.trim()) {
      addToast({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    if (!usernameCheck.available) {
      addToast({ message: usernameCheck.reason || 'Username is not available.', type: 'error' });
      return;
    }

    const newUser = db.createUser({
      firstName: addFirstName.trim(),
      lastName: addLastName.trim(),
      username: addUsername.trim(),
      password: addPassword.trim(),
      createdByAdmin: true,
      requiresPasswordChange: true,
    });

    db.updateUser(newUser.id, {
      role: addRole,
      createdByAdmin: true,
      requiresPasswordChange: true,
    });
    db.addAuditLog('admin@mexo.com', 'USER_CREATED_BY_ADMIN', newUser.email, 'success');

    refreshUsers();
    addToast({ message: `User ${newUser.email} created successfully! Password update required on first login.`, type: 'success' });
    setIsAddUserOpen(false);

    // Reset Form
    setAddFirstName('');
    setAddLastName('');
    setAddUsername('');
    setAddPassword('');
  };

  // Change Password Submit
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword.trim()) return;

    db.updateUser(selectedUserForPassword.id, {
      password: newPassword.trim(),
      requiresPasswordChange: true,
    });
    db.addAuditLog('admin@mexo.com', 'PASSWORD_RESET_BY_ADMIN', selectedUserForPassword.email, 'success');
    refreshUsers();
    addToast({ message: `Password updated for ${selectedUserForPassword.email}. User will be prompted to change password.`, type: 'success' });
    setSelectedUserForPassword(null);
    setNewPassword('');
  };

  // Delete User Submit
  const handleDeleteUser = () => {
    if (!selectedUserForDelete) return;
    if (selectedUserForDelete.role === 'system_admin') {
      addToast({ message: 'System Admin accounts cannot be deleted.', type: 'error' });
      return;
    }

    db.deleteUser(selectedUserForDelete.id);
    refreshUsers();
    addToast({ message: `Account ${selectedUserForDelete.email} deleted permanently.`, type: 'info' });
    setSelectedUserForDelete(null);
  };

  // Toggle Suspend / Active
  const handleToggleSuspend = (user: MexoUser) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    db.updateUser(user.id, { status: newStatus });
    db.addAuditLog('admin@mexo.com', newStatus === 'suspended' ? 'USER_SUSPENDED' : 'USER_ACTIVATED', user.email, 'warning');
    refreshUsers();
    addToast({ message: `Account ${user.email} marked as ${newStatus}`, type: 'info' });
  };

  // Download CSV Template
  const handleDownloadCsvTemplate = () => {
    const headers = 'first_name,last_name,username,password,role\n';
    const sample1 = 'Arun,Kumar,arun.k,password123,user\n';
    const sample2 = 'Priya,Ramesh,priya.r,password123,user\n';
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mexo_users_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV File Selection
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length <= 1) {
        addToast({ message: 'CSV file is empty or missing data rows.', type: 'error' });
        return;
      }

      let importedCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length >= 4) {
          const [fn, ln, un, pwd, role] = parts;
          if (fn && ln && un && pwd) {
            const avail = db.checkUsernameAvailable(un);
            if (avail.available) {
              const u = db.createUser({
                firstName: fn,
                lastName: ln,
                username: un,
                password: pwd,
              });
              db.updateUser(u.id, {
                role: role === 'system_admin' ? 'system_admin' : 'user',
              });
              importedCount++;
            } else {
              skippedCount++;
            }
          }
        }
      }

      refreshUsers();
      if (importedCount > 0) {
        addToast({ message: `Successfully imported ${importedCount} user account(s)! ${skippedCount > 0 ? `(${skippedCount} skipped because username exists)` : ''}`, type: 'success' });
      } else {
        addToast({ message: 'No accounts imported. All usernames in CSV already exist.', type: 'error' });
      }
      setIsImportModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-app-border">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
              <Users className="w-6 h-6 mr-2.5 text-[#7C3AED] dark:text-indigo-400" />
              Users Directory & Administration
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Create accounts with live address checking, bulk import CSV, change passwords, and manage accounts.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs flex items-center space-x-2 border border-app-border transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#7C3AED]" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs flex items-center space-x-2 shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-app-border shadow-mexo-sm">
          <div className="relative w-full sm:w-80 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email address..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-app-border font-semibold outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="system_admin">System Admins</option>
              <option value="user">Standard Users</option>
            </select>
          </div>
        </div>

        {/* Directory Table Card */}
        <div className="border border-app-border rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-mexo-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-app-border text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border text-slate-800 dark:text-slate-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <MexoAvatar name={`${u.firstName} ${u.lastName}`} src={u.avatarUrl} size="md" />
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-slate-100">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-[#7C3AED] dark:text-indigo-400 font-mono font-semibold">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <MexoBadge variant={u.role === 'system_admin' ? 'warning' : 'outline'}>
                        {u.role === 'system_admin' ? 'System Admin' : 'User'}
                      </MexoBadge>
                    </td>
                    <td className="p-4">
                      <MexoBadge variant={u.status === 'active' ? 'success' : 'danger'}>
                        {u.status}
                      </MexoBadge>
                    </td>
                    <td className="p-4 font-mono text-slate-500 dark:text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Change Password Button */}
                        <button
                          onClick={() => setSelectedUserForPassword(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center space-x-1.5 transition-colors cursor-pointer border border-app-border"
                          title="Reset Account Password"
                        >
                          <Key className="w-3.5 h-3.5 text-[#7C3AED]" />
                          <span>Password</span>
                        </button>

                        {/* Suspend / Activate Button */}
                        {u.role !== 'system_admin' && (
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center space-x-1.5 transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60 dark:border-amber-900/60'
                                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60 dark:border-emerald-900/60'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete User Button */}
                        {u.role !== 'system_admin' && (
                          <button
                            onClick={() => setSelectedUserForDelete(u)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs inline-flex items-center space-x-1.5 border border-rose-200/60 dark:border-rose-900/60 transition-colors cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: Add New User Account ── */}
      {isAddUserOpen && (
        <MexoModal
          isOpen={isAddUserOpen}
          onClose={() => setIsAddUserOpen(false)}
          title="Create New User Account"
        >
          <form onSubmit={handleAddUserSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder="e.g. Arun"
                  required
                  className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={addLastName}
                  onChange={(e) => setAddLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  required
                  className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">MEXO Address (Username) *</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g. arun.kumar"
                  required
                  className="flex-1 p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
                />
                <span className="text-xs font-mono font-bold text-[#7C3AED]">@mexo.com</span>
              </div>

              {/* Live Address Availability Check Output */}
              {usernameCheck.checked && (
                <div className="mt-2 text-xs">
                  {usernameCheck.available ? (
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <Check className="w-3.5 h-3.5 mr-1 stroke-[3]" />
                      <span>{addUsername.toLowerCase()}@mexo.com is available!</span>
                    </div>
                  ) : (
                    <div className="space-y-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <div className="flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        <span>{usernameCheck.reason || 'Address taken.'}</span>
                      </div>
                      {usernameCheck.alternatives && usernameCheck.alternatives.length > 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                          <span>Suggestions: </span>
                          {usernameCheck.alternatives.map((alt) => (
                            <button
                              key={alt}
                              type="button"
                              onClick={() => setAddUsername(alt)}
                              className="font-mono text-[#7C3AED] underline mr-2 font-bold hover:text-indigo-700 cursor-pointer"
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input
                type="text"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Initial password"
                required
                className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none cursor-pointer"
              >
                <option value="user">Standard User</option>
                <option value="system_admin">System Admin</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!usernameCheck.available}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] disabled:opacity-50 text-white shadow-xs"
              >
                Create Account
              </button>
            </div>
          </form>
        </MexoModal>
      )}

      {/* ── MODAL 2: Import Users via CSV ── */}
      {isImportModalOpen && (
        <MexoModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Users via CSV"
        >
          <div className="space-y-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload a CSV file containing user accounts to import them in bulk into MEXO Mail.
            </p>

            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 text-xs space-y-2">
              <p className="font-extrabold text-[#7C3AED] dark:text-indigo-300">Step 1: Download CSV Template</p>
              <button
                onClick={handleDownloadCsvTemplate}
                className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] text-white font-bold text-xs inline-flex items-center space-x-1.5 hover:opacity-95 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template (.CSV)</span>
              </button>
            </div>

            <div className="space-y-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Step 2: Upload CSV File</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#7C3AED] file:text-white hover:file:opacity-90 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-app-border">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </MexoModal>
      )}

      {/* ── MODAL 3: Change Password ── */}
      {selectedUserForPassword && (
        <MexoModal
          isOpen={!!selectedUserForPassword}
          onClose={() => setSelectedUserForPassword(null)}
          title={`Reset Password — ${selectedUserForPassword.firstName} ${selectedUserForPassword.lastName}`}
        >
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set a new password for <strong className="font-mono text-slate-900 dark:text-slate-100">{selectedUserForPassword.email}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">New Password *</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
              <button
                type="button"
                onClick={() => setSelectedUserForPassword(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </MexoModal>
      )}

      {/* ── MODAL 4: Delete Account Confirmation ── */}
      {selectedUserForDelete && (
        <MexoModal
          isOpen={!!selectedUserForDelete}
          onClose={() => setSelectedUserForDelete(null)}
          title="Confirm Delete Account"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete account <strong className="font-mono text-rose-600">{selectedUserForDelete.email}</strong>?
            </p>
            <p className="text-[11px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
              ⚠️ This action cannot be undone. All messages and user data will be removed.
            </p>

            <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
              <button
                onClick={() => setSelectedUserForDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </MexoModal>
      )}
    </AdminLayout>
  );
};
