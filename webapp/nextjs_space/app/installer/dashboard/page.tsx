'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, 
  Briefcase, 
  User, 
  Upload, 
  LogOut,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Electrician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  electricalLicense?: string;
  licenseExpiry?: string;
  cecNumber?: string;
  cecExpiry?: string;
  totalJobsCompleted: number;
  assignedJobs: any[];
}

export default function InstallerDashboard() {
  const router = useRouter();
  const [electrician, setElectrician] = useState<Electrician | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('installer_token');
      const electricianId = localStorage.getItem('installer_id');
      
      if (!token || !electricianId) {
        router.push('/installer');
        return;
      }

      const response = await fetch(`/api/electricians/${electricianId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setElectrician(data);
      } else {
        router.push('/installer');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/installer');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('installer_token');
    localStorage.removeItem('installer_id');
    router.push('/installer');
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Not Set', color: 'gray', icon: Clock };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red', icon: AlertCircle };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} days`, color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'valid', label: 'Valid', color: 'green', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!electrician) {
    return null;
  }

  const licenseStatus = getExpiryStatus(electrician.licenseExpiry);
  const cecStatus = getExpiryStatus(electrician.cecExpiry);

  const menuItems = [
    {
      title: 'My Jobs',
      description: 'View assigned jobs and schedules',
      icon: Briefcase,
      href: '/installer/dashboard/jobs',
      count: electrician.assignedJobs?.length || 0,
    },
    {
      title: 'Documents',
      description: 'Generate SLDs and compliance docs',
      icon: FileText,
      href: '/installer/dashboard/documents',
    },
    {
      title: 'My Profile',
      description: 'Update licenses and certificates',
      icon: User,
      href: '/installer/dashboard/profile',
    },
    {
      title: 'Upload Documents',
      description: 'Upload certificates and photos',
      icon: Upload,
      href: '/installer/dashboard/uploads',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {electrician.firstName}!
              </h1>
              <p className="text-gray-600">Installer Portal</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{electrician.assignedJobs?.length || 0}</div>
              <p className="text-xs text-gray-600">Active Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{electrician.totalJobsCompleted}</div>
              <p className="text-xs text-gray-600">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <licenseStatus.icon className={`h-5 w-5 text-${licenseStatus.color}-600`} />
                <div className="text-sm font-semibold">{licenseStatus.label}</div>
              </div>
              <p className="text-xs text-gray-600">License Status</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <cecStatus.icon className={`h-5 w-5 text-${cecStatus.color}-600`} />
                <div className="text-sm font-semibold">{cecStatus.label}</div>
              </div>
              <p className="text-xs text-gray-600">CEC Status</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {(licenseStatus.status === 'expired' || licenseStatus.status === 'expiring' ||
          cecStatus.status === 'expired' || cecStatus.status === 'expiring') && (
          <Card className="mb-8 bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Action Required</h3>
                  <p className="text-sm text-red-800 mt-1">
                    Your license or CEC accreditation is expired or expiring soon. Please update your credentials.
                  </p>
                  <Link href="/installer/dashboard/profile">
                    <Button variant="outline" size="sm" className="mt-3">
                      Update Now
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    {item.count !== undefined && (
                      <Badge>{item.count}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-600">Electrical License</dt>
                <dd className="mt-1 text-sm text-gray-900">{electrician.electricalLicense || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">CEC Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{electrician.cecNumber || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{electrician.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
