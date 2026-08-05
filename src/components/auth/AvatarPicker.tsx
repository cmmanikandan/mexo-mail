import React, { useRef } from 'react';
import { Upload, Check, Sparkles, Trash2 } from 'lucide-react';

export interface AvatarPickerProps {
  selectedAvatar?: string;
  name?: string;
  onSelectAvatar: (avatarUrl: string) => void;
  className?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  selectedAvatar = '',
  name = 'User',
  onSelectAvatar,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSelectAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Box Container */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-mexo-50/50 via-slate-50 to-mexo-50/50 dark:from-mexo-950/40 dark:via-slate-900/40 dark:to-mexo-950/40 border border-mexo-100 dark:border-mexo-900/50 shadow-sm flex flex-col items-center text-center space-y-4">
        <div className="relative">
          {selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt={name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-mexo-500/20 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-mexo-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold text-3xl ring-4 ring-mexo-500/20 shadow-lg">
              {initials}
            </div>
          )}
          {selectedAvatar && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}
        </div>

        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center">
            {name}
            <Sparkles className="w-4 h-4 text-amber-500 ml-1.5" />
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {selectedAvatar ? 'Custom display picture uploaded' : 'Default initial avatar active'}
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-mexo-600 hover:bg-mexo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>

          {selectedAvatar && (
            <button
              type="button"
              onClick={() => onSelectAvatar('')}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
