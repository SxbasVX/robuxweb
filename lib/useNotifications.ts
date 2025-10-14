'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';

export interface Notification {
  id: string;
  user_id: string;
  type: 'comment' | 'post_published' | 'essay_uploaded' | 'mention' | 'system';
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  expires_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const initializedRef = useRef(false);

  const getStorageKey = useCallback(() => {
    const userId = user?.id || user?.email || 'anonymous';
    return `notifications_${userId}`;
  }, [user?.id, user?.email]);

  const saveNotifications = useCallback((notifs: Notification[]) => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(notifs));
    } catch (error) {
      console.error('Error guardando notificaciones:', error);
    }
  }, [getStorageKey]);

  const loadNotifications = useCallback(() => {
    if (initializedRef.current) return;
    
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored) as Notification[];
        const validNotifications = parsed.filter(n => 
          new Date(n.expires_at) > new Date()
        );
        setNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
      initializedRef.current = true;
    }
  }, [getStorageKey]);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.filter(n => n.id !== notificationId);
      saveNotifications(updatedNotifications);
      
      const deletedNotification = prevNotifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updatedNotifications;
    });
  }, [saveNotifications]);

  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(getStorageKey());
  }, [getStorageKey]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveNotifications(updatedNotifications);
      
      const notification = prevNotifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updatedNotifications;
    });
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.map(n => ({ ...n, read: true }));
      saveNotifications(updatedNotifications);
      setUnreadCount(0);
      return updatedNotifications;
    });
  }, [saveNotifications]);

  const createNotification = useCallback((
    targetUserId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data: Record<string, any> = {}
  ) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      user_id: targetUserId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    setNotifications(prevNotifications => {
      const updatedNotifications = [newNotification, ...prevNotifications];
      const limitedNotifications = updatedNotifications.slice(0, 50);
      saveNotifications(limitedNotifications);
      setUnreadCount(prev => prev + 1);
      return limitedNotifications;
    });
    
    return true;
  }, [saveNotifications]);

  const cleanExpiredNotifications = useCallback(() => {
    setNotifications(prevNotifications => {
      const validNotifications = prevNotifications.filter(n => 
        new Date(n.expires_at) > new Date()
      );
      
      if (validNotifications.length !== prevNotifications.length) {
        saveNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.read).length);
      }
      
      return validNotifications;
    });
  }, [saveNotifications]);

  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getStats = useCallback(() => {
    return {
      total: notifications.length,
      unread: unreadCount,
      read: notifications.length - unreadCount,
      byType: {
        system: notifications.filter(n => n.type === 'system').length,
        comment: notifications.filter(n => n.type === 'comment').length,
        post_published: notifications.filter(n => n.type === 'post_published').length,
        essay_uploaded: notifications.filter(n => n.type === 'essay_uploaded').length,
        mention: notifications.filter(n => n.type === 'mention').length,
      }
    };
  }, [notifications, unreadCount]);

  const editNotification = useCallback((
    notificationId: string,
    updates: Partial<Pick<Notification, 'title' | 'message' | 'data'>>
  ) => {
    setNotifications(prevNotifications => {
      const updatedNotifications = prevNotifications.map(n =>
        n.id === notificationId ? { ...n, ...updates } : n
      );
      saveNotifications(updatedNotifications);
      return updatedNotifications;
    });
    return true;
  }, [saveNotifications]);

  // Solo cargar notificaciones una vez al montar el componente
  useEffect(() => {
    if (user && !initializedRef.current) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification,
    editNotification,
    cleanExpiredNotifications,
    getNotificationsByType,
    getStats,
    refresh: loadNotifications
  };
}