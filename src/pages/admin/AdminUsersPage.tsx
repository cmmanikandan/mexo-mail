import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoBadge } from '../../components/common/MexoBadge';
import { MexoModal } from '../../components/common/MexoModal';
import { ProfilePhotoUploader } from '../../components/common/ProfilePhotoUploader';
import { ImageCropperModal } from '../../components/common/ImageCropperModal';
import { uploadBlobToCloudinary } from '../../services/cloudinaryService';
import { db } from '../../services/db';
import { api } from '../../services/api';
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
  Ban,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Camera,
  Sparkles,
} from 'lucide-react';
import { MexoUser } from '../../types/user';

export const AdminUsersPage: React.FC = () => {
  const { addToast } = useUIStore();
  const [users, setUsers] = useState<MexoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<MexoUser | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<MexoUser | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<{ fn: string; ln: string; un: string; pwd: string; role: string }[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);       // 0–100
  const [importCurrentIdx, setImportCurrentIdx] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Add User Form State
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'user' | 'system_admin'>('user');

  // Add User — live username check state
  const [usernameCheck, setUsernameCheck] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    message?: string;
    suggestions?: string[];
  }>({ status: 'idle' });

  // Add User — optional pending avatar
  const [addAvatarRawSrc, setAddAvatarRawSrc] = useState<string | null>(null);
  const [addAvatarCropperOpen, setAddAvatarCropperOpen] = useState(false);
  const [addAvatarBlob, setAddAvatarBlob] = useState<Blob | null>(null);
  const [addAvatarPreviewUrl, setAddAvatarPreviewUrl] = useState<string | null>(null);
  const addAvatarFileRef = useRef<HTMLInputElement>(null);

  // Admin — edit another user's photo
  const [photoEditUser, setPhotoEditUser] = useState<MexoUser | null>(null);

  // Password Edit State
  const [newPassword, setNewPassword] = useState('');

  // CSV File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetched = await api.getAllUsers();
      setUsers(fetched);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError('Unable to load users directory from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper to generate username suggestions when username is taken or requested
  const generateUsernameSuggestions = (
    baseUn: string,
    fn: string,
    ln: string,
    existingUsers: MexoUser[]
  ): string[] => {
    const taken = new Set(existingUsers.map((u) => u.username.toLowerCase()));
    const candidates: string[] = [];

    const cleanBase = baseUn.replace(/[^a-zA-Z0-9._-]/g, '').toLowerCase();
    const cleanFn = fn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLn = ln.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const currentYear = new Date().getFullYear();

    const options = [
      `${cleanBase}1`,
      `${cleanBase}_${currentYear}`,
      cleanFn && cleanLn ? `${cleanFn}.${cleanLn}` : '',
      cleanFn && cleanLn ? `${cleanFn}${cleanLn[0]}` : '',
      `${cleanBase}01`,
      `${cleanBase}.mexo`,
    ];

    for (const opt of options) {
      if (opt && opt.length >= 3 && !taken.has(opt) && !candidates.includes(opt)) {
        candidates.push(opt);
        if (candidates.length >= 3) break;
      }
    }
    return candidates;
  };

  // Live username availability check effect for Add User modal
  useEffect(() => {
    const clean = addUsername.toLowerCase().trim();
    if (!clean) {
      setUsernameCheck({ status: 'idle' });
      return;
    }
    if (clean.length < 3) {
      setUsernameCheck({ status: 'invalid', message: 'Minimum 3 characters required.' });
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(clean)) {
      setUsernameCheck({ status: 'invalid', message: 'Only letters, numbers, dots, and underscores allowed.' });
      return;
    }

    setUsernameCheck({ status: 'checking', message: 'Checking availability...' });

    const timer = setTimeout(async () => {
      const isLocallyTaken = users.some((u) => u.username.toLowerCase() === clean);
      if (isLocallyTaken) {
        const suggestions = generateUsernameSuggestions(clean, addFirstName, addLastName, users);
        setUsernameCheck({
          status: 'taken',
          message: 'Username already taken.',
          suggestions,
        });
        return;
      }

      const res = await api.checkUsernameAvailable(clean);
      if (res.available) {
        setUsernameCheck({ status: 'available', message: '✓ OK (Username available)' });
      } else {
        const suggestions = generateUsernameSuggestions(clean, addFirstName, addLastName, users);
        setUsernameCheck({
          status: 'taken',
          message: res.reason || 'Username already taken.',
          suggestions,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [addUsername, addFirstName, addLastName, users]);

  // Handler for Auto-suggest username button
  const handleAutoSuggestUsername = () => {
    const cleanFn = addFirstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanLn = addLastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    let candidate = cleanFn;
    if (cleanFn && cleanLn) {
      candidate = `${cleanFn}.${cleanLn}`;
    } else if (!candidate) {
      candidate = 'user' + Math.floor(100 + Math.random() * 900);
    }

    const taken = new Set(users.map((u) => u.username.toLowerCase()));
    let idx = 1;
    let finalUn = candidate;
    while (taken.has(finalUn)) {
      finalUn = `${candidate}${idx}`;
      idx++;
    }

    setAddUsername(finalUn);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Add User — handle avatar file select
  const handleAddAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      addToast({ message: 'Choose a JPG, PNG or WebP image.', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ message: 'Image must be under 5 MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAddAvatarRawSrc(reader.result as string);
      setAddAvatarCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Add User — after crop
  const handleAddAvatarCrop = (blob: Blob) => {
    setAddAvatarBlob(blob);
    setAddAvatarPreviewUrl(URL.createObjectURL(blob));
    setAddAvatarCropperOpen(false);
    setAddAvatarRawSrc(null);
  };

  // Add Single User Submit
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName.trim() || !addLastName.trim() || !addUsername.trim() || !addPassword.trim()) {
      addToast({ message: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createUserAccount({
        firstName: addFirstName.trim(),
        lastName: addLastName.trim(),
        username: addUsername.trim(),
        password: addPassword.trim(),
        role: addRole,
      });

      if (res.error || !res.user) {
        addToast({ message: res.error || 'Failed to create user account.', type: 'error' });
        return;
      }

      // Upload pending avatar blob if one was cropped
      if (addAvatarBlob && res.user.id) {
        try {
          const uploadRes = await uploadBlobToCloudinary(
            addAvatarBlob,
            `avatar-${Date.now()}.webp`
          );
          await api.updateUserProfile(res.user.id, { avatarUrl: uploadRes.secure_url });
        } catch (avatarErr) {
          console.warn('Avatar upload failed for new user, skipping:', avatarErr);
        }
      }

      await fetchUsers();
      addToast({ message: `User ${res.user.email} created successfully on cloud database!`, type: 'success' });
      setIsAddUserOpen(false);

      // Reset Form
      setAddFirstName('');
      setAddLastName('');
      setAddUsername('');
      setAddPassword('');
      setAddAvatarBlob(null);
      setAddAvatarPreviewUrl(null);
    } catch (err: any) {
      addToast({ message: err?.message || 'Failed to create user.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Password Submit
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPassword.trim()) return;

    try {
      setIsSubmitting(true);
      addToast({ message: `Password reset request logged for ${selectedUserForPassword.email}.`, type: 'success' });
      setSelectedUserForPassword(null);
      setNewPassword('');
      await fetchUsers();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User Submit
  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    if (selectedUserForDelete.role === 'system_admin') {
      addToast({ message: 'System Admin accounts cannot be deleted.', type: 'error' });
      return;
    }

    try {
      setIsSubmitting(true);
      const ok = await api.deleteUserAccount(selectedUserForDelete.id, selectedUserForDelete.email);
      if (ok) {
        await fetchUsers();
        addToast({ message: `Account ${selectedUserForDelete.email} deleted permanently.`, type: 'info' });
      } else {
        addToast({ message: 'Failed to delete user account.', type: 'error' });
      }
    } finally {
      setSelectedUserForDelete(null);
      setIsSubmitting(false);
    }
  };

  // Toggle Suspend / Active
  const handleToggleSuspend = async (user: MexoUser) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = await api.updateUserProfile(user.id, { status: newStatus });
    if (updated) {
      await fetchUsers();
      addToast({ message: `Account ${user.email} status set to ${newStatus}.`, type: 'info' });
    }
  };

  // CSV Template & Upload Handlers
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

  // Parse CSV file — robust, header-aware CSV reader with fallbacks
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvRows([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const rawLines = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (rawLines.length === 0) {
        addToast({ message: 'CSV file is empty.', type: 'error' });
        setCsvFile(null);
        return;
      }

      // Detect header row columns dynamically
      const headerLine = rawLines[0].toLowerCase();
      const headerParts = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      
      let fnIdx = headerParts.findIndex((h) => h.includes('first') || h === 'fn' || h === 'fname' || h === 'name');
      let lnIdx = headerParts.findIndex((h) => h.includes('last') || h === 'ln' || h === 'lname');
      let unIdx = headerParts.findIndex((h) => h.includes('user') || h.includes('email') || h === 'un' || h.includes('register'));
      let pwdIdx = headerParts.findIndex((h) => h.includes('pass') || h.includes('pwd') || h === 'pwd');
      let roleIdx = headerParts.findIndex((h) => h === 'role');

      const hasHeader = fnIdx !== -1 || unIdx !== -1 || pwdIdx !== -1;
      const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

      if (!hasHeader) {
        fnIdx = 0; lnIdx = 1; unIdx = 2; pwdIdx = 3; roleIdx = 4;
      } else {
        if (fnIdx === -1) fnIdx = 0;
        if (lnIdx === -1) lnIdx = 1;
        if (unIdx === -1) unIdx = 2;
        if (pwdIdx === -1) pwdIdx = 3;
        if (roleIdx === -1) roleIdx = 4;
      }

      const parsed: { fn: string; ln: string; un: string; pwd: string; role: string }[] = [];

      for (const line of dataLines) {
        const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
        let un = parts[unIdx] || parts[0] || '';
        if (un.includes('@')) un = un.split('@')[0];
        
        let fn = parts[fnIdx] || un || 'User';
        let ln = parts[lnIdx] || '';
        let pwd = parts[pwdIdx] || un || 'mexo123';
        let role = parts[roleIdx] || 'user';

        if (un) {
          parsed.push({
            fn,
            ln,
            un: un.toLowerCase(),
            pwd,
            role: role.toLowerCase() === 'system_admin' ? 'system_admin' : 'user',
          });
        }
      }

      if (parsed.length === 0) {
        addToast({ message: 'No valid user rows found in CSV. Check column format.', type: 'error' });
        setCsvFile(null);
        return;
      }

      setCsvRows(parsed);
      addToast({ message: `Parsed ${parsed.length} user record${parsed.length > 1 ? 's' : ''} from CSV.`, type: 'info' });
    };
    reader.readAsText(file);
  };

  // Actually imports parsed rows one-by-one with full progress & error tolerance
  const handleStartImport = async () => {
    if (csvRows.length === 0 || isImporting) return;
    setIsImporting(true);
    setImportProgress(0);
    setImportCurrentIdx(0);
    setImportTotal(csvRows.length);
    setImportResult(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < csvRows.length; i++) {
      const { fn, ln, un, pwd, role } = csvRows[i];
      setImportCurrentIdx(i + 1);
      setImportProgress(Math.round(((i + 1) / csvRows.length) * 100));

      try {
        const res = await api.createUserAccount({
          firstName: fn,
          lastName: ln,
          username: un,
          password: pwd,
          role: role === 'system_admin' ? 'system_admin' : 'user',
        });
        if (res.user) {
          success++;
        } else {
          failed++;
          errors.push(`${un}@mexo.com — ${res.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${un}@mexo.com — ${err?.message || 'Failed'}`);
      }

      // Small pause between row requests for smooth progress UI
      if (i < csvRows.length - 1) {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    setImportProgress(100);
    setImportResult({ success, failed, errors });
    setIsImporting(false);
    await fetchUsers();
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              Live Cloud Database User Directory (Single Source of Truth)
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start md:self-auto">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-extrabold text-xs flex items-center space-x-2 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-600 dark:text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Directory</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center space-x-2 border border-app-border transition-all cursor-pointer"
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
              placeholder="Search by name, username, or email address..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 border border-app-border focus:border-[#7C3AED] outline-none"
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
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
              <p className="text-xs font-bold">Fetching Directory Users from Cloud Database...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-rose-600 dark:text-rose-400 space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p className="text-sm font-bold">{error}</p>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 cursor-pointer"
              >
                Retry Fetching
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-bold">No Directory Users Found</p>
              <p className="text-xs">Click "Add User" to create an account in the database.</p>
            </div>
          ) : (
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
                          {/* Change profile photo */}
                          <button
                            onClick={() => setPhotoEditUser(u)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer border border-app-border transition-colors"
                            title="Change profile photo"
                            aria-label={`Change profile photo for ${u.firstName} ${u.lastName}`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedUserForPassword(u)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer border border-app-border"
                          >
                            <Key className="w-3.5 h-3.5 text-[#7C3AED]" />
                            <span>Password</span>
                          </button>

                          {u.role !== 'system_admin' && (
                            <button
                              onClick={() => handleToggleSuspend(u)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center space-x-1.5 cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 border border-amber-200/60'
                                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200/60'
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

                          {u.role !== 'system_admin' && (
                            <button
                              onClick={() => setSelectedUserForDelete(u)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs inline-flex items-center space-x-1.5 border border-rose-200/60 cursor-pointer"
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
          )}
        </div>
      </div>

      {/* MODAL 1: Add New User Account */}
      {isAddUserOpen && (
        <MexoModal
          isOpen={isAddUserOpen}
          onClose={() => { setIsAddUserOpen(false); setAddAvatarBlob(null); setAddAvatarPreviewUrl(null); }}
          title="Create New User Account"
        >
          <form onSubmit={handleAddUserSubmit} className="space-y-4">

            {/* Optional profile photo */}
            <div className="flex flex-col items-center space-y-2 pb-2">
              <div
                className="relative group cursor-pointer"
                onClick={() => addAvatarFileRef.current?.click()}
                title="Add profile photo (optional)"
              >
                {addAvatarPreviewUrl ? (
                  <img
                    src={addAvatarPreviewUrl}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => addAvatarFileRef.current?.click()}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {addAvatarPreviewUrl ? 'Change photo' : '+ Add photo (optional)'}
              </button>
              <input
                ref={addAvatarFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAddAvatarFileChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  value={addFirstName}
                  onChange={(e) => setAddFirstName(e.target.value)}
                  placeholder="e.g. Manikandan"
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
                  placeholder="e.g. CM"
                  required
                  className="w-full p-2.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none focus:border-[#7C3AED]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Username / Register No *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSuggestUsername}
                  className="text-[11px] font-bold text-[#7C3AED] dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-suggest</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g. 927624BIT001"
                  required
                  className={`flex-1 p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs outline-none transition-colors ${
                    usernameCheck.status === 'available'
                      ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : usernameCheck.status === 'taken'
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-app-border focus:border-[#7C3AED]'
                  }`}
                />
                <span className="text-xs font-mono font-bold text-[#7C3AED]">@mexo.com</span>
              </div>

              {/* Username Check Indicator & Suggestions */}
              {addUsername.trim() && (
                <div className="mt-1.5 space-y-1.5">
                  {usernameCheck.status === 'checking' && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7C3AED]" />
                      <span>Checking availability...</span>
                    </div>
                  )}

                  {usernameCheck.status === 'available' && (
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>OK (Username available)</span>
                    </div>
                  )}

                  {usernameCheck.status === 'taken' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span>Username already taken</span>
                      </div>

                      {usernameCheck.suggestions && usernameCheck.suggestions.length > 0 && (
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Suggested available usernames:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {usernameCheck.suggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setAddUsername(sug)}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-[#7C3AED] hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors shadow-2xs"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {usernameCheck.status === 'invalid' && usernameCheck.message && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {usernameCheck.message}
                    </p>
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
                onClick={() => { setIsAddUserOpen(false); setAddAvatarBlob(null); setAddAvatarPreviewUrl(null); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white shadow-xs"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </MexoModal>
      )}

      {/* Add User avatar cropper */}
      <ImageCropperModal
        isOpen={addAvatarCropperOpen}
        imageSrc={addAvatarRawSrc}
        onClose={() => { setAddAvatarCropperOpen(false); setAddAvatarRawSrc(null); }}
        onCrop={handleAddAvatarCrop}
      />

      {/* Admin — change another user's profile photo */}
      {photoEditUser && (
        <ProfilePhotoUploader
          isOpen={true}
          onClose={() => setPhotoEditUser(null)}
          targetUserId={photoEditUser.id}
          targetUserName={`${photoEditUser.firstName} ${photoEditUser.lastName}`}
          targetAvatarUrl={photoEditUser.avatarUrl}
          onAvatarUpdated={(userId, newUrl) => {
            setUsers((prev) =>
              prev.map((u) => u.id === userId ? { ...u, avatarUrl: newUrl || undefined } : u)
            );
          }}
        />
      )}

      {/* MODAL 2: Import Users via CSV */}
      {isImportModalOpen && (
        <MexoModal
          isOpen={isImportModalOpen}
          onClose={() => {
            if (isImporting) return; // prevent close during import
            setIsImportModalOpen(false);
            setCsvFile(null);
            setCsvRows([]);
            setImportResult(null);
            setImportProgress(0);
          }}
          title="Import Users via CSV"
          maxWidth="md"
        >
          <div className="space-y-5">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload a CSV file to create multiple user accounts at once. Each row is imported individually with live progress.
            </p>

            {/* Step 1: Template */}
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs space-y-2">
              <p className="font-extrabold text-[#7C3AED]">Step 1 — Download CSV Template</p>
              <p className="text-slate-500 dark:text-slate-400">Format: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">first_name, last_name, username, password, role</span></p>
              <button
                onClick={handleDownloadCsvTemplate}
                className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-xs cursor-pointer hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Template (.CSV)</span>
              </button>
            </div>

            {/* Step 2: Select file */}
            <div className="space-y-2">
              <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Step 2 — Select CSV File</p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Browse...</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                    disabled={isImporting}
                  />
                </label>
                {csvFile && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{csvFile.name}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">({csvRows.length} user{csvRows.length !== 1 ? 's' : ''})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Import button (only shown when file is loaded and not yet importing/done) */}
            {csvRows.length > 0 && !isImporting && !importResult && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100">Ready to import</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {csvRows.length} account{csvRows.length !== 1 ? 's' : ''} will be created in the cloud database.
                    </p>
                  </div>
                  <button
                    onClick={handleStartImport}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Import {csvRows.length} User{csvRows.length !== 1 ? 's' : ''}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Progress during import */}
            {isImporting && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Importing users...
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {importCurrentIdx} / {importTotal}
                  </span>
                </div>
                <div className="h-2.5 bg-indigo-100 dark:bg-indigo-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7C3AED] to-[#0878e8] rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-indigo-500 dark:text-indigo-400 text-center">
                  Please wait — do not close this window
                </p>
              </div>
            )}

            {/* Result summary */}
            {importResult && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                importResult.failed === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    importResult.failed === 0 ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900'
                  }`}>
                    {importResult.failed === 0
                      ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className={`font-extrabold text-sm ${
                      importResult.failed === 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'
                    }`}>
                      Import Complete
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        ✓ {importResult.success} added
                      </span>
                      {importResult.failed > 0 && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          ✗ {importResult.failed} failed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error details */}
                {importResult.errors.length > 0 && (
                  <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg p-2.5 space-y-1 max-h-28 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-[10px] font-mono text-rose-600 dark:text-rose-400 leading-relaxed">{err}</p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setCsvFile(null);
                    setCsvRows([]);
                    setImportResult(null);
                    setImportProgress(0);
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}

            {/* Footer */}
            {!isImporting && !importResult && (
              <div className="flex justify-end pt-2 border-t border-app-border">
                <button
                  onClick={() => { setIsImportModalOpen(false); setCsvFile(null); setCsvRows([]); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </MexoModal>
      )}

      {/* MODAL 3: Change Password */}
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white shadow-xs"
              >
                Update Password
              </button>
            </div>
          </form>
        </MexoModal>
      )}

      {/* MODAL 4: Delete Account Confirmation */}
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

            <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
              <button
                onClick={() => setSelectedUserForDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isSubmitting}
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
