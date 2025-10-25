
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Battery } from 'lucide-react';
import Link from 'next/link';
import { BrandTable } from '@/components/admin/brand-table';

export default function BatteryBrandsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchBrands();
  }, [router]);

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/battery-brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error('Error fetching battery brands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 mr-4">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center">
              <Battery className="h-8 w-8 text-coral mr-3" />
              <div>
                <h1 className="text-xl font-bold text-primary">Battery Brands</h1>
                <p className="text-xs text-gray-500">Manage battery brands and models</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Battery Brands</h2>
          <p className="text-gray-600">
            Add different battery brands and assign them to tiers (Budget, Premium, Ultimate).
            The calculator will automatically use these brands to generate package options.
          </p>
        </div>

        <BrandTable brands={brands} type="battery" onRefresh={fetchBrands} />
      </main>
    </div>
  );
}
