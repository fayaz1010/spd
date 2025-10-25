'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Upload } from 'lucide-react';

interface OnboardingData {
  applicationId: string;
  candidateName: string;
  position: string;
  startDate: string;
  alreadySubmitted: boolean;
}

export default function OnboardingPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData | null>(null);
  
  const [formData, setFormData] = useState({
    taxFileNumber: '',
    bankAccountName: '',
    bankBSB: '',
    bankAccountNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    driverLicenseNumber: '',
    driverLicenseState: '',
    driverLicenseExpiry: '',
    electricalLicenseNumber: '',
    electricalLicenseState: '',
    electricalLicenseExpiry: '',
    cecAccreditationNumber: '',
    cecAccreditationType: '',
    cecAccreditationExpiry: '',
  });

  const [files, setFiles] = useState<{
    driverLicense?: File;
    electricalLicense?: File;
    cecAccreditation?: File;
  }>({});

  useEffect(() => {
    fetchOnboardingData();
  }, [params.token]);

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch(`/api/onboarding/${params.token}`);
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        
        // Pre-fill if already submitted
        if (result.data.existingData) {
          setFormData(result.data.existingData);
        }
      } else {
        toast({
          title: 'Error',
          description: 'Invalid or expired onboarding link',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load onboarding information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value);
      });

      // Add files
      if (files.driverLicense) submitData.append('driverLicense', files.driverLicense);
      if (files.electricalLicense) submitData.append('electricalLicense', files.electricalLicense);
      if (files.cecAccreditation) submitData.append('cecAccreditation', files.cecAccreditation);

      const response = await fetch(`/api/onboarding/${params.token}/submit`, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Your onboarding information has been submitted successfully',
        });
        fetchOnboardingData(); // Refresh to show submitted state
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit onboarding information',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit onboarding information',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>This onboarding link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (data.alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Already Submitted
            </CardTitle>
            <CardDescription>
              You have already submitted your onboarding information. Our HR team will contact you soon.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              Hi {data.candidateName}, please complete your onboarding information for your 
              position as {data.position}. Start date: {new Date(data.startDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tax & Banking */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tax & Banking Information</h3>
                
                <div>
                  <Label htmlFor="taxFileNumber">Tax File Number (TFN) *</Label>
                  <Input
                    id="taxFileNumber"
                    value={formData.taxFileNumber}
                    onChange={(e) => setFormData({ ...formData, taxFileNumber: e.target.value })}
                    required
                    placeholder="123 456 789"
                  />
                </div>

                <div>
                  <Label htmlFor="bankAccountName">Bank Account Name *</Label>
                  <Input
                    id="bankAccountName"
                    value={formData.bankAccountName}
                    onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankBSB">BSB *</Label>
                    <Input
                      id="bankBSB"
                      value={formData.bankBSB}
                      onChange={(e) => setFormData({ ...formData, bankBSB: e.target.value })}
                      required
                      placeholder="123-456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber">Account Number *</Label>
                    <Input
                      id="bankAccountNumber"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
                
                <div>
                  <Label htmlFor="emergencyContactName">Contact Name *</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactPhone">Phone Number *</Label>
                    <Input
                      id="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyContactRelation">Relationship *</Label>
                    <Input
                      id="emergencyContactRelation"
                      value={formData.emergencyContactRelation}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                      required
                      placeholder="e.g., Spouse, Parent"
                    />
                  </div>
                </div>
              </div>

              {/* Driver License */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Driver License *</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="driverLicenseNumber">License Number *</Label>
                    <Input
                      id="driverLicenseNumber"
                      value={formData.driverLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, driverLicenseNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="driverLicenseState">State *</Label>
                    <Input
                      id="driverLicenseState"
                      value={formData.driverLicenseState}
                      onChange={(e) => setFormData({ ...formData, driverLicenseState: e.target.value })}
                      required
                      placeholder="e.g., WA, NSW"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="driverLicenseExpiry">Expiry Date *</Label>
                  <Input
                    id="driverLicenseExpiry"
                    type="date"
                    value={formData.driverLicenseExpiry}
                    onChange={(e) => setFormData({ ...formData, driverLicenseExpiry: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="driverLicenseFile">Upload Driver License Copy *</Label>
                  <Input
                    id="driverLicenseFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFiles({ ...files, driverLicense: e.target.files?.[0] })}
                    required
                  />
                </div>
              </div>

              {/* Electrical License (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Electrical License (If Applicable)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="electricalLicenseNumber">License Number</Label>
                    <Input
                      id="electricalLicenseNumber"
                      value={formData.electricalLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, electricalLicenseNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="electricalLicenseState">State</Label>
                    <Input
                      id="electricalLicenseState"
                      value={formData.electricalLicenseState}
                      onChange={(e) => setFormData({ ...formData, electricalLicenseState: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="electricalLicenseExpiry">Expiry Date</Label>
                  <Input
                    id="electricalLicenseExpiry"
                    type="date"
                    value={formData.electricalLicenseExpiry}
                    onChange={(e) => setFormData({ ...formData, electricalLicenseExpiry: e.target.value })}
                  />
                </div>

                {formData.electricalLicenseNumber && (
                  <div>
                    <Label htmlFor="electricalLicenseFile">Upload License Copy</Label>
                    <Input
                      id="electricalLicenseFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFiles({ ...files, electricalLicense: e.target.files?.[0] })}
                    />
                  </div>
                )}
              </div>

              {/* CEC Accreditation (Optional) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CEC Accreditation (If Applicable)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cecAccreditationNumber">Accreditation Number</Label>
                    <Input
                      id="cecAccreditationNumber"
                      value={formData.cecAccreditationNumber}
                      onChange={(e) => setFormData({ ...formData, cecAccreditationNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cecAccreditationType">Type</Label>
                    <Input
                      id="cecAccreditationType"
                      value={formData.cecAccreditationType}
                      onChange={(e) => setFormData({ ...formData, cecAccreditationType: e.target.value })}
                      placeholder="e.g., Designer, Installer"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cecAccreditationExpiry">Expiry Date</Label>
                  <Input
                    id="cecAccreditationExpiry"
                    type="date"
                    value={formData.cecAccreditationExpiry}
                    onChange={(e) => setFormData({ ...formData, cecAccreditationExpiry: e.target.value })}
                  />
                </div>

                {formData.cecAccreditationNumber && (
                  <div>
                    <Label htmlFor="cecAccreditationFile">Upload Certificate</Label>
                    <Input
                      id="cecAccreditationFile"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFiles({ ...files, cecAccreditation: e.target.files?.[0] })}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Onboarding Information'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
