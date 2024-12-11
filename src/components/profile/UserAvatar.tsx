import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  imageUrl?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  size = 'md',
  imageUrl 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary flex items-center justify-center`}
    >
      <span className="font-medium text-white">
        {getInitials(name)}
      </span>
    </div>
  );
};

export default UserAvatar;