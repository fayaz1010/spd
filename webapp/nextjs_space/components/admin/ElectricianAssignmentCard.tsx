'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  User,
  Loader2
} from 'lucide-react';

interface ElectricianAssignmentCardProps {
  jobId: string;
  electricianId?: string | null;
  onAssignmentChange?: () => void;
}

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
}

export function ElectricianAssignmentCard({ 
  jobId, 
  electricianId, 
  onAssignmentChange 
}: ElectricianAssignmentCardProps) {
  const [electrician, setElectrician] = useState<Electrician | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (electricianId) {
      fetchElectrician();
    }
  }, [electricianId]);

  const fetchElectrician = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/electricians/${electricianId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setElectrician(data);
      }
    } catch (error) {
      console.error('Error fetching electrician:', error);
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
      return { status: 'expiring', label: `${daysUntilExpiry} days`, color: 'yellow', icon: AlertCircle };
    } else {
      return { status: 'valid', label: 'Valid', color: 'green', icon: CheckCircle };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!electricianId || !electrician) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Lead Electrician Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>No electrician assigned.</strong> Documents will use default designer credentials.
              Assign an electrician to use their license and CEC details in compliance documents.
            </AlertDescription>
          </Alert>
          <Link href={`/admin/dashboard/settings/electricians?assignToJob=${jobId}`}>
            <Button>
              <User className="mr-2 h-4 w-4" />
              Assign Electrician
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const licenseStatus = getExpiryStatus(electrician.licenseExpiry);
  const cecStatus = getExpiryStatus(electrician.cecExpiry);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Lead Electrician
          </CardTitle>
          <div className="flex gap-2">
            <Link href={`/admin/dashboard/settings/electricians?assignToJob=${jobId}`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Change
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Electrician Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">
              {electrician.firstName} {electrician.lastName}
            </h3>
            <Badge variant={electrician.type === 'IN_HOUSE' ? 'default' : 'secondary'}>
              {electrician.type === 'IN_HOUSE' ? 'In-House' : 'Subcontractor'}
            </Badge>
            <Badge variant={electrician.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {electrician.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{electrician.email}</p>
          {electrician.phone && (
            <p className="text-sm text-gray-600">{electrician.phone}</p>
          )}
        </div>

        {/* Credentials Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">
            Designer Credentials (for SLD & Documents)
          </h4>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-blue-700 font-medium">Designer Name</dt>
              <dd className="text-blue-900">{electrician.firstName} {electrician.lastName}</dd>
            </div>
            <div>
              <dt className="text-blue-700 font-medium">Email</dt>
              <dd className="text-blue-900">{electrician.email}</dd>
            </div>
          </dl>
        </div>

        {/* License Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Electrical License</span>
              <Badge 
                variant={licenseStatus.status === 'valid' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <licenseStatus.icon className="h-3 w-3" />
                {licenseStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {electrician.electricalLicense || 'Not set'}
            </p>
            {electrician.licenseExpiry && (
              <p className="text-xs text-gray-500 mt-1">
                Expires: {new Date(electrician.licenseExpiry).toLocaleDateString('en-AU')}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">CEC Number</span>
              <Badge 
                variant={cecStatus.status === 'valid' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                <cecStatus.icon className="h-3 w-3" />
                {cecStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {electrician.cecNumber || 'Not set'}
            </p>
            {electrician.cecExpiry && (
              <p className="text-xs text-gray-500 mt-1">
                Expires: {new Date(electrician.cecExpiry).toLocaleDateString('en-AU')}
              </p>
            )}
          </div>
        </div>

        {/* Expiry Alerts */}
        {(licenseStatus.status === 'expired' || licenseStatus.status === 'expiring' ||
          cecStatus.status === 'expired' || cecStatus.status === 'expiring') && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Action Required:</strong> License or CEC accreditation is expired or expiring soon. 
              Documents may not be compliant.
              <Link href={`/admin/dashboard/settings/electricians/${electricianId}`}>
                <Button variant="link" className="p-0 h-auto text-red-800 underline ml-1">
                  Update Credentials Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Link href={`/admin/dashboard/settings/electricians/${electricianId}/view`}>
            <Button variant="outline" size="sm">
              View Full Profile
            </Button>
          </Link>
          <Link href={`/admin/dashboard/settings/electricians/${electricianId}`}>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
