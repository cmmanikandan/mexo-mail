import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { useUIStore } from '../../../store/uiStore';
import { MexoAvatar } from '../../../components/common/MexoAvatar';
import { MexoButton } from '../../../components/common/MexoButton';
import { MexoInput } from '../../../components/common/MexoInput';
import { ProfilePhotoUploader } from '../../../components/common/ProfilePhotoUploader';
import { User, Camera } from 'lucide-react';

export const PersonalInfoView: React.FC = () => {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.firstName);
  const [lastName, setLastName] = useState(currentUser.lastName);
  const [recoveryEmail, setRecoveryEmail] = useState(currentUser.recoveryEmail || '');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [gender, setGender] = useState(currentUser.gender || 'Select');
  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      recoveryEmail: recoveryEmail.trim() || undefined,
      dob: dob || undefined,
      gender: gender !== 'Select' ? gender : undefined,
    });
    setIsEditing(false);
    addToast({ message: 'Personal profile updated successfully.', type: 'success' });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Profile Photo Uploader Modal */}
      <ProfilePhotoUploader
        isOpen={isPhotoUploaderOpen}
        onClose={() => setIsPhotoUploaderOpen(false)}
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <User className="w-5 h-5 mr-2 text-[#7C3AED] dark:text-indigo-400" /> Personal Information
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Basic info, like your name and photo, that you use on MEXO services.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all flex-shrink-0 cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {/* Profile Photo Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Profile Photo</h3>
        <div className="flex items-center space-x-4">
          {/* Avatar with camera overlay */}
          <div
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => setIsPhotoUploaderOpen(true)}
          >
            <MexoAvatar
              name={`${currentUser.firstName} ${currentUser.lastName}`}
              src={currentUser.avatarUrl}
              size="xl"
              className="w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl shadow-mexo-md border-2 border-white dark:border-slate-700"
            />
            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-xs text-[#7C3AED] dark:text-indigo-400 font-mono font-semibold truncate mt-0.5">{currentUser.email}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setIsPhotoUploaderOpen(true)}
                className="px-3.5 py-1.5 rounded-xl border border-app-border bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>{currentUser.avatarUrl ? 'Change Photo' : 'Add Photo'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MexoInput
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <MexoInput
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                MEXO Address (Read-only)
              </label>
              <input
                type="text"
                value={currentUser.email}
                readOnly
                disabled
                className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold"
              />
            </div>

            <MexoInput
              label="Recovery Email"
              type="email"
              placeholder="name@example.com"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                >
                  <option value="Select">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-app-border">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFirstName(currentUser.firstName);
                  setLastName(currentUser.lastName);
                  setRecoveryEmail(currentUser.recoveryEmail || '');
                  setDob(currentUser.dob || '');
                  setGender(currentUser.gender || 'Select');
                }}
                className="px-4 py-2 rounded-xl border border-app-border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="divide-y divide-app-border text-sm">
            {[
              { label: 'First Name', value: currentUser.firstName },
              { label: 'Last Name', value: currentUser.lastName },
              { label: 'MEXO Identity Email', value: currentUser.email, mono: true, blue: true },
              { label: 'Recovery Email', value: currentUser.recoveryEmail || 'Not configured' },
              { label: 'Date of Birth', value: currentUser.dob || 'Not specified' },
              { label: 'Gender', value: currentUser.gender || 'Not specified' },
            ].map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:items-center py-3.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:w-48 flex-shrink-0">{row.label}</span>
                <span className={`text-xs font-extrabold ${row.blue ? 'text-[#7C3AED] dark:text-indigo-400 font-mono' : 'text-slate-900 dark:text-slate-100'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
