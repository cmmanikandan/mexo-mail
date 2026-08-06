import React, { useState, useRef } from 'react';
import { MexoModal } from './MexoModal';
import { MexoButton } from './MexoButton';
import { MexoAvatar } from './MexoAvatar';
import { ImageCropperModal } from './ImageCropperModal';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { uploadBlobToCloudinary } from '../../services/cloudinaryService';
import { api } from '../../services/api';
import { Camera, Trash2, Upload, AlertCircle, Loader2 } from 'lucide-react';

export interface ProfilePhotoUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: update a different user's avatar (admin use). Defaults to currentUser. */
  targetUserId?: string;
  targetUserName?: string;
  targetAvatarUrl?: string;
  /** Called after a successful avatar save for a targetUser (not currentUser) */
  onAvatarUpdated?: (userId: string, newUrl: string) => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  targetAvatarUrl,
  onAvatarUpdated,
}) => {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [error, setError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Determine whether we're editing currentUser or a target user
  const isTargetMode = Boolean(targetUserId && targetUserId !== currentUser?.id);
  const displayAvatarUrl = isTargetMode ? targetAvatarUrl : currentUser?.avatarUrl;
  const displayName = isTargetMode ? (targetUserName || 'User') : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`;
  const userId = isTargetMode ? targetUserId! : currentUser?.id;

  if (!isOpen) return null;

  // ─── File validation ───────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('This image is too large. Choose an image under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.onerror = () => setError('Could not read the image. Please try another file.');
    reader.readAsDataURL(file);
  };

  // ─── After crop: upload + save ─────────────────────────────────────────────
  const handleCrop = async (blob: Blob) => {
    setIsCropperOpen(false);
    setRawImageSrc(null);
    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const filename = `avatar-${Date.now()}.webp`;
      const result = await uploadBlobToCloudinary(blob, filename, (pct) => {
        setUploadProgress(pct);
      });

      const newAvatarUrl = result.secure_url;

      if (isTargetMode) {
        // Admin updating another user's photo
        await api.updateUserProfile(userId!, { avatarUrl: newAvatarUrl });
        onAvatarUpdated?.(userId!, newAvatarUrl);
        addToast({ message: 'Profile photo updated successfully.', type: 'success' });
      } else {
        // User updating their own photo
        await updateCurrentUser({ avatarUrl: newAvatarUrl });
        addToast({ message: 'Profile photo saved!', type: 'success' });
      }

      onClose();
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      setError('Couldn\'t update profile photo. Please try again.');
      addToast({ message: 'Failed to upload photo.', type: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ─── Remove photo ──────────────────────────────────────────────────────────
  const handleConfirmRemove = async () => {
    try {
      if (isTargetMode) {
        await api.updateUserProfile(userId!, { avatarUrl: undefined });
        onAvatarUpdated?.(userId!, '');
      } else {
        await updateCurrentUser({ avatarUrl: undefined });
      }
      addToast({ message: 'Profile photo removed.', type: 'info' });
    } catch {
      addToast({ message: 'Failed to remove photo.', type: 'error' });
    } finally {
      setIsRemoving(false);
      onClose();
    }
  };

  return (
    <>
      {/* Main "Profile photo" options dialog */}
      <MexoModal isOpen={isOpen} onClose={onClose} title="Profile Photo" maxWidth="sm">
        <div className="space-y-5 select-none">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current avatar preview */}
          <div className="flex flex-col items-center space-y-3 py-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] opacity-40 blur-xl scale-110 pointer-events-none" />
              <MexoAvatar
                name={displayName}
                src={displayAvatarUrl}
                size="xl"
                className="w-24 h-24 text-3xl shadow-2xl border-4 border-white dark:border-slate-800 relative"
              />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{displayName.trim() || 'User'}</p>
              {!isTargetMode && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{currentUser?.email}</p>
              )}
            </div>
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  Saving profile photo...
                </span>
                <span className="font-mono text-indigo-500">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-[#0878e8] rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Removal confirmation */}
          {isRemoving ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3">
              <p className="font-bold text-xs text-rose-800 dark:text-rose-200">Remove profile photo?</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Your initials will be shown instead across MEXO services.
              </p>
              <div className="flex justify-end space-x-2">
                <MexoButton variant="secondary" size="sm" onClick={() => setIsRemoving(false)}>
                  Cancel
                </MexoButton>
                <MexoButton variant="danger" size="sm" onClick={handleConfirmRemove}>
                  Remove
                </MexoButton>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Upload new photo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center space-x-2.5 py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Upload new profile photo"
              >
                <Upload className="w-4.5 h-4.5 text-indigo-500" />
                <span>{displayAvatarUrl ? 'Change photo' : 'Upload photo'}</span>
              </button>

              {/* Remove existing photo */}
              {displayAvatarUrl && (
                <button
                  type="button"
                  onClick={() => setIsRemoving(true)}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl border border-app-border hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Remove profile photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              )}

              {/* Cancel */}
              <div className="flex justify-end pt-2 border-t border-app-border">
                <MexoButton variant="secondary" onClick={onClose} disabled={isUploading}>
                  Cancel
                </MexoButton>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select profile photo file"
          />
        </div>
      </MexoModal>

      {/* Crop modal — only renders when an image has been selected */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={rawImageSrc}
        onClose={() => {
          setIsCropperOpen(false);
          setRawImageSrc(null);
        }}
        onCrop={handleCrop}
      />
    </>
  );
};
