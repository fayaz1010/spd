'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, DollarSign, FileText, Settings, TrendingUp, Package } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteSettings {
  // Deposit Settings
  depositType: 'percentage' | 'fixed';
  depositPercentage: number;
  depositFixedAmount: number;
  
  // Quote Validity
  quoteValidityDays: number;
  
  // Pricing
  defaultPriceMultiplier: number;
  gstRate: number;
  
  // Package Settings
  showPackageComparison: boolean;
  allowCustomPackages: boolean;
  
  // Terms & Conditions
  termsAndConditions: string;
  paymentTerms: string;
}

export default function QuoteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState<QuoteSettings>({
    depositType: 'percentage',
    depositPercentage: 30,
    depositFixedAmount: 5000,
    quoteValidityDays: 30,
    defaultPriceMultiplier: 1.3,
    gstRate: 10,
    showPackageComparison: true,
    allowCustomPackages: false,
    termsAndConditions: '',
    paymentTerms: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/quote-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/quote-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Quote settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateExampleDeposit = (totalCost: number) => {
    if (settings.depositType === 'percentage') {
      return Math.round(totalCost * (settings.depositPercentage / 100));
    }
    return settings.depositFixedAmount;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quote Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure deposit rules, pricing, and quote defaults
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Package Templates Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span>Calculator Package Templates</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/package-templates'}
            >
              Manage Templates
            </Button>
          </CardTitle>
          <CardDescription>
            The calculator automatically generates 3 packages based on templates. Configure them in Package Templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Budget: "Smart Starter"</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• Solar: 75% coverage</div>
                <div>• Battery: Dynamic (evening peak)</div>
                <div>• Margin: 1.4x (40%)</div>
                <div>• Badge: "Best Value"</div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Mid: "Complete Coverage"</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• Solar: 110% coverage</div>
                <div>• Battery: Dynamic (full overnight)</div>
                <div>• Margin: 1.35x (35%)</div>
                <div>• Badge: "Most Popular"</div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Premium: "Energy Independent"</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• Solar: 140% coverage</div>
                <div>• Battery: Dynamic (complete autonomy)</div>
                <div>• Margin: 1.3x (30%)</div>
                <div>• Badge: "Premium Choice"</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            💡 Note: Package-specific margins override the default price multiplier set below. 
            The calculator uses customer's energy analysis to calculate exact system sizes.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Deposit Settings</span>
            </CardTitle>
            <CardDescription>
              Configure how deposit amounts are calculated for quotes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="depositType">Deposit Calculation Method</Label>
              <Select
                value={settings.depositType}
                onValueChange={(value: 'percentage' | 'fixed') => 
                  setSettings({ ...settings, depositType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage of Total</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.depositType === 'percentage' ? (
              <div>
                <Label htmlFor="depositPercentage">Deposit Percentage (%)</Label>
                <Input
                  id="depositPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.depositPercentage}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    depositPercentage: parseFloat(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 30% for residential, 10-20% for commercial
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="depositFixed">Fixed Deposit Amount ($)</Label>
                <Input
                  id="depositFixed"
                  type="number"
                  min="0"
                  value={settings.depositFixedAmount}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    depositFixedAmount: parseFloat(e.target.value) || 0 
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Same deposit amount for all quotes regardless of total cost
                </p>
              </div>
            )}

            <Separator />

            {/* Example Calculation */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Example Calculation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quote Total:</span>
                  <span className="font-semibold">$15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Required:</span>
                  <span className="font-bold text-green-600">
                    ${calculateExampleDeposit(15000).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Payment:</span>
                  <span className="font-semibold">
                    ${(15000 - calculateExampleDeposit(15000)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quote Validity & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Quote Validity & Pricing</span>
            </CardTitle>
            <CardDescription>
              Set default quote validity period and pricing rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="quoteValidity">Quote Valid For (Days)</Label>
              <Input
                id="quoteValidity"
                type="number"
                min="1"
                max="365"
                value={settings.quoteValidityDays}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  quoteValidityDays: parseInt(e.target.value) || 30 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                How long quotes remain valid before expiring
              </p>
            </div>

            <div>
              <Label htmlFor="priceMultiplier">Default Price Multiplier</Label>
              <Input
                id="priceMultiplier"
                type="number"
                step="0.01"
                min="1"
                max="3"
                value={settings.defaultPriceMultiplier}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  defaultPriceMultiplier: parseFloat(e.target.value) || 1.0 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Default markup: 1.3 = 30% margin, 1.4 = 40% margin
              </p>
            </div>

            <div>
              <Label htmlFor="gstRate">GST Rate (%)</Label>
              <Input
                id="gstRate"
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={settings.gstRate}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  gstRate: parseFloat(e.target.value) || 10 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Australian GST is 10%
              </p>
            </div>

            <Separator />

            {/* Margin Calculation */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Margin Calculator</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-semibold">$10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Multiplier:</span>
                  <span className="font-semibold">{settings.defaultPriceMultiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Selling Price:</span>
                  <span className="font-bold text-purple-600">
                    ${(10000 * settings.defaultPriceMultiplier).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="font-bold text-green-600">
                    {((settings.defaultPriceMultiplier - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Package Display Settings</span>
            </CardTitle>
            <CardDescription>
              Control how packages are shown to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showComparison">Show Package Comparison</Label>
                <p className="text-xs text-gray-500">
                  Display side-by-side package comparison in calculator
                </p>
              </div>
              <Switch
                id="showComparison"
                checked={settings.showPackageComparison}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, showPackageComparison: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowCustom">Allow Custom Packages</Label>
                <p className="text-xs text-gray-500">
                  Let customers customize system sizes beyond templates
                </p>
              </div>
              <Switch
                id="allowCustom"
                checked={settings.allowCustomPackages}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, allowCustomPackages: checked })
                }
              />
            </div>

            <Separator />

            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">💡 Package Tips</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Manage package templates in <a href="/admin/package-templates" className="text-blue-600 underline">Package Templates</a></li>
                <li>• Budget: 75% coverage, 1.4x multiplier (40% margin)</li>
                <li>• Mid: 110% coverage, 1.35x multiplier (35% margin)</li>
                <li>• Premium: 140% coverage, 1.3x multiplier (30% margin)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>Terms & Conditions</span>
            </CardTitle>
            <CardDescription>
              Default terms shown on quotes and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <textarea
                id="paymentTerms"
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                value={settings.paymentTerms}
                onChange={(e) => setSettings({ ...settings, paymentTerms: e.target.value })}
                placeholder="e.g., 30% deposit required, balance due on completion..."
              />
            </div>

            <div>
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <textarea
                id="termsAndConditions"
                className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                value={settings.termsAndConditions}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                placeholder="Enter your standard terms and conditions..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
