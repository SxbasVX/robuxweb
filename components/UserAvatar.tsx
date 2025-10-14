'use client';
import { memo } from 'react';
import { getRoleColor, getRoleIcon, getInitials } from '../lib/gamertag';
import { getGenericAvatar, GenericAvatarSVG } from '../lib/generic-avatars';

interface UserAvatarProps {
  user: {
    id: string;
    displayName?: string;
    avatar?: { color: string; emoji: string };
    email?: string | null;
  } | null;
  role?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRole?: boolean;
  className?: string;
}

const UserAvatar = memo(function UserAvatar({ 
  user, 
  role = null, 
  size = 'md', 
  showRole = false,
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  if (!user) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-500 flex items-center justify-center ${className}`}>
        <span className="text-white">👤</span>
      </div>
    );
  }

  // Obtener avatar genérico basado en el ID del usuario
  const genericAvatar = getGenericAvatar(user.id);

  // Si el usuario tiene un avatar personalizado (anónimo), usar emoji
  if (user.avatar) {
    return (
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
          style={{ backgroundColor: user.avatar.color }}
        >
          <span className={iconSizes[size]}>{user.avatar.emoji}</span>
        </div>
        {showRole && role && role !== 'anonimo' && (
          <div className={`absolute -bottom-1 -right-1 ${iconSizes[size]} bg-gradient-to-r ${getRoleColor(role)} rounded-full p-1`}>
            <span>{getRoleIcon(role)}</span>
          </div>
        )}
      </div>
    );
  }

  // Usuario registrado con avatar genérico
  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} overflow-hidden ${className}`}>
        <GenericAvatarSVG avatar={genericAvatar} size={sizePixels[size]} />
      </div>
      {showRole && role && role !== 'usuario' && role !== 'anonimo' && (
        <div className={`absolute -bottom-1 -right-1 ${iconSizes[size]} bg-gradient-to-r ${getRoleColor(role)} rounded-full p-1 border-2 border-white`}>
          <span>{getRoleIcon(role)}</span>
        </div>
      )}
    </div>
  );
});

export default UserAvatar;