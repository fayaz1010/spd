'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Building2, FileText, Shield, CreditCard, Upload, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/company');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/settings/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleImageUpload = async (field: string, file: File) => {
    setUploading(field);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', field);

      const response = await fetch('/api/settings/company/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        updateField(field, data.url);
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your company information, branding, and compliance details
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
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

      {message && (
        <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="branding">
            <FileText className="mr-2 h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="mr-2 h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="banking">
            <CreditCard className="mr-2 h-4 w-4" />
            Banking
          </TabsTrigger>
        </TabsList>

        {/* Company Details Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Basic company information used across all documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={settings?.companyName || ''}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    placeholder="Sun Direct Power"
                  />
                </div>
                <div>
                  <Label>Trading Name</Label>
                  <Input
                    value={settings?.tradingName || ''}
                    onChange={(e) => updateField('tradingName', e.target.value)}
                    placeholder="Optional trading name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ABN</Label>
                  <Input
                    value={settings?.companyABN || ''}
                    onChange={(e) => updateField('companyABN', e.target.value)}
                    placeholder="12 345 678 901"
                  />
                </div>
                <div>
                  <Label>ACN</Label>
                  <Input
                    value={settings?.companyACN || ''}
                    onChange={(e) => updateField('companyACN', e.target.value)}
                    placeholder="123 456 789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings?.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(08) 1234 5678"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={settings?.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="info@sundirectpower.com.au"
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={settings?.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="123 Solar Street"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Suburb</Label>
                  <Input
                    value={settings?.suburb || ''}
                    onChange={(e) => updateField('suburb', e.target.value)}
                    placeholder="Perth"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={settings?.state || ''}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="WA"
                  />
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input
                    value={settings?.postcode || ''}
                    onChange={(e) => updateField('postcode', e.target.value)}
                    placeholder="6000"
                  />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  value={settings?.website || ''}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://sundirectpower.com.au"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Logos</CardTitle>
              <CardDescription>
                Upload logos for use in SLDs, invoices, and other documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Large Logo */}
              <div>
                <Label>Large Logo (Title Block)</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    value={settings?.logoLarge || ''}
                    onChange={(e) => updateField('logoLarge', e.target.value)}
                    placeholder="/company/logo-large.png (400x150px recommended)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading === 'logoLarge'}
                    onClick={() => document.getElementById('logoLarge-upload')?.click()}
                  >
                    {uploading === 'logoLarge' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="logoLarge-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('logoLarge', file);
                    }}
                  />
                </div>
                {settings?.logoLarge && (
                  <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                    <img src={settings.logoLarge} alt="Large Logo" className="h-20 object-contain" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Used in SLD title blocks and document headers
                </p>
              </div>

              {/* Medium Logo */}
              <div>
                <Label>Medium Logo (Footer)</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    value={settings?.logoMedium || ''}
                    onChange={(e) => updateField('logoMedium', e.target.value)}
                    placeholder="/company/logo-medium.png (200x75px recommended)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading === 'logoMedium'}
                    onClick={() => document.getElementById('logoMedium-upload')?.click()}
                  >
                    {uploading === 'logoMedium' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="logoMedium-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('logoMedium', file);
                    }}
                  />
                </div>
                {settings?.logoMedium && (
                  <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                    <img src={settings.logoMedium} alt="Medium Logo" className="h-16 object-contain" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Used in document footers
                </p>
              </div>

              {/* Small Logo */}
              <div>
                <Label>Small Logo (Watermark)</Label>
                <div className="flex gap-3 mt-2">
                  <Input
                    value={settings?.logoSmall || ''}
                    onChange={(e) => updateField('logoSmall', e.target.value)}
                    placeholder="/company/logo-small.png (100x40px recommended)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading === 'logoSmall'}
                    onClick={() => document.getElementById('logoSmall-upload')?.click()}
                  >
                    {uploading === 'logoSmall' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="logoSmall-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('logoSmall', file);
                    }}
                  />
                </div>
                {settings?.logoSmall && (
                  <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                    <img src={settings.logoSmall} alt="Small Logo" className="h-12 object-contain" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Used as watermark on documents
                </p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Authorized Signatory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={settings?.authorizedSignatory || ''}
                      onChange={(e) => updateField('authorizedSignatory', e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={settings?.signatoryTitle || ''}
                      onChange={(e) => updateField('signatoryTitle', e.target.value)}
                      placeholder="Director"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Digital Signature</Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      value={settings?.signatorySignature || ''}
                      onChange={(e) => updateField('signatorySignature', e.target.value)}
                      placeholder="/company/signature.png"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading === 'signatorySignature'}
                      onClick={() => document.getElementById('signature-upload')?.click()}
                    >
                      {uploading === 'signatorySignature' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      id="signature-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('signatorySignature', file);
                      }}
                    />
                  </div>
                  {settings?.signatorySignature && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
                      <img src={settings.signatorySignature} alt="Signature" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Licenses</CardTitle>
              <CardDescription>
                Electrical licenses, CEC accreditation, and insurance details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Electrical License</Label>
                  <Input
                    value={settings?.electricalLicense || ''}
                    onChange={(e) => updateField('electricalLicense', e.target.value)}
                    placeholder="EC123456"
                  />
                </div>
                <div>
                  <Label>CEC Accreditation</Label>
                  <Input
                    value={settings?.cecAccreditation || ''}
                    onChange={(e) => updateField('cecAccreditation', e.target.value)}
                    placeholder="A1234567"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Public Liability Insurance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Insurer</Label>
                    <Input
                      value={settings?.publicLiabilityInsurer || ''}
                      onChange={(e) => updateField('publicLiabilityInsurer', e.target.value)}
                      placeholder="Insurance Company Name"
                    />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <Input
                      value={settings?.publicLiabilityPolicy || ''}
                      onChange={(e) => updateField('publicLiabilityPolicy', e.target.value)}
                      placeholder="POL123456"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Professional Indemnity Insurance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Insurer</Label>
                    <Input
                      value={settings?.profIndemnityInsurer || ''}
                      onChange={(e) => updateField('profIndemnityInsurer', e.target.value)}
                      placeholder="Insurance Company Name"
                    />
                  </div>
                  <div>
                    <Label>Policy Number</Label>
                    <Input
                      value={settings?.profIndemnityPolicy || ''}
                      onChange={(e) => updateField('profIndemnityPolicy', e.target.value)}
                      placeholder="POL789012"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
              <CardDescription>
                Bank account information for invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={settings?.bankName || ''}
                  onChange={(e) => updateField('bankName', e.target.value)}
                  placeholder="Commonwealth Bank"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>BSB</Label>
                  <Input
                    value={settings?.bankBSB || ''}
                    onChange={(e) => updateField('bankBSB', e.target.value)}
                    placeholder="123-456"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={settings?.bankAccount || ''}
                    onChange={(e) => updateField('bankAccount', e.target.value)}
                    placeholder="12345678"
                  />
                </div>
              </div>

              <div>
                <Label>Account Name</Label>
                <Input
                  value={settings?.bankAccountName || ''}
                  onChange={(e) => updateField('bankAccountName', e.target.value)}
                  placeholder="Sun Direct Power Pty Ltd"
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-3">Default Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Warranty (Years)</Label>
                    <Input
                      type="number"
                      value={settings?.defaultWarrantyYears || 25}
                      onChange={(e) => updateField('defaultWarrantyYears', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Payment Terms</Label>
                    <Input
                      value={settings?.defaultPaymentTerms || 'Net 30'}
                      onChange={(e) => updateField('defaultPaymentTerms', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={settings?.defaultTaxRate || 10}
                      onChange={(e) => updateField('defaultTaxRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
