'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InstallerProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const electricianId = localStorage.getItem('installer_id');
    if (electricianId) {
      // Redirect to admin electrician edit page
      router.push(`/admin/dashboard/settings/electricians/${electricianId}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Redirecting to profile editor...</p>
        <Link href="/installer/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
