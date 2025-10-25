'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import { Sun, Battery, Zap, TrendingUp, Leaf, Award, Star, Crown } from 'lucide-react';

interface PremiumTemplateProps {
  quoteData: any;
  companySettings?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export function PremiumTemplate({ quoteData, companySettings }: PremiumTemplateProps) {
  const primaryColor = companySettings?.primaryColor || '#7c3aed';
  const companyName = companySettings?.companyName || 'Sun Direct Power';

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-12 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Luxury Header */}
      <div className="text-center space-y-6 pb-8 border-b-2 border-purple-200">
        {companySettings?.logoUrl && (
          <img src={companySettings.logoUrl} alt={companyName} className="h-20 mx-auto" />
        )}
        <div className="flex items-center justify-center gap-3">
          <Crown className="w-10 h-10 text-purple-600" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Premium Solar Solution
          </h1>
          <Crown className="w-10 h-10 text-purple-600" />
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          An exclusive, bespoke solar energy system designed specifically for your property
        </p>
        <div className="flex items-center justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>

      {/* Premium System Showcase */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl opacity-10"></div>
        <Card className="border-2 border-purple-200 shadow-2xl relative">
          <CardContent className="p-10">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sun className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {quoteData.numPanels}
                </div>
                <div className="text-gray-600 font-medium">Premium Solar Panels</div>
                <div className="text-sm text-gray-500 mt-2">
                  {quoteData.panelBrand?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {quoteData.panelBrand?.wattage || 440}W High-Efficiency
                </div>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {quoteData.systemSizeKw}kW
                </div>
                <div className="text-gray-600 font-medium">Total System Capacity</div>
                <div className="text-sm text-gray-500 mt-2">
                  {quoteData.inverterBrand?.name}
                </div>
                <div className="text-xs text-gray-400">
                  Premium Inverter Technology
                </div>
              </div>

              {quoteData.batterySizeKwh && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <Battery className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {quoteData.batterySizeKwh}kWh
                  </div>
                  <div className="text-gray-600 font-medium">Energy Storage</div>
                  <div className="text-sm text-gray-500 mt-2">
                    {quoteData.batteryBrand?.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    Advanced Battery System
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Presentation */}
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 text-white rounded-3xl p-10 shadow-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">Your Exclusive Investment</h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center text-lg">
            <span className="text-purple-200">Premium Solar System</span>
            <span className="font-semibold">{formatCurrency(quoteData.solarCost || 0)}</span>
          </div>
          {quoteData.batteryCost > 0 && (
            <div className="flex justify-between items-center text-lg">
              <span className="text-purple-200">Advanced Battery Storage</span>
              <span className="font-semibold">{formatCurrency(quoteData.batteryCost)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-lg">
            <span className="text-purple-200">Premium Inverter System</span>
            <span className="font-semibold">{formatCurrency(quoteData.inverterCost || 0)}</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-purple-200">White-Glove Installation</span>
            <span className="font-semibold">{formatCurrency(quoteData.installationCost || 0)}</span>
          </div>
          
          <div className="border-t-2 border-purple-400 pt-4 mt-4">
            <div className="flex justify-between items-center text-xl">
              <span>Subtotal</span>
              <span className="font-bold">{formatCurrency(quoteData.subtotal)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-lg text-green-300">
            <span>Government Incentives</span>
            <span className="font-semibold">-{formatCurrency(quoteData.totalRebates)}</span>
          </div>
          
          <div className="border-t-4 border-yellow-400 pt-6 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">Total Investment</span>
              <span className="text-4xl font-bold text-yellow-400">
                {formatCurrency(quoteData.finalTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mt-8">
          <div className="text-center text-sm text-purple-200 mb-3">
            Flexible Payment Options Available
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="font-semibold mb-1">Premium Finance</div>
              <div className="text-purple-200">Low-interest payment plans</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="font-semibold mb-1">Exclusive Deposit</div>
              <div className="text-purple-200">Secure your installation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exceptional Returns */}
      <Card className="border-2 border-purple-200 shadow-xl">
        <CardContent className="p-10">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Exceptional Returns</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border-2 border-purple-200">
              <div className="text-sm text-gray-600 mb-2">Annual Savings</div>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {formatCurrency(quoteData.annualSavings)}
              </div>
              <div className="text-xs text-gray-500">Every year on energy costs</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
              <div className="text-sm text-gray-600 mb-2">Lifetime Value</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {formatCurrency(quoteData.savings25Years)}
              </div>
              <div className="text-xs text-gray-500">25-year total savings</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border-2 border-yellow-200">
              <div className="text-sm text-gray-600 mb-2">Investment Return</div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {quoteData.paybackYears?.toFixed(1)} years
              </div>
              <div className="text-xs text-gray-500">Full payback period</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Legacy */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-3xl p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Leaf className="w-10 h-10" />
          <h2 className="text-3xl font-bold">Your Environmental Legacy</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold mb-2">
              {(quoteData.systemSizeKw * 1460 * 0.7 / 1000).toFixed(1)}
            </div>
            <div className="text-xl mb-1">Tonnes of CO₂</div>
            <div className="text-green-200">Prevented annually</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="text-5xl font-bold mb-2">
              {Math.round(quoteData.systemSizeKw * 1460 * 0.7 / 1000 / 0.5)}
            </div>
            <div className="text-xl mb-1">Trees Planted</div>
            <div className="text-green-200">Equivalent impact</div>
          </div>
        </div>
      </div>

      {/* Premium Benefits */}
      <Card className="border-2 border-purple-200">
        <CardContent className="p-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Exclusive Premium Benefits
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Award, title: 'VIP Installation Service', desc: 'Priority scheduling with our master installers' },
              { icon: Star, title: 'Extended Warranty', desc: '25-year comprehensive coverage on all components' },
              { icon: Crown, title: 'Concierge Support', desc: 'Dedicated account manager for lifetime support' },
              { icon: Leaf, title: 'Premium Monitoring', desc: 'Real-time system performance tracking' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Elegant Footer */}
      <div className="text-center space-y-4 pt-8 border-t-2 border-purple-200">
        <p className="text-sm text-gray-500">
          This exclusive proposal is valid for 30 days and is subject to site assessment
        </p>
        <div className="flex items-center justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-gray-700 font-medium">
          {companyName} Premium Solar Solutions
        </p>
        <p className="text-sm text-gray-500">
          info@sundirectpower.com.au | 1300 XXX XXX | Premium Service Line
        </p>
      </div>
    </div>
  );
}
