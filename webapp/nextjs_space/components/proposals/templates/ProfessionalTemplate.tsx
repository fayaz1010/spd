'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import { Sun, Battery, Zap, TrendingUp, Calendar, ShieldCheck, Award, CheckCircle } from 'lucide-react';

interface ProfessionalTemplateProps {
  quoteData: any;
  companySettings?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

export function ProfessionalTemplate({ quoteData, companySettings }: ProfessionalTemplateProps) {
  const primaryColor = companySettings?.primaryColor || '#1e40af';
  const companyName = companySettings?.companyName || 'Sun Direct Power';

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-8 bg-white">
      {/* Professional Header */}
      <div className="border-b-4 pb-6" style={{ borderColor: primaryColor }}>
        <div className="flex justify-between items-start">
          <div>
            {companySettings?.logoUrl && (
              <img src={companySettings.logoUrl} alt={companyName} className="h-12 mb-4" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              Solar System Proposal
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Professional Quote for {quoteData.systemSizeKw}kW Solar Installation
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Quote Reference</div>
            <div className="text-lg font-semibold" style={{ color: primaryColor }}>
              {quoteData.quoteReference || 'QUOTE-2025-001'}
            </div>
            <div className="text-sm text-gray-500 mt-2">Valid Until</div>
            <div className="text-sm font-medium">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU')}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="border-2">
        <CardHeader style={{ backgroundColor: `${primaryColor}10` }}>
          <CardTitle className="text-xl" style={{ color: primaryColor }}>
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">System Specifications</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Solar Panels:</span>
                  <span className="font-medium">{quoteData.numPanels} × {quoteData.panelBrand?.wattage || 440}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Capacity:</span>
                  <span className="font-medium">{quoteData.systemSizeKw}kW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inverter:</span>
                  <span className="font-medium">{quoteData.inverterBrand?.name}</span>
                </div>
                {quoteData.batterySizeKwh && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Battery Storage:</span>
                    <span className="font-medium">{quoteData.batterySizeKwh}kWh</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Financial Overview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">System Cost:</span>
                  <span className="font-medium">{formatCurrency(quoteData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Rebates:</span>
                  <span className="font-medium">-{formatCurrency(quoteData.totalRebates)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 text-lg font-bold" style={{ color: primaryColor }}>
                  <span>Net Investment:</span>
                  <span>{formatCurrency(quoteData.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Investment Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="border-b-2">
              <tr className="text-left">
                <th className="pb-3 font-semibold text-gray-700">Item</th>
                <th className="pb-3 font-semibold text-gray-700 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-3">
                  <div className="font-medium">Solar Panel System</div>
                  <div className="text-sm text-gray-500">
                    {quoteData.numPanels} × {quoteData.panelBrand?.name} panels
                  </div>
                </td>
                <td className="py-3 text-right font-medium">{formatCurrency(quoteData.solarCost || 0)}</td>
              </tr>
              {quoteData.batteryCost > 0 && (
                <tr>
                  <td className="py-3">
                    <div className="font-medium">Battery Storage System</div>
                    <div className="text-sm text-gray-500">
                      {quoteData.batteryBrand?.name} - {quoteData.batterySizeKwh}kWh
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">{formatCurrency(quoteData.batteryCost)}</td>
                </tr>
              )}
              <tr>
                <td className="py-3">
                  <div className="font-medium">Inverter System</div>
                  <div className="text-sm text-gray-500">{quoteData.inverterBrand?.name}</div>
                </td>
                <td className="py-3 text-right font-medium">{formatCurrency(quoteData.inverterCost || 0)}</td>
              </tr>
              <tr>
                <td className="py-3">
                  <div className="font-medium">Professional Installation</div>
                  <div className="text-sm text-gray-500">Including all labor, materials, and permits</div>
                </td>
                <td className="py-3 text-right font-medium">{formatCurrency(quoteData.installationCost || 0)}</td>
              </tr>
              <tr className="font-semibold bg-gray-50">
                <td className="py-3">Subtotal</td>
                <td className="py-3 text-right">{formatCurrency(quoteData.subtotal)}</td>
              </tr>
              <tr className="text-green-600">
                <td className="py-3">
                  <div className="font-medium">Government Rebates</div>
                  <div className="text-sm">Federal SRES + State incentives</div>
                </td>
                <td className="py-3 text-right font-medium">-{formatCurrency(quoteData.totalRebates)}</td>
              </tr>
              <tr className="font-bold text-lg border-t-2" style={{ color: primaryColor }}>
                <td className="py-4">Total Investment</td>
                <td className="py-4 text-right">{formatCurrency(quoteData.finalTotal)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Return on Investment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6" style={{ color: primaryColor }} />
            Return on Investment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-l-4 pl-4" style={{ borderColor: primaryColor }}>
              <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
              <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                {formatCurrency(quoteData.annualSavings)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Per year on electricity bills</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">25-Year Savings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(quoteData.savings25Years)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Total lifetime savings</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-gray-600 mb-1">Payback Period</div>
              <div className="text-2xl font-bold text-purple-600">
                {quoteData.paybackYears?.toFixed(1)} years
              </div>
              <div className="text-xs text-gray-500 mt-1">Return on investment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Choose Us */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Why Choose {companyName}?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Award, title: 'CEC Accredited', desc: 'Clean Energy Council certified installers' },
              { icon: ShieldCheck, title: 'Premium Quality', desc: 'Top-tier components with industry-leading warranties' },
              { icon: Calendar, title: 'Fast Installation', desc: 'Professional installation within 2-4 weeks' },
              { icon: CheckCircle, title: 'Full Support', desc: '25-year warranty and ongoing maintenance' },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <item.icon className="w-6 h-6 flex-shrink-0" style={{ color: primaryColor }} />
                <div>
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <div className="text-xs text-gray-500 border-t pt-4 space-y-2">
        <p className="font-semibold text-gray-700">Terms & Conditions:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>This quote is valid for 30 days from the date of issue</li>
          <li>Final price subject to site inspection and structural assessment</li>
          <li>Installation timeline subject to permit approval and weather conditions</li>
          <li>All work performed by CEC accredited installers</li>
          <li>Full warranty documentation provided upon installation completion</li>
        </ul>
        <p className="mt-4 text-center">
          <span className="font-semibold">{companyName}</span> | info@sundirectpower.com.au | 1300 XXX XXX
        </p>
      </div>
    </div>
  );
}
