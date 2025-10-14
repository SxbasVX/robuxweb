'use client';
import { useEffect, useState } from 'react';

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration);
          setSwRegistration(registration);

          // Verificar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible
                  console.log('🔄 Nueva versión disponible');
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    }
  }, []);

  // Detectar si la app es instalable
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
      setIsInstallable(true);
      console.log('📱 App is installable');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      console.log('🎉 App installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Detectar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Connection lost');
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar si ya está instalado
  useEffect(() => {
    const checkIfInstalled = () => {
      // Verificar si está en modo standalone (instalado)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        console.log('📱 App running in standalone mode');
      }

      // Verificar si está en iOS Safari standalone
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        console.log('📱 App running in iOS standalone mode');
      }
    };

    checkIfInstalled();
  }, []);

  // Función para instalar la app
  const installApp = async () => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      } else {
        console.log('❌ User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error installing app:', error);
      return false;
    }
  };

  // Función para mostrar notificación de actualización
  const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nueva versión disponible', {
        body: 'Hay una nueva versión de la Plataforma Académica disponible. Recarga la página para actualizarla.',
        icon: '/icons/icon-192x192.png',
        tag: 'app-update'
      });
    } else {
      // Fallback: mostrar mensaje en la interfaz
      console.log('🔄 Nueva versión disponible - recarga la página');
    }
  };

  // Función para actualizar la app
  const updateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // Función para solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);
      return permission === 'granted';
    }
    return false;
  };

  // Función para registrar notificaciones push
  const subscribeToPushNotifications = async () => {
    if (!swRegistration) return null;

    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY // Necesitarás configurar esto
      });

      console.log('📩 Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateApp,
    requestNotificationPermission,
    subscribeToPushNotifications,
    swRegistration
  };
}