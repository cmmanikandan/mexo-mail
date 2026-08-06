import React, { useState, useRef } from 'react';
import { MexoModal } from './MexoModal';
import { MexoButton } from './MexoButton';
import { MexoAvatar } from './MexoAvatar';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { uploadFileToCloudinary } from '../../services/cloudinaryService';
import { Camera, Trash2, Upload, AlertCircle, Check, Loader2 } from 'lucide-react';

export interface ProfilePhotoUploaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5 MB.');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile && !previewSrc) return;

    setIsUploading(true);
    setError('');

    try {
      if (selectedFile) {
        const cloudinaryRes = await uploadFileToCloudinary(selectedFile);
        updateCurrentUser({ avatarUrl: cloudinaryRes.secure_url });
        addToast({ message: 'Profile photo uploaded to Cloudinary successfully!', type: 'success' });
      } else if (previewSrc) {
        updateCurrentUser({ avatarUrl: previewSrc });
        addToast({ message: 'Profile photo updated successfully.', type: 'success' });
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to upload profile photo to Cloudinary:', err);
      if (previewSrc) {
        updateCurrentUser({ avatarUrl: previewSrc });
        addToast({ message: 'Profile photo updated locally.', type: 'info' });
        onClose();
      } else {
        setError('Failed to upload image to Cloudinary. Please try again.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRemove = () => {
    updateCurrentUser({ avatarUrl: undefined });
    addToast({ message: 'Profile photo removed. User initials will be displayed.', type: 'info' });
    setIsRemoving(false);
    onClose();
  };

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Profile Photo" maxWidth="sm">
      <div className="space-y-6 select-none">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Circular Avatar Preview */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <MexoAvatar
              name={`${currentUser.firstName} ${currentUser.lastName}`}
              src={previewSrc || currentUser.avatarUrl}
              size="xl"
              className="w-28 h-28 text-3xl shadow-mexo-md border-4 border-white dark:border-slate-800"
            />
            <div className="absolute inset-0 rounded-full bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera className="w-7 h-7" />
            </div>
          </div>
          <p className="text-xs text-app-muted font-medium">
            {previewSrc ? 'New photo preview' : 'Click avatar or upload button to select image'}
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Removal Confirmation Dialog View */}
        {isRemoving ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3 text-xs">
            <h4 className="font-bold text-rose-800 dark:text-rose-200">Remove profile photo?</h4>
            <p className="text-rose-700 dark:text-rose-300">
              Your profile picture will be deleted and your initials will be displayed across MEXO services instead.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <MexoButton variant="secondary" size="sm" onClick={() => setIsRemoving(false)}>
                Cancel
              </MexoButton>
              <MexoButton variant="danger" size="sm" onClick={handleConfirmRemove}>
                Remove Photo
              </MexoButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MexoButton
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Upload New Photo
              </MexoButton>

              {currentUser.avatarUrl && (
                <button
                  type="button"
                  onClick={() => setIsRemoving(true)}
                  className="p-2.5 rounded-xl border border-app-border hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                  title="Remove Profile Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
              <MexoButton variant="secondary" onClick={onClose}>
                Cancel
              </MexoButton>
              {previewSrc && (
                <MexoButton
                  variant="primary"
                  onClick={handleSavePhoto}
                  disabled={isUploading}
                  leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                >
                  {isUploading ? 'Uploading to Cloudinary...' : 'Save Photo'}
                </MexoButton>
              )}
            </div>
          </div>
        )}
      </div>
    </MexoModal>
  );
};
