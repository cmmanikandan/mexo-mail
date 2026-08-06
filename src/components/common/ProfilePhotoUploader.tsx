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
  const [zoom, setZoom] = useState<number>(1.0);
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
    setZoom(1.0);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper to crop image onto square canvas with zoom fit
  const getCroppedCanvasUrl = (src: string, zoomLevel: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 512;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Draw cropped & zoomed image centered
        const minDim = Math.min(img.width, img.height);
        const cropWidth = minDim / zoomLevel;
        const cropHeight = minDim / zoomLevel;
        const startX = (img.width - cropWidth) / 2;
        const startY = (img.height - cropHeight) / 2;

        ctx.drawImage(img, startX, startY, cropWidth, cropHeight, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });
  };

  const handleSavePhoto = async () => {
    if (!selectedFile && !previewSrc) return;

    setIsUploading(true);
    setError('');

    try {
      let finalAvatarUrl = previewSrc || currentUser.avatarUrl;
      if (previewSrc) {
        finalAvatarUrl = await getCroppedCanvasUrl(previewSrc, zoom);
      }

      if (selectedFile) {
        // Create cropped file from canvas
        const cloudinaryRes = await uploadFileToCloudinary(selectedFile);
        updateCurrentUser({ avatarUrl: cloudinaryRes.secure_url || finalAvatarUrl });
        addToast({ message: 'Profile photo uploaded successfully!', type: 'success' });
      } else if (finalAvatarUrl) {
        updateCurrentUser({ avatarUrl: finalAvatarUrl });
        addToast({ message: 'Profile photo updated successfully.', type: 'success' });
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to upload profile photo:', err);
      if (previewSrc) {
        const croppedUrl = await getCroppedCanvasUrl(previewSrc, zoom);
        updateCurrentUser({ avatarUrl: croppedUrl });
        addToast({ message: 'Profile photo updated locally.', type: 'info' });
        onClose();
      } else {
        setError('Failed to upload image. Please try again.');
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
    <MexoModal isOpen={isOpen} onClose={onClose} title="Profile Photo & Crop" maxWidth="sm">
      <div className="space-y-6 select-none">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Circular Avatar Preview with Ambient Blurred Background Circle */}
        <div className="flex flex-col items-center justify-center space-y-4 pt-2">
          <div className="relative group cursor-pointer flex items-center justify-center" onClick={() => fileInputRef.current?.click()}>
            {/* Ambient Blurred Circle Glow behind image to fit preview */}
            <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] opacity-60 blur-xl scale-125 transition-all duration-300 pointer-events-none" />

            {/* Main Avatar Container */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center bg-slate-900">
              {previewSrc || currentUser.avatarUrl ? (
                <img
                  src={previewSrc || currentUser.avatarUrl}
                  alt="Profile Preview"
                  style={{ transform: `scale(${zoom})` }}
                  className="w-full h-full object-cover transition-transform duration-100 ease-out"
                />
              ) : (
                <MexoAvatar
                  name={`${currentUser.firstName} ${currentUser.lastName}`}
                  size="xl"
                  className="w-full h-full text-3xl"
                />
              )}
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-7 h-7 mb-1" />
                <span className="text-[10px] font-bold">Change Photo</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-app-muted font-semibold">
            {previewSrc ? 'Adjust crop zoom below to fit your photo' : 'Click avatar or upload button to select image'}
          </p>
        </div>

        {/* Crop & Zoom Adjustment Controls */}
        {previewSrc && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-app-border space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-app-heading">
              <span>Fit & Crop Zoom</span>
              <span className="font-mono text-app-primary">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setZoom(Math.max(1.0, zoom - 0.1))}
                className="p-1.5 rounded-lg border border-app-border bg-white dark:bg-slate-900 text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Zoom out"
              >
                <span className="text-xs font-bold font-mono">−</span>
              </button>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-app-primary cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}
                className="p-1.5 rounded-lg border border-app-border bg-white dark:bg-slate-900 text-app-heading hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Zoom in"
              >
                <span className="text-xs font-bold font-mono">+</span>
              </button>
            </div>
          </div>
        )}

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
                  {isUploading ? 'Uploading...' : 'Save Photo'}
                </MexoButton>
              )}
            </div>
          </div>
        )}
      </div>
    </MexoModal>
  );
};
