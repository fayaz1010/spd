
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import { Settings, DollarSign, Package, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { BackupManager } from '@/components/admin/BackupManager';

interface SystemSettings {
  id: string;
  supplierStrategy: string;
  commissionWeight: number;
  defaultPanelMarkup: number;
  defaultBatteryMarkup: number;
  defaultInverterMarkup: number;
  maxLeadTimeDays: number;
  showOutOfStock: boolean;
  autoRequestQuotes: boolean;
  quoteValidityDays: number;
  // Deposit settings
  depositType?: string;
  depositPercentage?: number;
  depositFixedAmount?: number;
  // Installation commission & margin (DEPRECATED)
  subbieCommissionPercent?: number;
  internalMarginPercent?: number;
  // Solar Package Quote Commission (NEW - Zero Markup Strategy)
  quoteCommissionType?: string;
  quoteCommissionPercent?: number;
  quoteCommissionFixed?: number;
  quoteMinimumProfit?: number;
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/system-settings');
      if (res.ok) {
        const data = await res.json();
        console.log('📊 System Settings Loaded:', data);
        console.log('💰 Deposit Type:', data.depositType);
        console.log('💰 Deposit Percentage:', data.depositPercentage);
        console.log('💰 Deposit Fixed Amount:', data.depositFixedAmount);
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-red-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              System Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure supplier selection strategy and system-wide defaults
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <CheckCircle className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Supplier Selection Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Supplier Selection Strategy
          </CardTitle>
          <CardDescription>
            How the system selects suppliers when generating quotes and orders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="strategy">Selection Strategy</Label>
            <Select
              value={settings.supplierStrategy}
              onValueChange={(value) =>
                setSettings({ ...settings, supplierStrategy: value })
              }
            >
              <SelectTrigger id="strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRIMARY_FIRST">
                  Primary First (Recommended)
                </SelectItem>
                <SelectItem value="LOWEST_COST">Lowest Cost</SelectItem>
                <SelectItem value="HIGHEST_COMMISSION">
                  Highest Commission
                </SelectItem>
                <SelectItem value="BALANCED">Balanced</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {settings.supplierStrategy === 'PRIMARY_FIRST' &&
                'Prefers primary suppliers, then falls back to commission optimization'}
              {settings.supplierStrategy === 'LOWEST_COST' &&
                'Always selects the supplier with the lowest cost'}
              {settings.supplierStrategy === 'HIGHEST_COMMISSION' &&
                'Always selects the supplier with the highest commission'}
              {settings.supplierStrategy === 'BALANCED' &&
                'Balances between cost and commission using the weight below'}
            </p>
          </div>

          {settings.supplierStrategy === 'BALANCED' && (
            <div className="space-y-2">
              <Label htmlFor="commissionWeight">
                Commission Weight: {(settings.commissionWeight * 100).toFixed(0)}%
              </Label>
              <Input
                id="commissionWeight"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.commissionWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    commissionWeight: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Prioritize Cost (0%)</span>
                <span>Balanced (50%)</span>
                <span>Prioritize Commission (100%)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Markups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Default Markups
          </CardTitle>
          <CardDescription>
            Fallback markups when no supplier mapping exists
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="panelMarkup">Panel Markup (%)</Label>
            <Input
              id="panelMarkup"
              type="number"
              value={settings.defaultPanelMarkup}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultPanelMarkup: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batteryMarkup">Battery Markup (%)</Label>
            <Input
              id="batteryMarkup"
              type="number"
              value={settings.defaultBatteryMarkup}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultBatteryMarkup: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inverterMarkup">Inverter Markup (%)</Label>
            <Input
              id="inverterMarkup"
              type="number"
              value={settings.defaultInverterMarkup}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultInverterMarkup: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Availability & Lead Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability & Lead Time
          </CardTitle>
          <CardDescription>
            Control how availability affects brand visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxLeadTime">Max Lead Time (Days)</Label>
            <Input
              id="maxLeadTime"
              type="number"
              value={settings.maxLeadTimeDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxLeadTimeDays: parseInt(e.target.value),
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Brands with lead times exceeding this won't be shown in calculator
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Out of Stock Items</Label>
              <p className="text-sm text-muted-foreground">
                Display unavailable brands with a notice
              </p>
            </div>
            <Switch
              checked={settings.showOutOfStock}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showOutOfStock: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote Management */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Management</CardTitle>
          <CardDescription>
            Configure quote request and approval workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Request Quotes</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate supplier quote requests
              </p>
            </div>
            <Switch
              checked={settings.autoRequestQuotes}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoRequestQuotes: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteValidity">Quote Validity (Days)</Label>
            <Input
              id="quoteValidity"
              type="number"
              value={settings.quoteValidityDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  quoteValidityDays: parseInt(e.target.value),
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              How long supplier quotes remain valid before re-requesting
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Customer Deposit Settings
          </CardTitle>
          <CardDescription>
            Configure how deposit amounts are calculated for customer quotes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="depositType">Deposit Calculation Method</Label>
            <Select
              value={settings.depositType || 'percentage'}
              onValueChange={(value) =>
                setSettings({ ...settings, depositType: value })
              }
            >
              <SelectTrigger id="depositType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of Total</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(settings.depositType || 'percentage') === 'percentage' ? (
            <div className="space-y-2">
              <Label htmlFor="depositPercentage">Deposit Percentage (%)</Label>
              <Input
                id="depositPercentage"
                type="number"
                min="0"
                max="100"
                value={settings.depositPercentage || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    depositPercentage: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 30% for residential, 10-20% for commercial
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="depositFixed">Fixed Deposit Amount ($)</Label>
              <Input
                id="depositFixed"
                type="number"
                min="0"
                value={settings.depositFixedAmount || 5000}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    depositFixedAmount: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Same deposit amount for all quotes regardless of total cost
              </p>
            </div>
          )}

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
                  ${(settings.depositType === 'fixed' 
                    ? (settings.depositFixedAmount || 5000)
                    : Math.round(15000 * ((settings.depositPercentage || 30) / 100))
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solar Package Quote Commission (NEW - Zero Markup Strategy) */}
      <Card className="border-2 border-green-500">
        <CardHeader className="bg-green-50">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Solar Package Quote Commission (Unified Calculator)
          </CardTitle>
          <CardDescription>
            Configure commission applied to complete solar system quotes (equipment + installation). This uses the ZERO MARKUP strategy - products at cost + single commission at the end.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Commission Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="quoteCommissionType">Commission Type</Label>
            <Select
              value={settings.quoteCommissionType || 'PERCENTAGE'}
              onValueChange={(value) =>
                setSettings({ ...settings, quoteCommissionType: value })
              }
            >
              <SelectTrigger id="quoteCommissionType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage of Quote</SelectItem>
                <SelectItem value="FIXED">Fixed Dollar Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Percentage Commission */}
            {(settings.quoteCommissionType || 'PERCENTAGE') === 'PERCENTAGE' && (
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <div>
                    <Label htmlFor="quoteCommissionPercent" className="text-sm font-semibold text-green-900">
                      Commission Percentage
                    </Label>
                    <p className="text-xs text-green-700">
                      Applied to quote total after rebates
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    id="quoteCommissionPercent"
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={settings?.quoteCommissionPercent ?? 20}
                    onChange={(e) => setSettings({
                      ...settings!,
                      quoteCommissionPercent: parseFloat(e.target.value)
                    })}
                    className="w-24 text-center font-bold text-lg"
                  />
                  <span className="text-lg font-bold text-green-900">%</span>
                </div>
                <p className="text-xs text-gray-600">
                  Recommended: 15-20% for competitive pricing
                </p>
              </div>
            )}

            {/* Fixed Commission */}
            {settings.quoteCommissionType === 'FIXED' && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💵</span>
                  <div>
                    <Label htmlFor="quoteCommissionFixed" className="text-sm font-semibold text-blue-900">
                      Fixed Commission Amount
                    </Label>
                    <p className="text-xs text-blue-700">
                      Same profit on every quote
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-900">$</span>
                  <Input
                    id="quoteCommissionFixed"
                    type="number"
                    step="100"
                    min="0"
                    value={settings?.quoteCommissionFixed ?? 3000}
                    onChange={(e) => setSettings({
                      ...settings!,
                      quoteCommissionFixed: parseFloat(e.target.value)
                    })}
                    className="w-32 text-center font-bold text-lg"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Good for consistent profit margins
                </p>
              </div>
            )}

            {/* Minimum Profit */}
            <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <div>
                  <Label htmlFor="quoteMinimumProfit" className="text-sm font-semibold text-yellow-900">
                    Minimum Profit Protection
                  </Label>
                  <p className="text-xs text-yellow-700">
                    Never make less than this amount
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-yellow-900">$</span>
                <Input
                  id="quoteMinimumProfit"
                  type="number"
                  step="100"
                  min="0"
                  value={settings?.quoteMinimumProfit || 1000}
                  onChange={(e) => setSettings({
                    ...settings!,
                    quoteMinimumProfit: parseFloat(e.target.value)
                  })}
                  className="w-32 text-center font-bold text-lg"
                />
              </div>
              <p className="text-xs text-gray-600">
                If commission &lt; minimum, use minimum instead
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>✨</span> Zero Markup Strategy - How It Works
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">1.</span>
                <p><strong>Equipment at Cost:</strong> Panels, inverters, batteries sold at supplier cost (no markup)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <p><strong>Installation at Cost:</strong> Only base installation included (optional items excluded)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <p><strong>Apply Rebates:</strong> Federal STC + State rebates deducted from subtotal</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">4.</span>
                <p><strong>Add Commission:</strong> Your profit added as {(settings.quoteCommissionType || 'PERCENTAGE') === 'PERCENTAGE' ? `${settings?.quoteCommissionPercent || 15}%` : `$${settings?.quoteCommissionFixed || 2000}`} of after-rebate amount</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">5.</span>
                <p><strong>Add GST:</strong> 10% GST on final amount = Customer price</p>
              </div>
            </div>
          </div>

          {/* Live Example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border-2 border-green-300 rounded-lg">
              <h5 className="font-semibold text-green-900 mb-3">📊 Example: 6.6kW System</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment (cost):</span>
                  <span className="font-semibold">$1,972</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installation (cost):</span>
                  <span className="font-semibold">$1,917</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">$3,889</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Rebates:</span>
                  <span className="font-semibold">-$2,368</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="text-gray-600">After Rebates:</span>
                  <span className="font-semibold">$1,521</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Commission ({settings?.quoteCommissionPercent || 15}%):</span>
                  <span className="font-semibold">+${Math.round(1521 * ((settings?.quoteCommissionPercent || 15) / 100))}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>GST (10%):</span>
                  <span className="font-semibold">+${Math.round((1521 + 1521 * ((settings?.quoteCommissionPercent || 15) / 100)) * 0.1)}</span>
                </div>
                <div className="border-t-2 border-green-500 pt-2 flex justify-between">
                  <span className="font-bold text-lg">Customer Pays:</span>
                  <span className="font-bold text-xl text-green-600">${Math.round(1521 * (1 + (settings?.quoteCommissionPercent || 15) / 100) * 1.1).toLocaleString()}</span>
                </div>
                <div className="bg-green-100 p-2 rounded mt-2">
                  <div className="flex justify-between text-green-800 font-semibold">
                    <span>Your Profit:</span>
                    <span>${Math.round(1521 * ((settings?.quoteCommissionPercent || 15) / 100)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-2 border-blue-300 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-3">💰 Example: 10kW + 13.5kWh</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Equipment (cost):</span>
                  <span className="font-semibold">$8,063</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Installation (cost):</span>
                  <span className="font-semibold">$4,257</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">$12,320</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Rebates:</span>
                  <span className="font-semibold">-$9,063</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="text-gray-600">After Rebates:</span>
                  <span className="font-semibold">$3,257</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Commission ({settings?.quoteCommissionPercent || 15}%):</span>
                  <span className="font-semibold">+${Math.round(3257 * ((settings?.quoteCommissionPercent || 15) / 100))}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>GST (10%):</span>
                  <span className="font-semibold">+${Math.round((3257 + 3257 * ((settings?.quoteCommissionPercent || 15) / 100)) * 0.1)}</span>
                </div>
                <div className="border-t-2 border-blue-500 pt-2 flex justify-between">
                  <span className="font-bold text-lg">Customer Pays:</span>
                  <span className="font-bold text-xl text-blue-600">${Math.round(3257 * (1 + (settings?.quoteCommissionPercent || 15) / 100) * 1.1).toLocaleString()}</span>
                </div>
                <div className="bg-blue-100 p-2 rounded mt-2">
                  <div className="flex justify-between text-blue-800 font-semibold">
                    <span>Your Profit:</span>
                    <span>${Math.round(3257 * ((settings?.quoteCommissionPercent || 15) / 100)).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ Important:</strong> This commission applies to <strong>Solar System Quotes</strong> (Unified Calculator, Homepage Calculator, Quote Tester). The product markups below are for <strong>Shop Sales Only</strong> (individual items sold through the online shop).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Installation Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Installation Commission & Margin Settings (DEPRECATED)
          </CardTitle>
          <CardDescription>
            Legacy settings - now replaced by Solar Package Quote Commission above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subcontractor Commission */}
            <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <div>
                  <Label htmlFor="subbieCommission" className="text-sm font-semibold text-blue-900">
                    Subcontractor Commission
                  </Label>
                  <p className="text-xs text-blue-700">
                    Applied to all public calculator quotes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="subbieCommission"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={settings?.subbieCommissionPercent || 15}
                  onChange={(e) => setSettings({
                    ...settings!,
                    subbieCommissionPercent: parseFloat(e.target.value)
                  })}
                  className="w-24 text-center font-bold text-lg"
                />
                <span className="text-lg font-bold text-blue-900">%</span>
              </div>
              <p className="text-xs text-gray-600">
                Customer pays: <strong>Subbie Rate + Commission%</strong>
              </p>
            </div>

            {/* Internal Team Margin */}
            <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💼</span>
                <div>
                  <Label htmlFor="internalMargin" className="text-sm font-semibold text-green-900">
                    Internal Team Margin
                  </Label>
                  <p className="text-xs text-green-700">
                    Markup on internal labor costs
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="internalMargin"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={settings?.internalMarginPercent || 30}
                  onChange={(e) => setSettings({
                    ...settings!,
                    internalMarginPercent: parseFloat(e.target.value)
                  })}
                  className="w-24 text-center font-bold text-lg"
                />
                <span className="text-lg font-bold text-green-900">%</span>
              </div>
              <p className="text-xs text-gray-600">
                For internal cost analysis only
              </p>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>💡</span> How Installation Pricing Works
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <p><strong>Customer Always Pays:</strong> Subcontractor Rate + Commission% (e.g., $2,818 + 15% = $3,241)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">2.</span>
                <p><strong>If Using Internal Team:</strong> Lower cost ($2,140) = Higher profit ($3,241 - $2,140 = $1,101)</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <p><strong>If Using Subcontractor:</strong> Standard profit ($3,241 - $2,818 = $423)</p>
              </div>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white border-2 border-blue-300 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">📊 Example: 6.6kW + 10kWh</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subbie Cost:</span>
                  <span className="font-semibold">$2,818</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission (15%):</span>
                  <span className="font-semibold text-blue-600">+$423</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="font-bold">Customer Pays:</span>
                  <span className="font-bold text-lg text-blue-600">$3,241</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-2 border-green-300 rounded-lg">
              <h5 className="font-semibold text-green-900 mb-2">💰 With Internal Team</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Team Cost:</span>
                  <span className="font-semibold">$2,140</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer Pays:</span>
                  <span className="font-semibold">$3,241</span>
                </div>
                <div className="border-t pt-1 flex justify-between">
                  <span className="font-bold">Extra Profit:</span>
                  <span className="font-bold text-lg text-green-600">+$1,101</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            💡 These settings apply to Solar Calculator, Slider Calculator, and Quote Tester. Admin can adjust commission per quote in Quote Tester.
          </p>
        </CardContent>
      </Card>

      {/* Package Templates Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Calculator Package Templates
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin/package-templates'}
            >
              Manage Templates
            </Button>
          </CardTitle>
          <CardDescription>
            Configure the 3 automatic packages shown in the calculator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Budget Package</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• 75% solar coverage</div>
                <div>• Dynamic battery sizing</div>
                <div>• 40% profit margin</div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2">Mid Package</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• 110% solar coverage</div>
                <div>• Full overnight backup</div>
                <div>• 35% profit margin</div>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Premium Package</h4>
              <div className="text-sm space-y-1 text-gray-700">
                <div>• 140% solar coverage</div>
                <div>• Complete autonomy</div>
                <div>• 30% profit margin</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            💡 Click "Manage Templates" to edit package names, features, pricing, and sizing strategies
          </p>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <BackupManager />
    </div>
  );
}
