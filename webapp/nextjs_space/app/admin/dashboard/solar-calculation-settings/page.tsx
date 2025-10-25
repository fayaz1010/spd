'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Sun, 
  ArrowLeft, 
  Save, 
  Loader2, 
  DollarSign, 
  Zap,
  Settings,
  Info,
  AlertCircle
} from 'lucide-react';

interface SolarCalculationSettings {
  // Electricity Rates
  electricityRetailRate: number;
  feedInTariff: number;
  annualRateIncrease: number;
  
  // System Parameters
  systemEfficiency: number;
  shadingLoss: number;
  soilingLoss: number;
  systemDegradation: number;
  
  // Perth-Specific
  defaultTilt: number;
  defaultAzimuth: number;
  peakSunHours: number;
  
  // Financial
  inverterReplacementYear: number;
  inverterReplacementCost: number;
  discountRate: number;
}

export default function SolarCalculationSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SolarCalculationSettings>({
    // Electricity Rates (Perth defaults)
    electricityRetailRate: 0.27,
    feedInTariff: 0.07,
    annualRateIncrease: 0.03,
    
    // System Parameters (Industry standards)
    systemEfficiency: 0.87,
    shadingLoss: 0.05,
    soilingLoss: 0.03,
    systemDegradation: 0.005,
    
    // Perth-Specific
    defaultTilt: 20,
    defaultAzimuth: 0,
    peakSunHours: 4.5,
    
    // Financial
    inverterReplacementYear: 12,
    inverterReplacementCost: 2000,
    discountRate: 0.05,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/solar-calculation-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/solar-calculation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all settings to Perth, WA defaults?')) {
      setSettings({
        electricityRetailRate: 0.27,
        feedInTariff: 0.07,
        annualRateIncrease: 0.03,
        systemEfficiency: 0.87,
        shadingLoss: 0.05,
        soilingLoss: 0.03,
        systemDegradation: 0.005,
        defaultTilt: 20,
        defaultAzimuth: 0,
        peakSunHours: 4.5,
        inverterReplacementYear: 12,
        inverterReplacementCost: 2000,
        discountRate: 0.05,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard/settings')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Sun className="w-8 h-8 text-yellow-600" />
                  Solar Calculation Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure solar production calculations and financial projections
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About These Settings:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>These settings affect all solar production charts and financial projections</li>
                <li>Default values are optimized for Perth, Western Australia</li>
                <li>Adjust these values if operating in a different state or region</li>
                <li>Changes apply to all new quotes and calculations</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Electricity Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Electricity Rates
              </CardTitle>
              <CardDescription>
                Current market rates for electricity and feed-in tariff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="electricityRetailRate">
                  Retail Electricity Rate ($/kWh)
                </Label>
                <Input
                  id="electricityRetailRate"
                  type="number"
                  step="0.01"
                  value={settings.electricityRetailRate}
                  onChange={(e) => setSettings({
                    ...settings,
                    electricityRetailRate: parseFloat(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Perth average: $0.27/kWh (used for savings calculations)
                </p>
              </div>

              <div>
                <Label htmlFor="feedInTariff">
                  Feed-in Tariff ($/kWh)
                </Label>
                <Input
                  id="feedInTariff"
                  type="number"
                  step="0.01"
                  value={settings.feedInTariff}
                  onChange={(e) => setSettings({
                    ...settings,
                    feedInTariff: parseFloat(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Perth average: $0.07/kWh (revenue from exported solar)
                </p>
              </div>

              <div>
                <Label htmlFor="annualRateIncrease">
                  Annual Rate Increase (%)
                </Label>
                <Input
                  id="annualRateIncrease"
                  type="number"
                  step="0.01"
                  value={settings.annualRateIncrease * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    annualRateIncrease: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 3% per year (for 25-year projections)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                System Parameters
              </CardTitle>
              <CardDescription>
                Technical efficiency and loss factors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemEfficiency">
                  System Efficiency (%)
                </Label>
                <Input
                  id="systemEfficiency"
                  type="number"
                  step="0.01"
                  value={settings.systemEfficiency * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemEfficiency: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 87% (inverter, wiring, temperature losses)
                </p>
              </div>

              <div>
                <Label htmlFor="shadingLoss">
                  Shading Loss (%)
                </Label>
                <Input
                  id="shadingLoss"
                  type="number"
                  step="0.01"
                  value={settings.shadingLoss * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    shadingLoss: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 5% (conservative estimate for minimal shading)
                </p>
              </div>

              <div>
                <Label htmlFor="soilingLoss">
                  Soiling Loss (%)
                </Label>
                <Input
                  id="soilingLoss"
                  type="number"
                  step="0.01"
                  value={settings.soilingLoss * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    soilingLoss: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 3% (dirt/dust accumulation)
                </p>
              </div>

              <div>
                <Label htmlFor="systemDegradation">
                  Annual Degradation (%)
                </Label>
                <Input
                  id="systemDegradation"
                  type="number"
                  step="0.01"
                  value={settings.systemDegradation * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemDegradation: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 0.5% per year (panel degradation over time)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location-Specific Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-600" />
                Location-Specific Settings
              </CardTitle>
              <CardDescription>
                Solar irradiance and installation parameters for your region
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="peakSunHours">
                  Peak Sun Hours (hours/day)
                </Label>
                <Input
                  id="peakSunHours"
                  type="number"
                  step="0.1"
                  value={settings.peakSunHours}
                  onChange={(e) => setSettings({
                    ...settings,
                    peakSunHours: parseFloat(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Perth: 4.5 hours (Bureau of Meteorology average)
                </p>
              </div>

              <div>
                <Label htmlFor="defaultTilt">
                  Default Roof Tilt (degrees)
                </Label>
                <Input
                  id="defaultTilt"
                  type="number"
                  step="1"
                  value={settings.defaultTilt}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultTilt: parseInt(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Perth typical: 20° (residential roof pitch)
                </p>
              </div>

              <div>
                <Label htmlFor="defaultAzimuth">
                  Default Azimuth (degrees)
                </Label>
                <Input
                  id="defaultAzimuth"
                  type="number"
                  step="1"
                  value={settings.defaultAzimuth}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultAzimuth: parseInt(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  0° = North (optimal for Southern Hemisphere)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Financial Projections
              </CardTitle>
              <CardDescription>
                Long-term financial modeling parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inverterReplacementYear">
                  Inverter Replacement Year
                </Label>
                <Input
                  id="inverterReplacementYear"
                  type="number"
                  step="1"
                  value={settings.inverterReplacementYear}
                  onChange={(e) => setSettings({
                    ...settings,
                    inverterReplacementYear: parseInt(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: Year 12 (typical inverter lifespan)
                </p>
              </div>

              <div>
                <Label htmlFor="inverterReplacementCost">
                  Inverter Replacement Cost ($)
                </Label>
                <Input
                  id="inverterReplacementCost"
                  type="number"
                  step="100"
                  value={settings.inverterReplacementCost}
                  onChange={(e) => setSettings({
                    ...settings,
                    inverterReplacementCost: parseInt(e.target.value)
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: $2,000 (average replacement cost)
                </p>
              </div>

              <div>
                <Label htmlFor="discountRate">
                  Discount Rate for NPV (%)
                </Label>
                <Input
                  id="discountRate"
                  type="number"
                  step="0.01"
                  value={settings.discountRate * 100}
                  onChange={(e) => setSettings({
                    ...settings,
                    discountRate: parseFloat(e.target.value) / 100
                  })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default: 5% (for Net Present Value calculations)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning Box */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Changes affect all new calculations in Calculator-v2, Quote Tester, and Proposals</li>
                <li>Existing saved quotes will not be updated</li>
                <li>Peak sun hours vary by location - check Bureau of Meteorology for your region</li>
                <li>Conservative estimates are recommended for customer quotes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
