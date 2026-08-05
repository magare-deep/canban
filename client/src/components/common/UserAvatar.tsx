import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  iconClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  className = 'w-9 h-9',
  iconClassName = 'w-5 h-5'
}) => {
  // If user provided a custom photo URL (not the default unsplash photo), render image
  const isValidCustomPhoto = src 
    && src.trim().length > 0 
    && src.startsWith('http') 
    && !src.includes('unsplash.com');

  if (isValidCustomPhoto) {
    return (
      <img
        src={src}
        alt={name || 'User Avatar'}
        className={`${className} rounded-full object-cover ring-2 ring-blue-500/20`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // Generic neutral human / person icon badge by default
  return (
    <div
      className={`${className} rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 flex items-center justify-center font-bold flex-shrink-0`}
      title={name || 'User Profile'}
    >
      <UserIcon className={iconClassName} />
    </div>
  );
};
