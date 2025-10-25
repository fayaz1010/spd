'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Users, UserCheck, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewElectricianPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [electricianType, setElectricianType] = useState<'STAFF' | 'FREELANCE' | 'SUBCONTRACTOR' | null>(null);
  
  // Lists for selection
  const [staffList, setStaffList] = useState<any[]>([]);
  const [subcontractorList, setSubcontractorList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    // Type & Status
    type: 'FREELANCE',
    status: 'ACTIVE',
    
    // Personal Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    
    // Address
    address: '',
    suburb: '',
    state: 'WA',
    postcode: '',
    
    // Electrical License
    electricalLicense: '',
    licenseNumber: '',
    licenseState: 'WA',
    licenseExpiry: '',
    
    // CEC Accreditation
    cecNumber: '',
    cecAccreditationType: 'Both',
    cecExpiry: '',
    
    // Work Details (for subcontractors)
    hourlyRate: '',
    dailyRate: '',
    travelRadius: '',
  });

  // Fetch staff and subcontractors on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        
        // Fetch staff members
        const staffRes = await fetch('/api/admin/staff', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData.staff || []);
        }
        
        // Fetch subcontractors
        const subRes = await fetch('/api/admin/subcontractors', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubcontractorList(subData.subcontractors || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTypeSelection = (type: 'STAFF' | 'FREELANCE' | 'SUBCONTRACTOR') => {
    setElectricianType(type);
    setStep('form');
    
    // Update form type based on selection
    if (type === 'STAFF') {
      setFormData({ ...formData, type: 'IN_HOUSE' });
    } else if (type === 'FREELANCE') {
      setFormData({ ...formData, type: 'FREELANCE' });
    } else {
      setFormData({ ...formData, type: 'SUBCONTRACTOR' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      
      // Prepare data based on type
      const submitData: any = {
        electricianType,
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : null,
        travelRadius: formData.travelRadius ? parseFloat(formData.travelRadius) : null,
        licenseExpiry: formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString() : null,
        cecExpiry: formData.cecExpiry ? new Date(formData.cecExpiry).toISOString() : null,
      };

      // Add IDs based on type
      if (electricianType === 'STAFF') {
        submitData.staffId = selectedStaffId;
      } else if (electricianType === 'SUBCONTRACTOR') {
        submitData.subcontractorId = selectedSubcontractorId;
      }

      const response = await fetch('/api/electricians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const electrician = await response.json();
        router.push(`/admin/dashboard/settings/electricians/${electrician.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create electrician');
      }
    } catch (err) {
      console.error('Error creating electrician:', err);
      setError('Failed to create electrician. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Selection Step Render
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center">
              <Link 
                href="/admin/dashboard/settings/electricians"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Add New Electrician</h1>
                <p className="text-gray-600 mt-1">Choose how to add the electrician</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Staff Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500"
              onClick={() => handleTypeSelection('STAFF')}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Link to Staff Member</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  For in-house employees already in the system
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>✓ Full staff functionality</p>
                  <p>✓ Payroll & attendance</p>
                  <p>✓ Performance tracking</p>
                </div>
              </CardContent>
            </Card>

            {/* Freelance Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500"
              onClick={() => handleTypeSelection('FREELANCE')}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Add Freelance Electrician</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Independent contractors with their own rates
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>✓ Set hourly/daily rates</p>
                  <p>✓ Independent profile</p>
                  <p>✓ Job assignment ready</p>
                </div>
              </CardContent>
            </Card>

            {/* Subcontractor Option */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-purple-500"
              onClick={() => handleTypeSelection('SUBCONTRACTOR')}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Link to Subcontractor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  From registered subcontractor companies
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>✓ Company rates apply</p>
                  <p>✓ Insurance tracking</p>
                  <p>✓ Portal access</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                className="mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add {electricianType === 'STAFF' ? 'Staff' : electricianType === 'FREELANCE' ? 'Freelance' : 'Subcontractor'} Electrician
                </h1>
                <p className="text-gray-600 mt-1">Enter electrician details and credentials</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/dashboard/settings/electricians">
                <Button variant="outline">Cancel</Button>
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
                    Save Electrician
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

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Details</TabsTrigger>
              <TabsTrigger value="licenses">Licenses & CEC</TabsTrigger>
              <TabsTrigger value="work">Work Details</TabsTrigger>
              <TabsTrigger value="portal">Portal Access</TabsTrigger>
            </TabsList>

            {/* Personal Details Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {electricianType === 'STAFF' ? 'Select Staff Member' : 
                     electricianType === 'SUBCONTRACTOR' ? 'Select Subcontractor' : 
                     'Personal Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* STAFF: Select from existing staff */}
                  {electricianType === 'STAFF' && (
                    <>
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-800">
                          Select an existing staff member to link as an electrician. Their staff profile will remain active with full functionality.
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label>Staff Member *</Label>
                        <select
                          value={selectedStaffId}
                          onChange={(e) => {
                            setSelectedStaffId(e.target.value);
                            const staff = staffList.find(s => s.id === e.target.value);
                            if (staff) {
                              setFormData({
                                ...formData,
                                firstName: staff.name.split(' ')[0] || '',
                                lastName: staff.name.split(' ').slice(1).join(' ') || '',
                                email: staff.email,
                                phone: staff.phone || '',
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">-- Select Staff Member --</option>
                          {staffList.filter(s => !s.electricianId).map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name} ({staff.email}) - {staff.role}
                            </option>
                          ))}
                        </select>
                        {staffList.filter(s => !s.electricianId).length === 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            No available staff members. All staff already linked to electricians.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* SUBCONTRACTOR: Select from existing subcontractors */}
                  {electricianType === 'SUBCONTRACTOR' && (
                    <>
                      <Alert className="bg-purple-50 border-purple-200">
                        <AlertDescription className="text-purple-800">
                          Select an existing subcontractor company. The lead electrician will be linked to this company.
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label>Subcontractor Company *</Label>
                        <select
                          value={selectedSubcontractorId}
                          onChange={(e) => {
                            setSelectedSubcontractorId(e.target.value);
                            const sub = subcontractorList.find(s => s.id === e.target.value);
                            if (sub) {
                              setFormData({
                                ...formData,
                                firstName: sub.contactName.split(' ')[0] || '',
                                lastName: sub.contactName.split(' ').slice(1).join(' ') || '',
                                email: sub.email,
                                phone: sub.phone || '',
                              });
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">-- Select Subcontractor --</option>
                          {subcontractorList.filter(s => !s.electricianId).map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.companyName} - {sub.contactName}
                            </option>
                          ))}
                        </select>
                        {subcontractorList.filter(s => !s.electricianId).length === 0 && (
                          <p className="text-sm text-red-600 mt-2">
                            No available subcontractors. All already linked to electricians.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* FREELANCE: Full form */}
                  {electricianType === 'FREELANCE' && (
                    <>
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-green-800">
                          Enter details for a new freelance electrician. They will have an independent profile.
                        </AlertDescription>
                      </Alert>
                      
                      {/* Status */}
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

                  {/* Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="(08) 1234 5678"
                      />
                    </div>
                    <div>
                      <Label>Mobile</Label>
                      <Input
                        value={formData.mobile}
                        onChange={(e) => updateField('mobile', e.target.value)}
                        placeholder="0412 345 678"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Suburb</Label>
                      <Input
                        value={formData.suburb}
                        onChange={(e) => updateField('suburb', e.target.value)}
                        placeholder="Perth"
                      />
                    </div>
                    <div>
                      <Label>State</Label>
                      <select
                        value={formData.state}
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
                        value={formData.postcode}
                        onChange={(e) => updateField('postcode', e.target.value)}
                        placeholder="6000"
                      />
                    </div>
                  </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Licenses & CEC Tab */}
            <TabsContent value="licenses">
              <Card>
                <CardHeader>
                  <CardTitle>Licenses & Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Electrical License */}
                  <div>
                    <h3 className="font-semibold mb-3">Electrical License</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>License Type</Label>
                        <Input
                          value={formData.electricalLicense}
                          onChange={(e) => updateField('electricalLicense', e.target.value)}
                          placeholder="e.g., Electrical Contractor"
                        />
                      </div>
                      <div>
                        <Label>License Number</Label>
                        <Input
                          value={formData.licenseNumber}
                          onChange={(e) => updateField('licenseNumber', e.target.value)}
                          placeholder="EC123456"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label>License State</Label>
                        <select
                          value={formData.licenseState}
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
                          value={formData.licenseExpiry}
                          onChange={(e) => updateField('licenseExpiry', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CEC Accreditation */}
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">CEC Accreditation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>CEC Number</Label>
                        <Input
                          value={formData.cecNumber}
                          onChange={(e) => updateField('cecNumber', e.target.value)}
                          placeholder="A1234567"
                        />
                      </div>
                      <div>
                        <Label>Accreditation Type</Label>
                        <select
                          value={formData.cecAccreditationType}
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
                        value={formData.cecExpiry}
                        onChange={(e) => updateField('cecExpiry', e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      💡 You can upload certificate files after creating the electrician profile.
                    </AlertDescription>
                  </Alert>
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
                  {electricianType === 'STAFF' ? (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertDescription className="text-blue-800">
                        Work details and rates are managed through the team member profile for in-house staff.
                      </AlertDescription>
                    </Alert>
                  ) : electricianType === 'FREELANCE' ? (
                    <>
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-green-800">
                          Set rates for this freelance electrician. These will be used for job costing and quotes.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Hourly Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.hourlyRate}
                            onChange={(e) => updateField('hourlyRate', e.target.value)}
                            placeholder="75.00"
                          />
                        </div>
                        <div>
                          <Label>Daily Rate ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.dailyRate}
                            onChange={(e) => updateField('dailyRate', e.target.value)}
                            placeholder="600.00"
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
                          placeholder="50"
                          className="max-w-md"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Maximum distance willing to travel for jobs
                        </p>
                      </div>
                    </>
                  ) : (
                    <Alert className="bg-purple-50 border-purple-200">
                      <AlertDescription className="text-purple-800">
                        Rates are managed through the subcontractor company profile.
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
                <CardContent>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      Portal access can be configured after creating the electrician profile. This allows the electrician to:
                      <ul className="list-disc ml-6 mt-2">
                        <li>View assigned jobs</li>
                        <li>Upload certificates and documents</li>
                        <li>Generate SLDs with their credentials</li>
                        <li>Manage their profile</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Button (bottom) */}
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
                  Save Electrician
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
