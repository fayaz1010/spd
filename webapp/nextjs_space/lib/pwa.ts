// PWA Utilities - Service Worker, Install Prompt, Offline Detection

export interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[PWA] New service worker found');

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New service worker installed, update available');
            // Notify user about update
            notifyUpdate();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const success = await registration.unregister();
      console.log('[PWA] Service worker unregistered:', success);
      return success;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Service worker unregistration failed:', error);
    return false;
  }
}

/**
 * Check if app is installed as PWA
 */
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if running as PWA on iOS
  const isIOSPWA = (window.navigator as any).standalone === true;

  return isStandalone || isIOSPWA;
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    }
    
    console.log('[PWA] Background sync not supported');
    return false;
  } catch (error) {
    console.error('[PWA] Background sync failed:', error);
    return false;
  }
}

/**
 * Save data for offline sync
 */
export async function saveForOfflineSync(
  storeName: string,
  data: any
): Promise<boolean> {
  try {
    const db = await openOfflineDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    await new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    console.log('[PWA] Data saved for offline sync:', storeName);
    return true;
  } catch (error) {
    console.error('[PWA] Failed to save for offline sync:', error);
    return false;
  }
}

/**
 * Open offline database
 */
function openOfflineDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sdp-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
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

/**
 * Get pending sync count
 */
export async function getPendingSyncCount(): Promise<{
  photos: number;
  serials: number;
  checklist: number;
  total: number;
}> {
  try {
    const db = await openOfflineDatabase();
    
    const photos = await getStoreCount(db, 'pending_photos');
    const serials = await getStoreCount(db, 'pending_serials');
    const checklist = await getStoreCount(db, 'pending_checklist');
    
    return {
      photos,
      serials,
      checklist,
      total: photos + serials + checklist
    };
  } catch (error) {
    console.error('[PWA] Failed to get pending sync count:', error);
    return { photos: 0, serials: 0, checklist: 0, total: 0 };
  }
}

function getStoreCount(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Notify user about update
 */
function notifyUpdate() {
  if (typeof window === 'undefined') return;

  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Show local notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      ...options
    });
    return true;
  } catch (error) {
    console.error('[PWA] Failed to show notification:', error);
    return false;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return false;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
    return true;
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error);
    return false;
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0;
  }

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('[PWA] Failed to get cache size:', error);
    return 0;
  }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
