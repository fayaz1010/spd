'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import { Sun, Battery, Zap, TrendingUp, Calendar, ShieldCheck, Leaf } from 'lucide-react';

interface ModernTemplateProps {
  quoteData: any;
  companySettings?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export function ModernTemplate({ quoteData, companySettings }: ModernTemplateProps) {
  const primaryColor = companySettings?.primaryColor || '#2563eb';
  const companyName = companySettings?.companyName || 'Sun Direct Power';

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-8 bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="text-center space-y-4">
        {companySettings?.logoUrl && (
          <img src={companySettings.logoUrl} alt={companyName} className="h-16 mx-auto" />
        )}
        <h1 className="text-4xl font-bold" style={{ color: primaryColor }}>
          Your Solar Solution
        </h1>
        <p className="text-xl text-gray-600">
          Personalized quote for {quoteData.systemSizeKw}kW solar system
        </p>
      </div>

      {/* System Overview */}
      <Card className="border-2" style={{ borderColor: primaryColor }}>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Sun className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
              <div className="text-3xl font-bold">{quoteData.numPanels}</div>
              <div className="text-gray-600">Solar Panels</div>
              <div className="text-sm text-gray-500 mt-1">
                {quoteData.panelBrand?.name}
              </div>
            </div>
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
              <div className="text-3xl font-bold">{quoteData.systemSizeKw}kW</div>
              <div className="text-gray-600">System Size</div>
              <div className="text-sm text-gray-500 mt-1">
                {quoteData.inverterBrand?.name}
              </div>
            </div>
            {quoteData.batterySizeKwh && (
              <div className="text-center">
                <Battery className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
                <div className="text-3xl font-bold">{quoteData.batterySizeKwh}kWh</div>
                <div className="text-gray-600">Battery Storage</div>
                <div className="text-sm text-gray-500 mt-1">
                  {quoteData.batteryBrand?.name}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
          Investment Summary
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">System Cost</span>
            <span className="font-semibold">{formatCurrency(quoteData.subtotal)}</span>
          </div>
          <div className="flex justify-between text-lg text-green-600">
            <span>Government Rebates</span>
            <span className="font-semibold">-{formatCurrency(quoteData.totalRebates)}</span>
          </div>
          <div className="border-t-2 pt-4 flex justify-between text-2xl font-bold">
            <span>Your Investment</span>
            <span style={{ color: primaryColor }}>{formatCurrency(quoteData.finalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Savings Projection */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-8 h-8" style={{ color: primaryColor }} />
            <h2 className="text-2xl font-bold">Your Savings</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">Annual Savings</div>
              <div className="text-3xl font-bold" style={{ color: primaryColor }}>
                {formatCurrency(quoteData.annualSavings)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">25-Year Savings</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(quoteData.savings25Years)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">Payback Period</div>
              <div className="text-3xl font-bold text-purple-600">
                {quoteData.paybackYears?.toFixed(1)} years
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Leaf className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Environmental Impact</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-4xl font-bold mb-2">
              {(quoteData.systemSizeKw * 1460 * 0.7 / 1000).toFixed(1)} tonnes
            </div>
            <div className="text-green-100">CO₂ saved annually</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">
              {Math.round(quoteData.systemSizeKw * 1460 * 0.7 / 1000 / 0.5)} trees
            </div>
            <div className="text-green-100">Equivalent trees planted</div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: primaryColor }}>
            Why Choose {companyName}?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <ShieldCheck className="w-6 h-6 flex-shrink-0" style={{ color: primaryColor }} />
              <div>
                <div className="font-semibold mb-1">Premium Quality</div>
                <div className="text-sm text-gray-600">
                  Top-tier solar panels and inverters with industry-leading warranties
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Calendar className="w-6 h-6 flex-shrink-0" style={{ color: primaryColor }} />
              <div>
                <div className="font-semibold mb-1">Fast Installation</div>
                <div className="text-sm text-gray-600">
                  Professional installation within 2-4 weeks of approval
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-8 border-t">
        <p>This quote is valid for 30 days from the date of issue.</p>
        <p className="mt-2">
          Questions? Contact us at info@sundirectpower.com.au or call 1300 XXX XXX
        </p>
      </div>
    </div>
  );
}
