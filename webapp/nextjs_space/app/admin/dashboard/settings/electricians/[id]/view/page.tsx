'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Electrician {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  electricalLicense?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiry?: string;
  cecNumber?: string;
  cecAccreditationType?: string;
  cecExpiry?: string;
  digitalSignature?: string;
  hourlyRate?: number;
  dailyRate?: number;
  travelRadius?: number;
  portalAccess: boolean;
  totalJobsCompleted: number;
  averageRating?: number;
  onTimePercentage?: number;
  assignedJobs: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ViewElectricianPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [electrician, setElectrician] = useState<Electrician | null>(null);

  useEffect(() => {
    fetchElectrician();
  }, [params.id]);

  const fetchElectrician = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/electricians/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setElectrician(data);
      }
    } catch (err) {
      console.error('Error fetching electrician:', err);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Not Set', color: 'gray', icon: Clock };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red', icon: AlertCircle };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} days remaining`, color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'valid', label: 'Valid', color: 'green', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!electrician) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Electrician Not Found</h2>
          <Link href="/admin/dashboard/settings/electricians">
            <Button>Back to List</Button>
          </Link>
        </div>
      </div>
    );
  }

  const licenseStatus = getExpiryStatus(electrician.licenseExpiry);
  const cecStatus = getExpiryStatus(electrician.cecExpiry);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/admin/dashboard/settings/electricians"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {electrician.firstName} {electrician.lastName}
                  </h1>
                  <Badge variant={electrician.type === 'IN_HOUSE' ? 'default' : 'secondary'}>
                    {electrician.type === 'IN_HOUSE' ? 'In-House' : 'Subcontractor'}
                  </Badge>
                  <Badge variant={electrician.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {electrician.status}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-1">Electrician Profile</p>
              </div>
            </div>
            <Link href={`/admin/dashboard/settings/electricians/${params.id}`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{electrician.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{electrician.phone || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Mobile</dt>
                    <dd className="mt-1 text-sm text-gray-900">{electrician.mobile || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Address</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {electrician.address ? (
                        <>
                          {electrician.address}<br />
                          {electrician.suburb && `${electrician.suburb}, `}
                          {electrician.state} {electrician.postcode}
                        </>
                      ) : 'Not set'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Licenses & Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Licenses & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Electrical License */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Electrical License</h3>
                    <Badge 
                      variant={licenseStatus.status === 'valid' ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      <licenseStatus.icon className="h-3 w-3" />
                      {licenseStatus.label}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">License Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{electrician.electricalLicense || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">License Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{electrician.licenseNumber || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">State</dt>
                      <dd className="mt-1 text-sm text-gray-900">{electrician.licenseState || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Expiry Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {electrician.licenseExpiry 
                          ? new Date(electrician.licenseExpiry).toLocaleDateString('en-AU')
                          : 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* CEC Accreditation */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">CEC Accreditation</h3>
                    <Badge 
                      variant={cecStatus.status === 'valid' ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      <cecStatus.icon className="h-3 w-3" />
                      {cecStatus.label}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">CEC Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{electrician.cecNumber || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Accreditation Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{electrician.cecAccreditationType || 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Expiry Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {electrician.cecExpiry 
                          ? new Date(electrician.cecExpiry).toLocaleDateString('en-AU')
                          : 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>

            {/* Work Details (for subcontractors) */}
            {electrician.type === 'SUBCONTRACTOR' && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Details & Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Hourly Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {electrician.hourlyRate ? `$${electrician.hourlyRate.toFixed(2)}` : 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Daily Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {electrician.dailyRate ? `$${electrician.dailyRate.toFixed(2)}` : 'Not set'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Travel Radius</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {electrician.travelRadius ? `${electrician.travelRadius} km` : 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Active Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Active Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {electrician.assignedJobs && electrician.assignedJobs.length > 0 ? (
                  <div className="space-y-3">
                    {electrician.assignedJobs.map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{job.jobNumber}</p>
                          <p className="text-sm text-gray-600">{job.status}</p>
                        </div>
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">View Job</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No active jobs assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Status */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Jobs Completed</p>
                  <p className="text-2xl font-bold">{electrician.totalJobsCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold">{electrician.assignedJobs?.length || 0}</p>
                </div>
                {electrician.averageRating && (
                  <div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{electrician.averageRating.toFixed(1)} / 5.0</p>
                  </div>
                )}
                {electrician.onTimePercentage && (
                  <div>
                    <p className="text-sm text-gray-600">On-Time Percentage</p>
                    <p className="text-2xl font-bold">{electrician.onTimePercentage.toFixed(0)}%</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portal Access */}
            <Card>
              <CardHeader>
                <CardTitle>Portal Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={electrician.portalAccess ? 'default' : 'secondary'}>
                    {electrician.portalAccess ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(electrician.createdAt).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(electrician.updatedAt).toLocaleDateString('en-AU')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
