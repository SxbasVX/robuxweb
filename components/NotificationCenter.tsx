'use client';
import React, { useState, useRef, useEffect, memo } from 'react';
import { useNotifications, type Notification } from '../lib/useNotifications';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter = memo(function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment': return '💬';
      case 'post_published': return '📝';
      case 'essay_uploaded': return '📄';
      case 'mention': return '👤';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const notificationTime = new Date(dateString).getTime();
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <div className="animate-pulse w-6 h-6 bg-gray-600 rounded"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={toggleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
        aria-label="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 backdrop-blur-xl bg-white/80 border border-blue-200 rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden" style={{boxShadow:'0 8px 32px rgba(59,130,246,0.12)', backdropFilter:'blur(16px)'}}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                  setIsOpen(false);
                }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <div className="text-4xl mb-2">🔔</div>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-700/50 cursor-pointer transition-colors hover:bg-gray-800/50 ${
                    !notification.read ? 'bg-blue-500/10' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {notifications.length > 10 ? `Ver todas las ${notifications.length} notificaciones` : 'Cerrar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default NotificationCenter;