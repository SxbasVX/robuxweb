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
    avatar_url?: string;
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
    sm: 'w-16 h-16 text-base',
    md: 'w-20 h-20 text-lg',
    lg: 'w-28 h-28 text-xl',
    xl: 'w-32 h-32 text-2xl'
  };

  const sizePixels = {
    sm: 64,
    md: 80,
    lg: 112,
    xl: 128
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

  // Si el usuario tiene una imagen personalizada (avatar_url)
  if (user.avatar_url) {
    return (
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-700 ${className}`}>
          <img 
            src={user.avatar_url} 
            alt={user.displayName || 'Avatar'} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla, mostrar avatar genérico
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-600 text-white">${getInitials(user.displayName || user.email || '??')}</div>`;
            }}
          />
        </div>
        {showRole && role && role !== 'usuario' && role !== 'anonimo' && (
          <div className={`absolute -bottom-1 -right-1 ${iconSizes[size]} bg-gradient-to-r ${getRoleColor(role)} rounded-full p-1 border-2 border-white`}>
            <span>{getRoleIcon(role)}</span>
          </div>
        )}
      </div>
    );
  }

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