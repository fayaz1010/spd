'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect from new path to existing page
export default function TaxSettingsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/dashboard/tax-settings');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to Tax Settings...</p>
    </div>
  );
}
