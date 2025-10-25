'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  X,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  registerServiceWorker,
  isPWAInstalled,
  isOnline,
  getPendingSyncCount,
  requestBackgroundSync,
  type PWAInstallPrompt as PWAPromptEvent
} from '@/lib/pwa';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState({ total: 0, photos: 0, serials: 0, checklist: 0 });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isPWAInstalled());

    // Register service worker
    registerServiceWorker();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAPromptEvent);
      
      // Show prompt if not installed
      if (!isPWAInstalled()) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      toast.success('App installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for online/offline
    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online! Syncing data...');
      syncPendingData();
    };

    const handleOffline = () => {
      setOnline(false);
      toast.error('You are offline. Data will sync when connection is restored.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial online status
    setOnline(isOnline());

    // Check pending sync count
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // Check every 10s

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await getPendingSyncCount();
    setPendingSync(count);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Install prompt not available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('Installing app...');
      } else {
        toast.info('Installation cancelled');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Failed to install app');
    }
  };

  const syncPendingData = async () => {
    if (!online || syncing) return;

    setSyncing(true);
    try {
      // Request background sync for all types
      await requestBackgroundSync('sync-photos');
      await requestBackgroundSync('sync-serials');
      await requestBackgroundSync('sync-checklist');

      toast.success('Syncing data in background...');
      
      // Update count after a delay
      setTimeout(updatePendingCount, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {/* Online/Offline Indicator */}
        <div className="mb-2">
          <Alert className={online ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            {online ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={online ? 'text-green-800' : 'text-red-800'}>
              {online ? 'Online' : 'Offline - Working locally'}
            </AlertDescription>
          </Alert>
        </div>

        {/* Pending Sync Indicator */}
        {pendingSync.total > 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <RefreshCw className={`h-4 w-4 text-yellow-600 ${syncing ? 'animate-spin' : ''}`} />
            <AlertDescription className="text-yellow-800">
              <div className="flex items-center justify-between">
                <span>{pendingSync.total} items pending sync</span>
                {online && !syncing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={syncPendingData}
                    className="ml-2"
                  >
                    Sync Now
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show install prompt
  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert className="bg-blue-50 border-blue-200 shadow-lg">
        <Smartphone className="h-5 w-5 text-blue-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Install Installer App
              </h3>
              <p className="text-sm text-blue-800">
                Install the app for offline access, faster loading, and a better experience.
              </p>
            </div>

            <div className="text-xs text-blue-700 space-y-1">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Work offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Auto-sync when online</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Faster performance</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
