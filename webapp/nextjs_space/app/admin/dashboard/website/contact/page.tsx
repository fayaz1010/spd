'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Loader2,
  Eye,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface Office {
  name: string;
  company?: string;
  address: string;
  street?: string;
  city: string;
  phone: string;
  mobile: string;
  email?: string;
  hours: string;
  website?: string;
}

interface ContactSettings {
  waOffice: Office;
  maldivesOffice: Office;
  website: string;
}

export default function ManageContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<ContactSettings>({
    waOffice: {
      name: 'Head Office - Western Australia',
      address: '1 Whipper Street',
      city: 'Balcatta, WA 6112, Western Australia',
      phone: '08 6246 5606',
      mobile: '+61 0413 823 725',
      email: 'admin@sundirectpower.com.au',
      hours: 'Monday - Friday: 8:00 AM - 5:00 PM',
    },
    maldivesOffice: {
      name: 'Maldives Office',
      company: 'Hoya Maldives',
      address: '1st Floor, G. Safoora Manzil',
      street: 'Bodurasgefaanu Magu',
      city: 'Male\', Maldives',
      phone: '+960 330041',
      mobile: '+960 9137773',
      hours: 'Monday - Saturday: 9:00 AM - 6:00 PM',
    },
    website: 'www.sundirectpower.com.au',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contact');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Contact information saved successfully!');
      } else {
        toast.error('Failed to save contact information');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save contact information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Contact Information</h1>
              <p className="text-gray-600 mt-1">Update office addresses, phone numbers, and contact details</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/contact', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Page
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-coral hover:bg-coral/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Western Australia Office */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Western Australia Office
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Name
                </label>
                <Input
                  value={settings.waOffice.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    waOffice: { ...settings.waOffice, name: e.target.value }
                  })}
                  placeholder="Head Office - Western Australia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <Input
                  value={settings.waOffice.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    waOffice: { ...settings.waOffice, address: e.target.value }
                  })}
                  placeholder="1 Whipper Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City, State, Postcode
                </label>
                <Input
                  value={settings.waOffice.city}
                  onChange={(e) => setSettings({
                    ...settings,
                    waOffice: { ...settings.waOffice, city: e.target.value }
                  })}
                  placeholder="Balcatta, WA 6112, Western Australia"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <Input
                    value={settings.waOffice.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      waOffice: { ...settings.waOffice, phone: e.target.value }
                    })}
                    placeholder="08 6246 5606"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Mobile
                  </label>
                  <Input
                    value={settings.waOffice.mobile}
                    onChange={(e) => setSettings({
                      ...settings,
                      waOffice: { ...settings.waOffice, mobile: e.target.value }
                    })}
                    placeholder="+61 0413 823 725"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <Input
                  type="email"
                  value={settings.waOffice.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    waOffice: { ...settings.waOffice, email: e.target.value }
                  })}
                  placeholder="admin@sundirectpower.com.au"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Business Hours
                </label>
                <Input
                  value={settings.waOffice.hours}
                  onChange={(e) => setSettings({
                    ...settings,
                    waOffice: { ...settings.waOffice, hours: e.target.value }
                  })}
                  placeholder="Monday - Friday: 8:00 AM - 5:00 PM"
                />
              </div>
            </CardContent>
          </Card>

          {/* Maldives Office */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-600" />
                Maldives Office
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Name
                </label>
                <Input
                  value={settings.maldivesOffice.name}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, name: e.target.value }
                  })}
                  placeholder="Maldives Office"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name (Optional)
                </label>
                <Input
                  value={settings.maldivesOffice.company}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, company: e.target.value }
                  })}
                  placeholder="Hoya Maldives"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Building/Floor
                </label>
                <Input
                  value={settings.maldivesOffice.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, address: e.target.value }
                  })}
                  placeholder="1st Floor, G. Safoora Manzil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street
                </label>
                <Input
                  value={settings.maldivesOffice.street}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, street: e.target.value }
                  })}
                  placeholder="Bodurasgefaanu Magu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City, Country
                </label>
                <Input
                  value={settings.maldivesOffice.city}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, city: e.target.value }
                  })}
                  placeholder="Male', Maldives"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <Input
                    value={settings.maldivesOffice.phone}
                    onChange={(e) => setSettings({
                      ...settings,
                      maldivesOffice: { ...settings.maldivesOffice, phone: e.target.value }
                    })}
                    placeholder="+960 330041"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Mobile
                  </label>
                  <Input
                    value={settings.maldivesOffice.mobile}
                    onChange={(e) => setSettings({
                      ...settings,
                      maldivesOffice: { ...settings.maldivesOffice, mobile: e.target.value }
                    })}
                    placeholder="+960 9137773"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Business Hours
                </label>
                <Input
                  value={settings.maldivesOffice.hours}
                  onChange={(e) => setSettings({
                    ...settings,
                    maldivesOffice: { ...settings.maldivesOffice, hours: e.target.value }
                  })}
                  placeholder="Monday - Saturday: 9:00 AM - 6:00 PM"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Website */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <Input
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                placeholder="www.sundirectpower.com.au"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
