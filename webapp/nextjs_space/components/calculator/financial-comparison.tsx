'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface FinancialComparisonProps {
  sunDirectData: {
    annualProduction: number;
    annualSavings: number;
    paybackYears: number;
  };
  googleData?: {
    annualProduction: number;
    annualSavings: number;
    paybackYears: number;
  };
  finalEstimate?: {
    annualProduction: number;
    annualSavings: number;
    paybackYears: number;
  };
}

export function FinancialComparison({ 
  sunDirectData, 
  googleData, 
  finalEstimate 
}: FinancialComparisonProps) {
  if (!googleData || !finalEstimate) {
    return null;
  }

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-600" />
            Dual AI Verification
          </CardTitle>
          <Badge variant="outline" className="border-orange-600 text-orange-700">
            High Confidence
          </Badge>
        </div>
        <CardDescription>
          Your estimate verified by two independent AI systems for maximum accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Annual Production</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Annual Savings</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Payback Period</th>
              </tr>
            </thead>
            <tbody>
              {/* Google AI Row */}
              <tr className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Google AI</div>
                      <div className="text-xs text-gray-500">Satellite data analysis</div>
                    </div>
                  </div>
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {googleData.annualProduction.toLocaleString()} kWh
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {formatCurrency(googleData.annualSavings)}
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {googleData.paybackYears.toFixed(1)} years
                </td>
              </tr>

              {/* Sun Direct Row */}
              <tr className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900">Sun Direct</div>
                      <div className="text-xs text-gray-500">Local expertise + usage patterns</div>
                    </div>
                  </div>
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {sunDirectData.annualProduction.toLocaleString()} kWh
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {formatCurrency(sunDirectData.annualSavings)}
                </td>
                <td className="text-center py-4 px-4 font-medium text-gray-900">
                  {sunDirectData.paybackYears.toFixed(1)} years
                </td>
              </tr>

              {/* Final Estimate Row */}
              <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">Final Estimate</div>
                      <div className="text-xs text-gray-600">Combined dual-verification</div>
                    </div>
                  </div>
                </td>
                <td className="text-center py-4 px-4 font-bold text-lg text-green-700">
                  {finalEstimate.annualProduction.toLocaleString()} kWh
                </td>
                <td className="text-center py-4 px-4 font-bold text-lg text-green-700">
                  {formatCurrency(finalEstimate.annualSavings)}
                </td>
                <td className="text-center py-4 px-4 font-bold text-lg text-green-700">
                  {finalEstimate.paybackYears.toFixed(1)} years
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Why Dual Verification Matters
          </h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Google AI:</strong> Analyzes millions of installations worldwide with satellite precision</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Sun Direct:</strong> Perth-specific expertise with real customer usage data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-0.5">✓</span>
              <span><strong>Combined:</strong> Most accurate estimate by balancing global AI with local knowledge</span>
            </li>
          </ul>
        </div>

        {/* Variance Indicator */}
        {(() => {
          const productionVariance = Math.abs(googleData.annualProduction - sunDirectData.annualProduction) / 
                                     ((googleData.annualProduction + sunDirectData.annualProduction) / 2) * 100;
          const savingsVariance = Math.abs(googleData.annualSavings - sunDirectData.annualSavings) / 
                                 ((googleData.annualSavings + sunDirectData.annualSavings) / 2) * 100;
          
          if (productionVariance < 10 && savingsVariance < 10) {
            return (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <strong>🎯 High Agreement:</strong> Both systems are within {Math.max(productionVariance, savingsVariance).toFixed(1)}% 
                of each other, indicating a highly reliable estimate.
              </div>
            );
          }
          
          return null;
        })()}
      </CardContent>
    </Card>
  );
}
