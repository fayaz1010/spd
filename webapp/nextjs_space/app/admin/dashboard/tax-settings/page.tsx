'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Receipt, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

interface TaxSettings {
  gstRate: number;
  gstEnabled: boolean;
  taxInclusive: boolean;
  stateTaxes: {
    NSW: number;
    VIC: number;
    QLD: number;
    SA: number;
    WA: number;
    TAS: number;
    NT: number;
    ACT: number;
  };
  exemptCategories: string[];
}

export default function TaxSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [settings, setSettings] = useState<TaxSettings>({
    gstRate: 10,
    gstEnabled: true,
    taxInclusive: false,
    stateTaxes: {
      NSW: 0,
      VIC: 0,
      QLD: 0,
      SA: 0,
      WA: 0,
      TAS: 0,
      NT: 0,
      ACT: 0,
    },
    exemptCategories: [],
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/tax-settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tax settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/tax-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Tax settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Receipt className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Tax Settings</h1>
                  <p className="text-xs text-gray-500">Configure GST and tax calculations</p>
                </div>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* GST Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>GST (Goods and Services Tax)</CardTitle>
            <CardDescription>
              Configure GST rate and how it applies to quotes and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GST Enabled */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="gst-enabled" className="text-base font-semibold">
                  Enable GST
                </Label>
                <p className="text-sm text-gray-500">
                  Apply GST to all quotes and invoices
                </p>
              </div>
              <Switch
                id="gst-enabled"
                checked={settings.gstEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, gstEnabled: checked })
                }
              />
            </div>

            {/* GST Rate */}
            <div>
              <Label htmlFor="gst-rate">GST Rate (%)</Label>
              <Input
                id="gst-rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={settings.gstRate}
                onChange={(e) =>
                  setSettings({ ...settings, gstRate: parseFloat(e.target.value) || 0 })
                }
                disabled={!settings.gstEnabled}
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500 mt-1">
                Standard GST rate in Australia is 10%
              </p>
            </div>

            {/* Tax Inclusive */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="tax-inclusive" className="text-base font-semibold">
                  Tax-Inclusive Pricing
                </Label>
                <p className="text-sm text-gray-500">
                  Display prices with GST included (recommended for B2C)
                </p>
              </div>
              <Switch
                id="tax-inclusive"
                checked={settings.taxInclusive}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, taxInclusive: checked })
                }
                disabled={!settings.gstEnabled}
              />
            </div>

            {/* Example Calculation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Example Calculation</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Base Price:</span>
                  <span className="font-mono">$10,000.00</span>
                </div>
                {settings.gstEnabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700">GST ({settings.gstRate}%):</span>
                      <span className="font-mono">
                        ${((10000 * settings.gstRate) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1 font-semibold">
                      <span className="text-gray-900">Total:</span>
                      <span className="font-mono">
                        ${(10000 + (10000 * settings.gstRate) / 100).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
                {!settings.gstEnabled && (
                  <div className="flex justify-between border-t border-blue-300 pt-1 font-semibold">
                    <span className="text-gray-900">Total (No GST):</span>
                    <span className="font-mono">$10,000.00</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* State-Specific Taxes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>State-Specific Taxes</CardTitle>
            <CardDescription>
              Additional state-based taxes or levies (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(settings.stateTaxes).map(([state, rate]) => (
                <div key={state}>
                  <Label htmlFor={`state-${state}`}>{state}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`state-${state}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={rate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          stateTaxes: {
                            ...settings.stateTaxes,
                            [state]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              State taxes are added on top of GST. Leave at 0% if not applicable.
            </p>
          </CardContent>
        </Card>

        {/* Tax Exemptions */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Exemptions</CardTitle>
            <CardDescription>
              Product categories that are exempt from GST
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['PANEL', 'BATTERY', 'INVERTER', 'ADDON', 'INSTALLATION'].map((category) => (
                <div key={category} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`exempt-${category}`}
                    checked={settings.exemptCategories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          exemptCategories: [...settings.exemptCategories, category],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          exemptCategories: settings.exemptCategories.filter(
                            (c) => c !== category
                          ),
                        });
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`exempt-${category}`} className="cursor-pointer">
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Note: Most solar products are subject to GST in Australia. Consult with a tax
              professional before enabling exemptions.
            </p>
          </CardContent>
        </Card>

        {/* Save Button (Bottom) */}
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Tax Settings'}
          </Button>
        </div>
      </main>
    </div>
  );
}
