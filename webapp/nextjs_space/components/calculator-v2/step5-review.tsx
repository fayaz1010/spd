'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, DollarSign, Zap, Battery, TrendingUp, Leaf, Package, CheckCircle2, Loader2 } from 'lucide-react';
import { CalculatorData } from './calculator-flow-v2';

interface Step5Props {
  data: Partial<CalculatorData>;
  updateData: (data: Partial<CalculatorData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export function Step5Review({ data, updateData, nextStep, prevStep }: Step5Props) {
  const [saving, setSaving] = useState(false);
  // Support both old and new data structures
  const quote = data.selectedQuote || data.selectedPackage;

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No package selected. Please go back and choose a system.</p>
        <Button onClick={prevStep} className="mt-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }
  
  // If using new package structure, show simplified view
  if (data.selectedPackage && !data.selectedQuote) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Customize Your {quote.displayName}
          </h2>
          <p className="text-lg text-gray-600">
            Review and customize your solar system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selected Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Solar System</div>
                <div className="text-xl font-bold">{quote.solarKw}kW</div>
                <div className="text-sm text-gray-500">{quote.panelCount} panels</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Battery</div>
                <div className="text-xl font-bold">{quote.batteryKwh}kWh</div>
                <div className="text-sm text-gray-500">{quote.batteryBrand || 'Included'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Investment</div>
                <div className="text-xl font-bold text-green-600">
                  ${quote.totalAfterRebates?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">After rebates</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Annual Savings</div>
                <div className="text-xl font-bold text-blue-600">
                  ${quote.annualSavings?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Per year</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-center text-gray-700">
              🚧 <strong>Full customization page coming soon!</strong><br/>
              You'll be able to customize panels, battery, and inverter brands.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button onClick={prevStep} variant="outline" size="lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button onClick={nextStep} size="lg">
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
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

  const handleContinue = async () => {
    try {
      setSaving(true);

      // Save quote to database
      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: data.sessionId,
          quote: quote,
          address: data.address,
          propertyType: data.propertyType,
          roofType: data.roofType,
          quarterlyBill: data.quarterlyBill,
          householdSize: data.householdSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save quote');
      }

      const result = await response.json();

      updateData({
        quoteId: result.quoteId,
      });

      nextStep();
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Review Your Solar System
        </h2>
        <p className="text-lg text-gray-600">
          Here's a complete breakdown of your {data.selectedSize === 'small' ? 'Essential' : data.selectedSize === 'medium' ? 'Smart' : 'Premium'} Solar system
        </p>
      </div>

      {/* System Overview */}
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-blue-600" />
            <span>System Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{quote.systemSizeKw}kW</div>
              <div className="text-sm text-gray-600">Solar System</div>
              <div className="text-xs text-gray-500 mt-1">
                {quote.panelCount} × {quote.panelWattage}W panels
              </div>
            </div>
            <div className="text-center">
              <Battery className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {quote.batterySizeKwh > 0 ? `${quote.batterySizeKwh}kWh` : 'No Battery'}
              </div>
              <div className="text-sm text-gray-600">Battery Storage</div>
              {quote.batteryBrand && (
                <div className="text-xs text-gray-500 mt-1">
                  {quote.batteryBrand.manufacturer} {quote.batteryBrand.name}
                </div>
              )}
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {quote.production.annualGeneration.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">kWh per year</div>
              <div className="text-xs text-gray-500 mt-1">
                ~{quote.production.dailyGeneration} kWh/day
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Investment Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-700">Solar Panels ({quote.panelBrand.manufacturer})</span>
              <span className="font-semibold">{formatCurrency(quote.costs.panels)}</span>
            </div>
            {quote.costs.battery > 0 && (
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-700">Battery Storage</span>
                <span className="font-semibold">{formatCurrency(quote.costs.battery)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2">
              <span className="text-gray-700">Inverter ({quote.inverterBrand.manufacturer})</span>
              <span className="font-semibold">{formatCurrency(quote.costs.inverter)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-700">Installation & Setup</span>
              <span className="font-semibold">{formatCurrency(quote.costs.installation)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded">
              <span className="font-semibold text-gray-900">Subtotal</span>
              <span className="font-bold text-lg">{formatCurrency(quote.costs.subtotal)}</span>
            </div>
          </div>

          {/* Rebates */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">Government Rebates</h4>
            <div className="flex justify-between items-center text-green-700">
              <span>Federal SRES (Solar Panels)</span>
              <span className="font-semibold">-{formatCurrency(quote.rebates.federalSRES)}</span>
            </div>
            {quote.rebates.federalBattery > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <span>Federal Battery Rebate</span>
                <span className="font-semibold">-{formatCurrency(quote.rebates.federalBattery)}</span>
              </div>
            )}
            {quote.rebates.waState > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <span>WA State Battery Scheme</span>
                <span className="font-semibold">-{formatCurrency(quote.rebates.waState)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded border-t">
              <span className="font-semibold text-green-900">Total Rebates</span>
              <span className="font-bold text-lg text-green-700">-{formatCurrency(quote.rebates.total)}</span>
            </div>
          </div>

          {/* Final Price */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center py-4 bg-blue-50 px-4 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Your Total Investment</div>
                <div className="text-xs text-gray-500 mt-1">After all rebates</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(quote.totalAfterRebates)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Deposit: {formatCurrency(quote.depositAmount)} (10%)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span>Your Savings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Monthly Savings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(quote.savings.monthly)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Annual Savings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(quote.savings.annual)}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">25-Year Savings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(quote.savings.year25)}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <div className="text-sm text-gray-600">Payback Period</div>
                <div className="text-xl font-bold text-blue-600">
                  {quote.roi.paybackYears} years
                </div>
              </div>
              <div className="text-gray-300">|</div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Return on Investment</div>
                <div className="text-xl font-bold text-blue-600">
                  {quote.roi.roiPercentage}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Leaf className="w-6 h-6 text-green-600" />
            <span>Environmental Impact</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {quote.environmental.co2SavedPerYear}t
              </div>
              <div className="text-sm text-gray-600">CO₂ Saved per Year</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {quote.environmental.equivalentTrees}
              </div>
              <div className="text-sm text-gray-600">Equivalent Trees Planted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {quote.environmental.equivalentCars}
              </div>
              <div className="text-sm text-gray-600">Cars Off the Road</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Solar Panels</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{quote.panelBrand.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{quote.panelBrand.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Wattage:</span>
                  <span className="font-medium">{quote.panelBrand.wattage}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warranty:</span>
                  <span className="font-medium">{quote.panelBrand.warrantyYears} years</span>
                </div>
              </div>
            </div>

            {quote.batteryBrand && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Battery Storage</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Brand:</span>
                    <span className="font-medium">{quote.batteryBrand.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{quote.batteryBrand.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{quote.batteryBrand.capacityKwh}kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Warranty:</span>
                    <span className="font-medium">{quote.batteryBrand.warrantyYears} years</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Inverter</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand:</span>
                  <span className="font-medium">{quote.inverterBrand.manufacturer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-medium">{quote.inverterBrand.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{quote.inverterBrand.capacityKw}kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Warranty:</span>
                  <span className="font-medium">{quote.inverterBrand.warrantyYears} years</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 mb-4">What's Included</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Professional installation',
              'All mounting hardware',
              'Electrical connection',
              'System commissioning',
              'Monitoring system setup',
              'Warranty registration',
              'Council approvals assistance',
              'Post-installation support',
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button onClick={prevStep} variant="outline" size="lg">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={saving}
          size="lg"
          className="min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
