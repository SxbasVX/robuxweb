// Service Worker para PWA con funcionalidad offline
const CACHE_NAME = 'academia-platform-v1.0.0';
const API_CACHE = 'academia-api-v1.0.0';

// Archivos críticos que siempre se cachean
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html', // Página offline que crearemos
];

// URLs de API que se pueden cachear
const API_URLS = [
  '/api/posts',
  '/api/comments',
  '/api/users'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache de archivos estáticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache de API
      caches.open(API_CACHE).then((cache) => {
        console.log('🌐 API cache ready');
        return Promise.resolve();
      })
    ])
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Reclamar todos los clientes
      return self.clients.claim();
    })
  );
});

// Estrategias de cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar solicitudes que no son HTTP/HTTPS
  if (!request.url.startsWith('http')) return;

  // Estrategia para archivos estáticos
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // Estrategia para imágenes
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Estrategia para API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Estrategia para JavaScript y CSS
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
    return;
  }

  // Para todo lo demás, intentar network first
  event.respondWith(networkFirst(request, CACHE_NAME));
});

// Estrategia: Cache First (bueno para imágenes)
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Cache first failed:', error);
    return new Response('Offline content not available', { 
      status: 408,
      statusText: 'Offline' 
    });
  }
}

// Estrategia: Network First (bueno para API)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network first falling back to cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es una página HTML, devolver página offline
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', { 
      status: 408,
      statusText: 'Network request failed and no cache available' 
    });
  }
}

// Estrategia: Stale While Revalidate (bueno para contenido que cambia)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch en paralelo
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Si falla la red, devolver respuesta cacheada
    return cachedResponse;
  });

  // Devolver cache inmediatamente si existe, sino esperar network
  return cachedResponse || fetchPromise;
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('📩 Push notification received:', event);
  
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar',
        icon: '/icons/close-action.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Plataforma Académica', options)
  );
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Abrir la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no, abrir nueva ventana
      if (clients.openWindow) {
        const url = event.notification.data?.url || '/';
        return clients.openWindow(url);
      }
    })
  );
});

// Manejar sincronización en background
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Función de sincronización en background
async function doBackgroundSync() {
  try {
    // Sincronizar datos pendientes
    console.log('🔄 Performing background sync...');
    
    // Aquí podrías sincronizar:
    // - Posts pendientes de subir
    // - Comentarios no enviados
    // - Archivos en cola de upload
    
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error;
  }
}

// Manejar actualizaciones del Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🚀 Service Worker loaded successfully');