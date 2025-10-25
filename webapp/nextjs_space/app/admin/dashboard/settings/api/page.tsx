'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from old path to maintain backward compatibility
export default function ApiSettingsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if we're coming from the old path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/settings/api')) {
      // Already at new path, load the actual page
      router.replace('/admin/dashboard/api-settings');
    }
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to API Settings...</p>
    </div>
  );
}
