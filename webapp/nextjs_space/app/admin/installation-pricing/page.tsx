'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, RotateCcw, DollarSign, Wrench, AlertCircle, CheckCircle } from 'lucide-react';

interface InstallationPricing {
  id: string;
  baseCalloutFee: number;
  hourlyRate: number;
  minimumCharge: number;
  panelInstallPerUnit: number;
  railingPerMeter: number;
  inverterInstall: number;
  batteryInstallBase: number;
  batteryInstallPerKwh: number;
  cablingPerMeter: number;
  commissioningFee: number;
  evCharger7kwInstall: number;
  evCharger22kwInstall: number;
  hotWaterInstall: number;
  monitoringInstall: number;
  surgeProtectionInstall: number;
  tileRoofMultiplier: number;
  metalRoofMultiplier: number;
  flatRoofMultiplier: number;
  twoStoryMultiplier: number;
  difficultAccessMult: number;
  asbestosRemoval: number;
  scaffoldingRequired: number;
  avgRailingPerKw: number;
  avgCablingPerKw: number;
  notes?: string;
}

export default function InstallationPricingPage() {
  const [pricing, setPricing] = useState<InstallationPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load pricing data
  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/installation-pricing');
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load pricing data' });
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      setMessage({ type: 'error', text: 'Error loading pricing data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!pricing) return;

    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/api/admin/installation-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Pricing updated successfully!' });
        await loadPricing(); // Reload to get updated data
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save pricing' });
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      setMessage({ type: 'error', text: 'Error saving pricing data' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default values? This will reload the current saved values.')) {
      loadPricing();
      setMessage({ type: 'success', text: 'Values reset to saved configuration' });
    }
  };

  const updateField = (field: keyof InstallationPricing, value: number | string) => {
    if (!pricing) return;
    setPricing({ ...pricing, [field]: value });
  };

  // Calculate preview
  const calculatePreview = () => {
    if (!pricing) return null;

    const systemKw = 10;
    const panelCount = 25;
    const batteryKwh = 13.5;

    const baseCallout = pricing.baseCalloutFee;
    const panels = panelCount * pricing.panelInstallPerUnit;
    const railing = systemKw * pricing.avgRailingPerKw * pricing.railingPerMeter;
    const inverter = pricing.inverterInstall;
    const battery = pricing.batteryInstallBase + (batteryKwh * pricing.batteryInstallPerKwh);
    const cabling = systemKw * pricing.avgCablingPerKw * pricing.cablingPerMeter;
    const commissioning = pricing.commissioningFee;

    const baseTotal = baseCallout + panels + railing + inverter + battery + cabling + commissioning;
    const withTileRoof = baseTotal * pricing.tileRoofMultiplier;
    const withTwoStory = withTileRoof * pricing.twoStoryMultiplier;

    return {
      baseTotal: Math.round(baseTotal),
      withTileRoof: Math.round(withTileRoof),
      withTwoStory: Math.round(withTwoStory),
      breakdown: {
        baseCallout,
        panels,
        railing: Math.round(railing),
        inverter,
        battery: Math.round(battery),
        cabling: Math.round(cabling),
        commissioning,
      },
    };
  };

  const preview = calculatePreview();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>Installation pricing not configured. Please run the seed script.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Installation Pricing Configuration</h1>
        <p className="text-gray-600">Configure labor rates and installation costs for solar systems</p>
      </div>

      {/* Message */}
      {message && (
        <Card className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className={`flex items-center space-x-2 ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <p>{message.text}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Base Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span>Base Rates</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="baseCalloutFee">Callout Fee ($)</Label>
                  <Input
                    id="baseCalloutFee"
                    type="number"
                    value={pricing.baseCalloutFee}
                    onChange={(e) => updateField('baseCalloutFee', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($/hr)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={pricing.hourlyRate}
                    onChange={(e) => updateField('hourlyRate', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="minimumCharge">Minimum Charge ($)</Label>
                  <Input
                    id="minimumCharge"
                    type="number"
                    value={pricing.minimumCharge}
                    onChange={(e) => updateField('minimumCharge', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solar Installation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <span>Solar Installation (per unit)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="panelInstallPerUnit">Panel Install ($/panel)</Label>
                  <Input
                    id="panelInstallPerUnit"
                    type="number"
                    value={pricing.panelInstallPerUnit}
                    onChange={(e) => updateField('panelInstallPerUnit', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="railingPerMeter">Railing ($/meter)</Label>
                  <Input
                    id="railingPerMeter"
                    type="number"
                    value={pricing.railingPerMeter}
                    onChange={(e) => updateField('railingPerMeter', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="inverterInstall">Inverter Install ($)</Label>
                  <Input
                    id="inverterInstall"
                    type="number"
                    value={pricing.inverterInstall}
                    onChange={(e) => updateField('inverterInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="batteryInstallBase">Battery Base ($)</Label>
                  <Input
                    id="batteryInstallBase"
                    type="number"
                    value={pricing.batteryInstallBase}
                    onChange={(e) => updateField('batteryInstallBase', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="batteryInstallPerKwh">Battery ($/kWh)</Label>
                  <Input
                    id="batteryInstallPerKwh"
                    type="number"
                    value={pricing.batteryInstallPerKwh}
                    onChange={(e) => updateField('batteryInstallPerKwh', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cablingPerMeter">Cabling ($/meter)</Label>
                  <Input
                    id="cablingPerMeter"
                    type="number"
                    value={pricing.cablingPerMeter}
                    onChange={(e) => updateField('cablingPerMeter', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="commissioningFee">Commissioning ($)</Label>
                  <Input
                    id="commissioningFee"
                    type="number"
                    value={pricing.commissioningFee}
                    onChange={(e) => updateField('commissioningFee', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addon Installations */}
          <Card>
            <CardHeader>
              <CardTitle>Addon Installations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="evCharger7kwInstall">EV Charger 7kW ($)</Label>
                  <Input
                    id="evCharger7kwInstall"
                    type="number"
                    value={pricing.evCharger7kwInstall}
                    onChange={(e) => updateField('evCharger7kwInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="evCharger22kwInstall">EV Charger 22kW ($)</Label>
                  <Input
                    id="evCharger22kwInstall"
                    type="number"
                    value={pricing.evCharger22kwInstall}
                    onChange={(e) => updateField('evCharger22kwInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hotWaterInstall">Solar Hot Water ($)</Label>
                  <Input
                    id="hotWaterInstall"
                    type="number"
                    value={pricing.hotWaterInstall}
                    onChange={(e) => updateField('hotWaterInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="monitoringInstall">Monitoring System ($)</Label>
                  <Input
                    id="monitoringInstall"
                    type="number"
                    value={pricing.monitoringInstall}
                    onChange={(e) => updateField('monitoringInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="surgeProtectionInstall">Surge Protection ($)</Label>
                  <Input
                    id="surgeProtectionInstall"
                    type="number"
                    value={pricing.surgeProtectionInstall}
                    onChange={(e) => updateField('surgeProtectionInstall', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complexity Multipliers */}
          <Card>
            <CardHeader>
              <CardTitle>Complexity Multipliers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tileRoofMultiplier">Tile Roof (multiplier)</Label>
                  <Input
                    id="tileRoofMultiplier"
                    type="number"
                    step="0.1"
                    value={pricing.tileRoofMultiplier}
                    onChange={(e) => updateField('tileRoofMultiplier', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {((pricing.tileRoofMultiplier - 1) * 100).toFixed(0)}% extra
                  </p>
                </div>
                <div>
                  <Label htmlFor="metalRoofMultiplier">Metal Roof (multiplier)</Label>
                  <Input
                    id="metalRoofMultiplier"
                    type="number"
                    step="0.1"
                    value={pricing.metalRoofMultiplier}
                    onChange={(e) => updateField('metalRoofMultiplier', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {((pricing.metalRoofMultiplier - 1) * 100).toFixed(0)}% extra
                  </p>
                </div>
                <div>
                  <Label htmlFor="flatRoofMultiplier">Flat Roof (multiplier)</Label>
                  <Input
                    id="flatRoofMultiplier"
                    type="number"
                    step="0.1"
                    value={pricing.flatRoofMultiplier}
                    onChange={(e) => updateField('flatRoofMultiplier', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {((pricing.flatRoofMultiplier - 1) * 100).toFixed(0)}% extra
                  </p>
                </div>
                <div>
                  <Label htmlFor="twoStoryMultiplier">Two Story (multiplier)</Label>
                  <Input
                    id="twoStoryMultiplier"
                    type="number"
                    step="0.1"
                    value={pricing.twoStoryMultiplier}
                    onChange={(e) => updateField('twoStoryMultiplier', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {((pricing.twoStoryMultiplier - 1) * 100).toFixed(0)}% extra
                  </p>
                </div>
                <div>
                  <Label htmlFor="difficultAccessMult">Difficult Access (multiplier)</Label>
                  <Input
                    id="difficultAccessMult"
                    type="number"
                    step="0.1"
                    value={pricing.difficultAccessMult}
                    onChange={(e) => updateField('difficultAccessMult', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {((pricing.difficultAccessMult - 1) * 100).toFixed(0)}% extra
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixed Additions */}
          <Card>
            <CardHeader>
              <CardTitle>Fixed Additions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asbestosRemoval">Asbestos Removal ($)</Label>
                  <Input
                    id="asbestosRemoval"
                    type="number"
                    value={pricing.asbestosRemoval}
                    onChange={(e) => updateField('asbestosRemoval', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="scaffoldingRequired">Scaffolding ($)</Label>
                  <Input
                    id="scaffoldingRequired"
                    type="number"
                    value={pricing.scaffoldingRequired}
                    onChange={(e) => updateField('scaffoldingRequired', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estimates */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Estimates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="avgRailingPerKw">Avg Railing per kW (meters)</Label>
                  <Input
                    id="avgRailingPerKw"
                    type="number"
                    value={pricing.avgRailingPerKw}
                    onChange={(e) => updateField('avgRailingPerKw', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="avgCablingPerKw">Avg Cabling per kW (meters)</Label>
                  <Input
                    id="avgCablingPerKw"
                    type="number"
                    value={pricing.avgCablingPerKw}
                    onChange={(e) => updateField('avgCablingPerKw', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={pricing.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any notes about this pricing configuration..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={saving}
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card className="border-2 border-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {preview && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 mb-2">
                      10kW System (25 panels) + 13.5kWh Battery
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Callout:</span>
                        <span>${preview.breakdown.baseCallout}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Panels (25):</span>
                        <span>${preview.breakdown.panels}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Railing:</span>
                        <span>${preview.breakdown.railing}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inverter:</span>
                        <span>${preview.breakdown.inverter}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Battery:</span>
                        <span>${preview.breakdown.battery}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cabling:</span>
                        <span>${preview.breakdown.cabling}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commissioning:</span>
                        <span>${preview.breakdown.commissioning}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span>Base Total:</span>
                        <span>${preview.baseTotal}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2 text-sm">
                      <div className="flex justify-between text-orange-600">
                        <span>+ Tile Roof:</span>
                        <span>${preview.withTileRoof}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-semibold">
                        <span>+ Two Story:</span>
                        <span>${preview.withTwoStory}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t text-xs text-gray-500">
                      <p>Preview updates in real-time as you change values</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
