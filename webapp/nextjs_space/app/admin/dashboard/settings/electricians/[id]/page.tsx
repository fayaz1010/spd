'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  licenseCertificate?: string;
  cecNumber?: string;
  cecAccreditationType?: string;
  cecExpiry?: string;
  cecCertificate?: string;
  digitalSignature?: string;
  hourlyRate?: number;
  dailyRate?: number;
  travelRadius?: number;
  portalAccess: boolean;
  totalJobsCompleted: number;
  assignedJobs: any[];
}

export default function EditElectricianPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [electrician, setElectrician] = useState<Electrician | null>(null);
  const [formData, setFormData] = useState<any>({});

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
        setFormData({
          ...data,
          licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().split('T')[0] : '',
          cecExpiry: data.cecExpiry ? new Date(data.cecExpiry).toISOString().split('T')[0] : '',
          hourlyRate: data.hourlyRate?.toString() || '',
          dailyRate: data.dailyRate?.toString() || '',
          travelRadius: data.travelRadius?.toString() || '',
        });
      } else {
        setError('Electrician not found');
      }
    } catch (err) {
      console.error('Error fetching electrician:', err);
      setError('Failed to load electrician');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('admin_token');
      
      const submitData = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : null,
        travelRadius: formData.travelRadius ? parseFloat(formData.travelRadius) : null,
        licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : null,
        cecExpiry: formData.cecExpiry ? new Date(formData.cecExpiry).toISOString() : null,
      };

      const response = await fetch(`/api/electricians/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setSuccess('Electrician updated successfully!');
        fetchElectrician(); // Refresh data
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update electrician');
      }
    } catch (err) {
      console.error('Error updating electrician:', err);
      setError('Failed to update electrician. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', label: 'Not Set', color: 'gray' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'red', icon: AlertCircle };
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', label: `Expires in ${daysUntilExpiry} days`, color: 'yellow', icon: AlertCircle };
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
                <p className="text-gray-600 mt-1">
                  {electrician.totalJobsCompleted} jobs completed • {electrician.assignedJobs?.length || 0} active jobs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/dashboard/settings/electricians">
                <Button variant="outline">Back to List</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="licenses">Licenses</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="work">Work Details</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type *</Label>
                      <select
                        value={formData.type}
                        onChange={(e) => updateField('type', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="IN_HOUSE">In-House</option>
                        <option value="SUBCONTRACTOR">Subcontractor</option>
                      </select>
                    </div>
                    <div>
                      <Label>Status *</Label>
                      <select
                        value={formData.status}
                        onChange={(e) => updateField('status', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Mobile</Label>
                      <Input
                        value={formData.mobile || ''}
                        onChange={(e) => updateField('mobile', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Suburb</Label>
                      <Input
                        value={formData.suburb || ''}
                        onChange={(e) => updateField('suburb', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <select
                        value={formData.state || 'WA'}
                        onChange={(e) => updateField('state', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="WA">WA</option>
                        <option value="NSW">NSW</option>
                        <option value="VIC">VIC</option>
                        <option value="QLD">QLD</option>
                        <option value="SA">SA</option>
                        <option value="TAS">TAS</option>
                        <option value="NT">NT</option>
                        <option value="ACT">ACT</option>
                      </select>
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input
                        value={formData.postcode || ''}
                        onChange={(e) => updateField('postcode', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Licenses Tab */}
            <TabsContent value="licenses">
              <Card>
                <CardHeader>
                  <CardTitle>Licenses & Accreditations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Electrical License */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Electrical License</h3>
                      {licenseStatus.status !== 'unknown' && (
                        <Badge 
                          variant={licenseStatus.status === 'valid' ? 'default' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          <licenseStatus.icon className="h-3 w-3" />
                          {licenseStatus.label}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>License Type</Label>
                        <Input
                          value={formData.electricalLicense || ''}
                          onChange={(e) => updateField('electricalLicense', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>License Number</Label>
                        <Input
                          value={formData.licenseNumber || ''}
                          onChange={(e) => updateField('licenseNumber', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>License State</Label>
                        <select
                          value={formData.licenseState || 'WA'}
                          onChange={(e) => updateField('licenseState', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="WA">WA</option>
                          <option value="NSW">NSW</option>
                          <option value="VIC">VIC</option>
                          <option value="QLD">QLD</option>
                          <option value="SA">SA</option>
                          <option value="TAS">TAS</option>
                          <option value="NT">NT</option>
                          <option value="ACT">ACT</option>
                        </select>
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          type="date"
                          value={formData.licenseExpiry || ''}
                          onChange={(e) => updateField('licenseExpiry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CEC Accreditation */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">CEC Accreditation</h3>
                      {cecStatus.status !== 'unknown' && (
                        <Badge 
                          variant={cecStatus.status === 'valid' ? 'default' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          <cecStatus.icon className="h-3 w-3" />
                          {cecStatus.label}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CEC Number</Label>
                        <Input
                          value={formData.cecNumber || ''}
                          onChange={(e) => updateField('cecNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Accreditation Type</Label>
                        <select
                          value={formData.cecAccreditationType || 'Both'}
                          onChange={(e) => updateField('cecAccreditationType', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="Designer">Designer</option>
                          <option value="Installer">Installer</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>CEC Expiry Date</Label>
                      <Input
                        type="date"
                        value={formData.cecExpiry || ''}
                        onChange={(e) => updateField('cecExpiry', e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Uploads</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      <Upload className="h-4 w-4 inline mr-2" />
                      Certificate upload functionality will be added in Phase 3C. For now, you can store certificate URLs.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label>Electrical License Certificate URL</Label>
                    <Input
                      value={formData.licenseCertificate || ''}
                      onChange={(e) => updateField('licenseCertificate', e.target.value)}
                      placeholder="/uploads/certificates/license.pdf"
                    />
                  </div>

                  <div>
                    <Label>CEC Certificate URL</Label>
                    <Input
                      value={formData.cecCertificate || ''}
                      onChange={(e) => updateField('cecCertificate', e.target.value)}
                      placeholder="/uploads/certificates/cec.pdf"
                    />
                  </div>

                  <div>
                    <Label>Digital Signature URL</Label>
                    <Input
                      value={formData.digitalSignature || ''}
                      onChange={(e) => updateField('digitalSignature', e.target.value)}
                      placeholder="/uploads/signatures/signature.png"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Used for signing SLDs and compliance documents
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Work Details Tab */}
            <TabsContent value="work">
              <Card>
                <CardHeader>
                  <CardTitle>Work Details & Rates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.type === 'SUBCONTRACTOR' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Hourly Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.hourlyRate}
                            onChange={(e) => updateField('hourlyRate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Daily Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.dailyRate}
                            onChange={(e) => updateField('dailyRate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Travel Radius (km)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={formData.travelRadius}
                          onChange={(e) => updateField('travelRadius', e.target.value)}
                          className="max-w-md"
                        />
                      </div>
                    </>
                  ) : (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-800">
                        Work details for in-house staff are managed through the team member profile.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portal Access Tab */}
            <TabsContent value="portal">
              <Card>
                <CardHeader>
                  <CardTitle>Portal Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Portal Access</h3>
                      <p className="text-sm text-gray-600">
                        {formData.portalAccess 
                          ? 'This electrician can access the installer portal'
                          : 'Portal access is currently disabled'}
                      </p>
                    </div>
                    <Badge variant={formData.portalAccess ? 'default' : 'secondary'}>
                      {formData.portalAccess ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      Portal access allows electricians to:
                      <ul className="list-disc ml-6 mt-2">
                        <li>View assigned jobs</li>
                        <li>Upload certificates and documents</li>
                        <li>Generate SLDs with their credentials</li>
                        <li>Manage their profile</li>
                        <li>Submit compliance documents</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => updateField('portalAccess', !formData.portalAccess)}
                  >
                    {formData.portalAccess ? 'Disable' : 'Enable'} Portal Access
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end gap-2">
            <Link href="/admin/dashboard/settings/electricians">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
