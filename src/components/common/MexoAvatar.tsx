import React, { useState } from 'react';

export interface MexoAvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBlurCircle?: boolean;
}

export const MexoAvatar: React.FC<MexoAvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
  showBlurCircle = false,
}) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const getInitials = (n: string) => {
    if (!n || !n.trim()) return 'MX';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const getThemeBgColor = (n: string) => {
    const palette = [
      'bg-[#0878e8] text-white',
      'bg-emerald-600 text-white',
      'bg-indigo-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
      'bg-sky-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-16 h-16 text-xl font-extrabold',
  };

  const avatarContent = src && !hasError ? (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover shadow-sm ${sizeMap[size]} ${className}`}
    />
  ) : (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-tight select-none shadow-sm ${sizeMap[size]} ${getThemeBgColor(
        name
      )} ${className}`}
    >
      {getInitials(name)}
    </div>
  );

  if (showBlurCircle) {
    return (
      <div className="relative inline-flex items-center justify-center flex-shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] opacity-50 blur-md scale-110 pointer-events-none" />
        {avatarContent}
      </div>
    );
  }

  return avatarContent;
};
