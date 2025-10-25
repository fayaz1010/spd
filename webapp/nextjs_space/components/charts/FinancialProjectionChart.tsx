'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';

interface FinancialProjectionChartProps {
  systemCost: number;
  annualSavings: number;
  feedInRevenue: number;
  electricityRateIncrease?: number;  // Annual % increase (default: 3%)
  systemDegradation?: number;        // Annual % degradation (default: 0.5%)
  inverterReplacementYear?: number;  // Year to replace inverter (default: 12)
  inverterReplacementCost?: number;  // Cost to replace inverter (default: $2000)
}

export function FinancialProjectionChart({
  systemCost,
  annualSavings,
  feedInRevenue,
  electricityRateIncrease = 0.03,
  systemDegradation = 0.005,
  inverterReplacementYear = 12,
  inverterReplacementCost = 2000,
}: FinancialProjectionChartProps) {
  // Calculate 25-year projection
  const projection = useMemo(() => {
    const years = [];
    let cumulativeSavings = -systemCost; // Start with negative (investment)
    let yearlyProduction = 1.0; // 100% in year 1
    
    for (let year = 1; year <= 25; year++) {
      // Degrade production
      yearlyProduction *= (1 - systemDegradation);
      
      // Increase electricity rates
      const rateMultiplier = Math.pow(1 + electricityRateIncrease, year - 1);
      
      // Calculate savings for this year
      let yearlySavings = (annualSavings * yearlyProduction * rateMultiplier);
      let yearlyRevenue = (feedInRevenue * yearlyProduction * rateMultiplier);
      let yearlyTotal = yearlySavings + yearlyRevenue;
      
      // Subtract inverter replacement cost if applicable
      if (year === inverterReplacementYear) {
        yearlyTotal -= inverterReplacementCost;
      }
      
      cumulativeSavings += yearlyTotal;
      
      years.push({
        year,
        yearlySavings: Math.round(yearlySavings),
        yearlyRevenue: Math.round(yearlyRevenue),
        yearlyTotal: Math.round(yearlyTotal),
        cumulativeSavings: Math.round(cumulativeSavings),
        productionPercent: Math.round(yearlyProduction * 100),
      });
    }
    
    return years;
  }, [systemCost, annualSavings, feedInRevenue, electricityRateIncrease, systemDegradation, inverterReplacementYear, inverterReplacementCost]);

  // Find break-even year
  const breakEvenYear = projection.find(y => y.cumulativeSavings >= 0)?.year || 25;
  
  // Calculate totals
  const totalSavings = projection[24].cumulativeSavings;
  const totalRevenue = projection.reduce((sum, y) => sum + y.yearlyRevenue, 0);
  
  // Calculate ROI and NPV (simplified)
  const roi = ((totalSavings + systemCost) / systemCost) * 100;
  const discountRate = 0.05; // 5% discount rate
  const npv = projection.reduce((sum, y) => {
    return sum + (y.yearlyTotal / Math.pow(1 + discountRate, y.year));
  }, -systemCost);

  // Max cumulative for chart scaling
  const maxCumulative = Math.max(...projection.map(y => y.cumulativeSavings));

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-purple-600" />
          25-Year Financial Projection
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-green-700">Break-Even</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{breakEvenYear}</p>
            <p className="text-xs text-green-600">years</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-blue-700">Total Savings</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">${totalSavings.toLocaleString()}</p>
            <p className="text-xs text-blue-600">over 25 years</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-purple-700">ROI</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">{roi.toFixed(0)}%</p>
            <p className="text-xs text-purple-600">return on investment</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-orange-600" />
              <p className="text-xs font-medium text-orange-700">NPV</p>
            </div>
            <p className="text-2xl font-bold text-orange-900">${Math.round(npv).toLocaleString()}</p>
            <p className="text-xs text-orange-600">net present value</p>
          </div>
        </div>

        {/* Cumulative Savings Chart */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Cumulative Savings Over Time
          </h4>
          
          {/* Chart container with relative positioning */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-14 flex flex-col justify-between text-xs text-gray-600 text-right pr-2">
              <span>${(maxCumulative / 1000).toFixed(0)}k</span>
              <span>${(maxCumulative * 0.75 / 1000).toFixed(0)}k</span>
              <span>${(maxCumulative * 0.5 / 1000).toFixed(0)}k</span>
              <span>${(maxCumulative * 0.25 / 1000).toFixed(0)}k</span>
              <span className="font-semibold">$0</span>
              <span className="text-red-600 font-medium">-${(systemCost / 1000).toFixed(0)}k</span>
            </div>

            {/* Chart area */}
            <div className="ml-16 mr-4">
            <div className="h-64 relative border-b-2 border-l-2 border-gray-400">
              {/* Zero line */}
              <div 
                className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400"
                style={{ bottom: `${(systemCost / (maxCumulative + systemCost)) * 100}%` }}
              >
                <span className="absolute right-4 -top-2 text-xs text-gray-700 font-semibold bg-white px-2 py-0.5 rounded border border-gray-300 shadow-sm">
                  Break-even
                </span>
              </div>

              {/* Area chart */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Create path for cumulative savings */}
                <path
                  d={projection.map((y, i) => {
                    const x = (i / 24) * 100;
                    const yPos = 100 - (((y.cumulativeSavings + systemCost) / (maxCumulative + systemCost)) * 100);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${yPos}`;
                  }).join(' ') + ` L 100 100 L 0 100 Z`}
                  fill="url(#savingsGradient)"
                />
                
                {/* Line */}
                <path
                  d={projection.map((y, i) => {
                    const x = (i / 24) * 100;
                    const yPos = 100 - (((y.cumulativeSavings + systemCost) / (maxCumulative + systemCost)) * 100);
                    return `${i === 0 ? 'M' : 'L'} ${x} ${yPos}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Break-even point marker */}
                {breakEvenYear <= 25 && (
                  <circle
                    cx={((breakEvenYear - 1) / 24) * 100}
                    cy={100 - ((systemCost / (maxCumulative + systemCost)) * 100)}
                    r="1.5"
                    fill="rgb(34, 197, 94)"
                    stroke="white"
                    strokeWidth="0.3"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </svg>

              {/* X-axis labels */}
              <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-600">
                <span className="font-semibold">0</span>
                <span className="bg-green-100 px-1.5 py-0.5 rounded text-green-700 font-semibold">5</span>
                <span>10</span>
                <span>15</span>
                <span>20</span>
                <span className="font-semibold">25</span>
              </div>
            </div>
            <div className="text-center mt-10">
              <span className="text-sm text-gray-600 font-medium">Years</span>
            </div>
            </div>
          </div>
        </div>

        {/* Year-by-Year Breakdown (first 10 years) */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              First 10 Years Breakdown
            </h4>
            <p className="text-sm text-purple-100 mt-1">See your year-by-year financial returns</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Year</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Savings</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Revenue</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projection.slice(0, 10).map((year) => (
                    <tr 
                      key={year.year} 
                      className={`transition-colors ${
                        year.year === breakEvenYear 
                          ? 'bg-green-100 hover:bg-green-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-gray-900">{year.year}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        ${year.yearlySavings.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                        ${year.yearlyRevenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ${year.yearlyTotal.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-lg ${
                        year.cumulativeSavings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {year.cumulativeSavings >= 0 ? '' : '-'}${Math.abs(year.cumulativeSavings).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span className="text-gray-600"><strong>Savings:</strong> Electricity bill reduction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-gray-600"><strong>Revenue:</strong> Feed-in tariff earnings</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-gray-600"><strong>Green row:</strong> Break-even year!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assumptions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">📊 Projection Assumptions:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Electricity rate increase: {(electricityRateIncrease * 100).toFixed(1)}% per year</li>
            <li>• System degradation: {(systemDegradation * 100).toFixed(1)}% per year</li>
            <li>• Inverter replacement: Year {inverterReplacementYear} (${inverterReplacementCost.toLocaleString()})</li>
            <li>• Discount rate for NPV: 5% per year</li>
            <li>• Feed-in tariff assumed constant (conservative estimate)</li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 text-center">
          <p className="text-2xl font-bold text-green-900 mb-2">
            ${totalSavings.toLocaleString()} in Total Savings!
          </p>
          <p className="text-sm text-green-700 mb-4">
            Your solar system pays for itself in just {breakEvenYear} years, then it's pure savings for the next {25 - breakEvenYear} years!
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-green-600">
            <span>💰 {roi.toFixed(0)}% ROI</span>
            <span>•</span>
            <span>📈 ${Math.round(totalSavings / 25).toLocaleString()}/year average</span>
            <span>•</span>
            <span>🌱 25 years of clean energy</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
