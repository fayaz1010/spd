'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Edit,
  Eye
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Electrician {
  id: string;
  type: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  electricalLicense?: string;
  licenseExpiry?: string;
  cecNumber?: string;
  cecExpiry?: string;
  totalJobsCompleted: number;
  assignedJobs: any[];
}

export default function ElectricianManagementPage() {
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [assignToJobId, setAssignToJobId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in assignment mode
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get('assignToJob');
    if (jobId) {
      setAssignToJobId(jobId);
    }
    fetchElectricians();
  }, [filterType]);

  const fetchElectricians = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const url = filterType === 'ALL' 
        ? '/api/electricians'
        : `/api/electricians?type=${filterType}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setElectricians(data);
      }
    } catch (error) {
      console.error('Error fetching electricians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignElectrician = async (electricianId: string) => {
    if (!assignToJobId) return;
    
    setAssigning(electricianId);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${assignToJobId}/assign-electrician`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ electricianId }),
      });

      if (response.ok) {
        // Redirect back to lead detail page
        window.location.href = `/admin/leads/${assignToJobId}`;
      }
    } catch (error) {
      console.error('Error assigning electrician:', error);
    } finally {
      setAssigning(null);
    }
  };

  const filteredElectricians = electricians.filter(elec =>
    `${elec.firstName} ${elec.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elec.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elec.electricalLicense?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    elec.cecNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Not Set', color: 'gray' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', label: `${daysUntilExpiry} days`, color: 'yellow' };
    } else {
      return { status: 'valid', label: 'Valid', color: 'green' };
    }
  };

  const stats = {
    total: electricians.length,
    inHouse: electricians.filter(e => e.type === 'IN_HOUSE').length,
    subcontractors: electricians.filter(e => e.type === 'SUBCONTRACTOR').length,
    active: electricians.filter(e => e.status === 'ACTIVE').length,
    expiringLicenses: electricians.filter(e => {
      const status = getExpiryStatus(e.licenseExpiry);
      return status.status === 'expiring' || status.status === 'expired';
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading electricians...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href={assignToJobId ? `/admin/leads/${assignToJobId}` : "/admin/dashboard"}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {assignToJobId ? 'Assign Electrician to Job' : 'Electrician Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {assignToJobId 
                    ? 'Select an electrician to assign as lead electrician for this job'
                    : 'Manage electrician profiles, licenses, and certificates'
                  }
                </p>
              </div>
            </div>
            {!assignToJobId && (
              <Link href="/admin/dashboard/settings/electricians/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Electrician
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-600">Total Electricians</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.inHouse}</div>
              <p className="text-xs text-gray-600">In-House</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.subcontractors}</div>
              <p className="text-xs text-gray-600">Subcontractors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-gray-600">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.expiringLicenses}</div>
              <p className="text-xs text-gray-600">Expiring Soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, license, or CEC number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={filterType} onValueChange={setFilterType}>
                <TabsList>
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="IN_HOUSE">In-House</TabsTrigger>
                  <TabsTrigger value="SUBCONTRACTOR">Subcontractors</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Electricians List */}
        {filteredElectricians.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No electricians found</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first electrician</p>
              <Link href="/admin/dashboard/settings/electricians/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Electrician
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredElectricians.map((electrician) => {
              const licenseStatus = getExpiryStatus(electrician.licenseExpiry);
              const cecStatus = getExpiryStatus(electrician.cecExpiry);
              
              return (
                <Card key={electrician.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {electrician.firstName} {electrician.lastName}
                          </h3>
                          <Badge variant={electrician.type === 'IN_HOUSE' ? 'default' : 'secondary'}>
                            {electrician.type === 'IN_HOUSE' ? 'In-House' : 'Subcontractor'}
                          </Badge>
                          <Badge variant={electrician.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {electrician.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium">{electrician.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium">{electrician.phone || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 flex items-center">
                              Electrical License
                              {licenseStatus.status === 'expired' && (
                                <AlertCircle className="ml-1 h-3 w-3 text-red-600" />
                              )}
                              {licenseStatus.status === 'expiring' && (
                                <Clock className="ml-1 h-3 w-3 text-yellow-600" />
                              )}
                              {licenseStatus.status === 'valid' && (
                                <CheckCircle className="ml-1 h-3 w-3 text-green-600" />
                              )}
                            </p>
                            <p className="font-medium">{electrician.electricalLicense || 'Not set'}</p>
                            {electrician.licenseExpiry && (
                              <p className={`text-xs text-${licenseStatus.color}-600`}>
                                {licenseStatus.label}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-600 flex items-center">
                              CEC Number
                              {cecStatus.status === 'expired' && (
                                <AlertCircle className="ml-1 h-3 w-3 text-red-600" />
                              )}
                              {cecStatus.status === 'expiring' && (
                                <Clock className="ml-1 h-3 w-3 text-yellow-600" />
                              )}
                              {cecStatus.status === 'valid' && (
                                <CheckCircle className="ml-1 h-3 w-3 text-green-600" />
                              )}
                            </p>
                            <p className="font-medium">{electrician.cecNumber || 'Not set'}</p>
                            {electrician.cecExpiry && (
                              <p className={`text-xs text-${cecStatus.color}-600`}>
                                {cecStatus.label}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                          <span>{electrician.totalJobsCompleted} jobs completed</span>
                          <span>•</span>
                          <span>{electrician.assignedJobs?.length || 0} active jobs</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {assignToJobId ? (
                          <Button 
                            onClick={() => handleAssignElectrician(electrician.id)}
                            disabled={assigning === electrician.id || electrician.status !== 'ACTIVE'}
                            size="sm"
                          >
                            {assigning === electrician.id ? 'Assigning...' : 'Assign to Job'}
                          </Button>
                        ) : (
                          <>
                            <Link href={`/admin/dashboard/settings/electricians/${electrician.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/dashboard/settings/electricians/${electrician.id}/view`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
