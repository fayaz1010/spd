'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Star, Zap, Battery, TrendingUp, Leaf, DollarSign, CheckCircle2, Sun, Home, Loader2 } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';

interface Step4Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

interface SystemPackage {
  templateId: string;
  name: string;
  displayName: string;
  description: string;
  tier: string;
  badge: string | null;
  highlightColor: string | null;
  features: string[];
  solarKw: number;
  panelCount: number;
  panelWattage: number;
  batteryKwh: number;
  batteryBrand: string | null;
  batteryModel: string | null;
  dailyGeneration: number;
  dailySelfConsumption: number;
  dailyExport: number;
  coveragePercent: number;
  solarCost: number;
  batteryCost: number;
  installationCost: number;
  totalBeforeRebates: number;
  federalSolarRebate: number;
  federalBatteryRebate: number;
  stateBatteryRebate: number;
  totalRebates: number;
  totalAfterRebates: number;
  annualSavings: number;
  paybackYears: number;
  year10Savings: number;
  year25Savings: number;
  includeMonitoring: boolean;
  includeWarranty: string;
  includeMaintenance: boolean;
}

export function Step4ChooseSystem({ data, updateData, nextStep, prevStep }: Step4Props) {
  const [packages, setPackages] = useState<SystemPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<SystemPackage | null>(null);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load packages on mount
  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes/generate-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: data.sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to load packages');
        }

        const result = await response.json();
        
        if (result.error) {
          console.error('❌ API Error:', result.error);
          console.error('Details:', result.details);
          console.error('Stack:', result.stack);
          throw new Error(result.details || result.error);
        }
        
        setPackages(result.packages);
        console.log('📦 Loaded packages:', result.packages);
      } catch (error) {
        console.error('Error loading packages:', error);
      } finally {
        setLoading(false);
      }
    }

    if (data.sessionId) {
      loadPackages();
    }
  }, [data.sessionId]);

  const handleSelect = (pkg: SystemPackage) => {
    setSelectedPackage(pkg);
  };

  const handleContinue = async () => {
    if (!selectedPackage) return;

    try {
      setSaving(true);
      
      // Save package selection to database
      const response = await fetch('/api/quotes/select-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          selectedPackage,
          customizationNotes: customizationNotes || null,
        }),
      });

      if (response.ok) {
        console.log('✅ Package selection saved to database');
        
        // Update local state
        updateData({
          selectedPackage,
          customizationNotes,
        });
        
        nextStep();
      } else {
        console.error('Failed to save package selection');
      }
    } catch (error) {
      console.error('Error saving package:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-gray-600">Generating your custom packages...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No packages available. Please contact support.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPackageCard = (pkg: SystemPackage) => {
    const isSelected = selectedPackage?.templateId === pkg.templateId;
    const isRecommended = pkg.badge === 'Most Popular';

    return (
      <Card
        key={pkg.templateId}
        className={`
          relative cursor-pointer transition-all duration-200
          ${isSelected ? 'ring-2 ring-blue-600 shadow-xl scale-105' : 'hover:shadow-lg'}
          ${isRecommended ? 'border-2 border-orange-500' : ''}
        `}
        onClick={() => handleSelect(pkg)}
      >
        {pkg.badge && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
            <Badge 
              className="px-4 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: pkg.highlightColor || '#f97316' }}
            >
              {pkg.badge}
            </Badge>
          </div>
        )}

        <CardHeader className={`text-center pb-4 ${isRecommended ? 'pt-6' : ''}`}>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mx-auto mb-3">
            <Sun className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl mb-1">{pkg.displayName}</CardTitle>
          <p className="text-sm text-gray-600">{pkg.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* System Specs */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">System Size</span>
              <span className="font-bold text-gray-900">{pkg.solarKw}kW</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Solar Panels</span>
              <span className="font-bold text-gray-900">
                {pkg.panelCount} × {pkg.panelWattage}W
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Battery</span>
              <span className="font-bold text-gray-900">
                {pkg.batteryKwh > 0 ? (
                  <>
                    {(pkg as any).batteryCount > 1 
                      ? `${(pkg as any).batteryCount}x ${(pkg as any).batteryUnitCapacity}kWh ${pkg.batteryBrand || ''} (${pkg.batteryKwh}kWh total)`
                      : `${pkg.batteryKwh}kWh ${pkg.batteryBrand || ''}`
                    }
                  </>
                ) : 'No Battery'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Coverage</span>
              <span className="font-bold text-green-600">{pkg.coveragePercent}%</span>
            </div>
          </div>

          {/* Savings Highlight */}
          <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(pkg.annualSavings)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(pkg.annualSavings / 12)}/month
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-3 border-t border-b">
            <div className="text-sm text-gray-600 mb-1">Total Investment</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(pkg.totalAfterRebates)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              After {formatCurrency(pkg.totalRebates)} in rebates
            </div>
          </div>

          {/* Payback */}
          <div className="flex items-center justify-center space-x-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Payback in</span>
            <span className="font-bold text-blue-600">
              {pkg.paybackYears} years
            </span>
          </div>

          {/* Benefits */}
          <div className="space-y-2 pt-2">
            {pkg.features && Array.isArray(pkg.features) && pkg.features.map((feature: string, index: number) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Select Button */}
          <Button
            onClick={() => handleSelect(pkg)}
            className={`w-full ${isSelected ? 'bg-blue-600' : ''}`}
            variant={isSelected ? 'default' : 'outline'}
            size="lg"
          >
            {isSelected ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Selected
              </>
            ) : (
              'Select This System'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Choose Your Perfect Solar System
        </h2>
        <p className="text-lg text-gray-600">
          We've created 3 custom options based on your roof and energy usage
        </p>
      </div>

      {/* System Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {packages.map((pkg) => renderPackageCard(pkg))}
      </div>

      {/* Customization Notes */}
      {selectedPackage && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Any Special Requirements?</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="customization" className="text-sm text-gray-700 mb-2 block">
              Tell us if you'd like to customize this package (optional)
            </Label>
            <Textarea
              id="customization"
              placeholder="e.g., 'I'd like a larger battery' or 'Can we add more panels?'"
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              rows={3}
              className="bg-white"
            />
          </CardContent>
        </Card>
      )}

      {/* Comparison Table Toggle */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={() => setShowComparison(!showComparison)}
          className="text-blue-600"
        >
          {showComparison ? 'Hide' : 'Show'} Detailed Comparison
        </Button>
      </div>

      {/* Comparison Table */}
      {showComparison && packages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Feature</th>
                    {packages.map((pkg) => (
                      <th key={pkg.templateId} className="text-center py-3 px-4">
                        {pkg.displayName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">System Size</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{pkg.solarKw}kW</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Panel Count</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{pkg.panelCount}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Battery Size</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{pkg.batteryKwh}kWh</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Daily Generation</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{pkg.dailyGeneration} kWh</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Coverage</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4 font-semibold text-green-600">
                        {pkg.coveragePercent}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Annual Savings</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4 font-semibold text-green-600">
                        {formatCurrency(pkg.annualSavings)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">25-Year Savings</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{formatCurrency(pkg.year25Savings)}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Payback Period</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4">{pkg.paybackYears} years</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Total Investment</td>
                    {packages.map((pkg) => (
                      <td key={pkg.templateId} className="text-center py-3 px-4 font-bold">
                        {formatCurrency(pkg.totalAfterRebates)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!selectedPackage && packages.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Home className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Not sure which to choose?
                </h3>
                <p className="text-sm text-gray-700">
                  Each package is customized for your home based on your actual energy usage ({data.dailyConsumption?.toFixed(1)} kWh/day) and roof capacity.
                  Choose the package that best fits your budget and energy independence goals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button onClick={prevStep} variant="outline" size="lg" className="w-full sm:w-auto">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedPackage || saving}
          size="lg"
          className="w-full sm:w-auto sm:min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Continue to Contact Details</span>
              <span className="sm:hidden">Continue to Contact</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
