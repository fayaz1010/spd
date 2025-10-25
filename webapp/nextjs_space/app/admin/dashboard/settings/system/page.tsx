'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from new path to existing page
export default function SystemSettingsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/dashboard/system-settings');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to System Settings...</p>
    </div>
  );
}
