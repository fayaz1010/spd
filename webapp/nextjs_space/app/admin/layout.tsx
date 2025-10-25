import { Toaster } from 'react-hot-toast';
import { PWAInstallPrompt } from '@/components/admin/PWAInstallPrompt';

// Force dynamic rendering - disable all caching for admin pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
      <PWAInstallPrompt />
    </>
  );
}
