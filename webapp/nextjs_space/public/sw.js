// Service Worker for Sun Direct Power Installer Portal
// Provides offline functionality and background sync

const CACHE_NAME = 'sdp-installer-v2';
const RUNTIME_CACHE = 'sdp-runtime-v2';
const IMAGE_CACHE = 'sdp-images-v2';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/admin/dashboard',
  '/admin/leads',
  '/admin/jobs',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME && 
                     name !== RUNTIME_CACHE && 
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip proposal pages - always fetch fresh from network (for customers)
  if (url.pathname.startsWith('/proposal/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip admin pages - always fetch fresh from network (no caching for admin)
  if (url.pathname.startsWith('/admin/')) {
    event.respondWith(fetch(request));
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // HTML pages - Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
});

// Network first strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache GET requests (POST/PUT/DELETE cannot be cached)
    if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    throw error;
  }
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  } else if (event.tag === 'sync-serials') {
    event.waitUntil(syncSerials());
  } else if (event.tag === 'sync-checklist') {
    event.waitUntil(syncChecklist());
  }
});

// Sync photos from IndexedDB to server
async function syncPhotos() {
  console.log('[SW] Syncing photos...');
  
  try {
    // Get pending photos from IndexedDB
    const db = await openDatabase();
    const photos = await getAllPendingPhotos(db);
    
    for (const photo of photos) {
      try {
        const formData = new FormData();
        formData.append('photo', photo.blob);
        formData.append('category', photo.category);
        formData.append('jobId', photo.jobId);
        formData.append('metadata', JSON.stringify(photo.metadata));
        
        const response = await fetch(`/api/admin/jobs/${photo.jobId}/photos`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${photo.token}`
          }
        });
        
        if (response.ok) {
          await deletePendingPhoto(db, photo.id);
          console.log('[SW] Photo synced:', photo.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync photo:', error);
      }
    }
    
    console.log('[SW] Photo sync complete');
  } catch (error) {
    console.error('[SW] Photo sync failed:', error);
  }
}

// Sync serial numbers
async function syncSerials() {
  console.log('[SW] Syncing serial numbers...');
  // Implementation similar to syncPhotos
}

// Sync checklist items
async function syncChecklist() {
  console.log('[SW] Syncing checklist...');
  // Implementation similar to syncPhotos
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sdp-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending_photos')) {
        db.createObjectStore('pending_photos', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending_serials')) {
        db.createObjectStore('pending_serials', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending_checklist')) {
        db.createObjectStore('pending_checklist', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingPhotos(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_photos'], 'readonly');
    const store = transaction.objectStore('pending_photos');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingPhoto(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending_photos'], 'readwrite');
    const store = transaction.objectStore('pending_photos');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Sun Direct Power';
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/admin/dashboard')
  );
});

console.log('[SW] Service worker loaded');
