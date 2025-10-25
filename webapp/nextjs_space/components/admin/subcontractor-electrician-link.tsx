'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ExternalLink 
} from 'lucide-react';

interface ElectricianLinkProps {
  subcontractorId: string;
  electricianId?: string | null;
  onLink?: () => void;
}

interface Electrician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  electricalLicense?: string;
  licenseExpiry?: string;
  cecNumber?: string;
  cecExpiry?: string;
  status: string;
  portalAccess: boolean;
}

export function SubcontractorElectricianLink({ subcontractorId, electricianId, onLink }: ElectricianLinkProps) {
  const [electrician, setElectrician] = useState<Electrician | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (electricianId) {
      fetchElectrician();
    }
  }, [electricianId]);

  const fetchElectrician = async () => {
    if (!electricianId) return;
    
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

  if (!electricianId || !electrician) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Electrician Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-50 border-yellow-200 mb-4">
            <AlertDescription className="text-yellow-800">
              No electrician profile linked. Create or link an electrician profile to enable:
              <ul className="list-disc ml-6 mt-2">
                <li>Automatic SLD designer credentials</li>
                <li>License and CEC tracking</li>
                <li>Certificate management</li>
                <li>Portal access for self-service</li>
                <li>Digital signature for documents</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Link href={`/admin/dashboard/settings/electricians/new?subcontractorId=${subcontractorId}&type=SUBCONTRACTOR`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Electrician Profile
              </Button>
            </Link>
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Link Existing Profile
            </Button>
          </div>
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
            Electrician Profile
          </CardTitle>
          <Link href={`/admin/dashboard/settings/electricians/${electrician.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Electrician Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {electrician.firstName} {electrician.lastName}
            </h3>
            <div className="flex gap-2">
              <Badge variant={electrician.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {electrician.status}
              </Badge>
              <Badge variant={electrician.portalAccess ? 'default' : 'secondary'}>
                {electrician.portalAccess ? 'Portal Access' : 'No Portal'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">{electrician.email}</p>
        </div>

        {/* License Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
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
        </div>

        {/* CEC Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">CEC Accreditation</span>
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
        </div>

        {/* Portal Access Alert */}
        {!electrician.portalAccess && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Enable portal access to allow this subcontractor to manage their own profile and documents.
              <Link href={`/admin/dashboard/settings/electricians/${electrician.id}`}>
                <Button variant="link" className="p-0 h-auto text-blue-800 underline ml-1">
                  Enable now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Expiry Alerts */}
        {(licenseStatus.status === 'expired' || licenseStatus.status === 'expiring' ||
          cecStatus.status === 'expired' || cecStatus.status === 'expiring') && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Action Required:</strong> License or CEC accreditation is expired or expiring soon.
              <Link href={`/admin/dashboard/settings/electricians/${electrician.id}`}>
                <Button variant="link" className="p-0 h-auto text-red-800 underline ml-1">
                  Update now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t flex gap-2">
          <Link href={`/admin/dashboard/settings/electricians/${electrician.id}/view`}>
            <Button variant="outline" size="sm">
              View Full Profile
            </Button>
          </Link>
          <Link href={`/admin/dashboard/settings/electricians/${electrician.id}`}>
            <Button variant="outline" size="sm">
              Manage Certificates
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
