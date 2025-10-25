'use client';

import { MonthlyProductionChart } from '@/components/charts/MonthlyProductionChart';
import { EnergyFlowChart } from '@/components/charts/EnergyFlowChart';
import { FinancialProjectionChart } from '@/components/charts/FinancialProjectionChart';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface ProposalChartsSectionProps {
  quote: any;
}

export default function ProposalChartsSection({ quote }: ProposalChartsSectionProps) {
  // Parse monthly production data
  const monthlyData = quote.monthlyProductionData 
    ? (typeof quote.monthlyProductionData === 'string' 
        ? JSON.parse(quote.monthlyProductionData)
        : quote.monthlyProductionData)
    : [];

  // Calculate daily production
  const dailyProduction = quote.systemSizeKw * 4.5; // Perth average

  // Calculate feed-in revenue
  const feedInTariff = 0.07; // $0.07/kWh
  const annualExport = (quote.exportedKwh || 0) * 365;
  const feedInRevenue = annualExport * feedInTariff;

  // Check if we have the required data
  const hasProductionData = monthlyData.length > 0 && quote.annualProductionKwh;
  const hasEnergyFlowData = quote.selfConsumedKwh && quote.exportedKwh && quote.gridImportKwh;
  const hasFinancialData = quote.totalCostAfterRebates && quote.annualSavings;

  if (!hasProductionData && !hasEnergyFlowData && !hasFinancialData) {
    return null; // Don't show section if no data available
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Section Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <BarChart3 className="w-5 h-5" />
          <span className="font-semibold text-lg">Your Solar Performance Analysis</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          See Your Solar System in Action
        </h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          These charts show exactly how your solar system will perform throughout the year, 
          your energy independence, and your long-term financial returns.
        </p>
      </div>

      {/* Charts */}
      <div className="space-y-12">
        {/* Monthly Production Chart */}
        {hasProductionData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MonthlyProductionChart
              monthlyData={monthlyData}
              systemSizeKw={quote.systemSizeKw}
              annualTotalKwh={quote.annualProductionKwh}
            />
          </div>
        )}

        {/* Energy Flow Chart */}
        {hasEnergyFlowData && quote.dailyConsumption && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <EnergyFlowChart
              dailyProduction={dailyProduction}
              dailyConsumption={quote.dailyConsumption}
              selfConsumedKwh={quote.selfConsumedKwh}
              exportedKwh={quote.exportedKwh}
              gridImportKwh={quote.gridImportKwh}
              hasBattery={quote.batterySizeKwh > 0}
              batteryChargedKwh={quote.batteryChargedKwh || 0}
              batteryDischargedKwh={quote.batteryDischargedKwh || 0}
            />
          </div>
        )}

        {/* Financial Projection Chart */}
        {hasFinancialData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <FinancialProjectionChart
              systemCost={quote.totalCostAfterRebates}
              annualSavings={quote.annualSavings}
              feedInRevenue={feedInRevenue}
              electricityRateIncrease={0.03}
              systemDegradation={0.005}
              inverterReplacementYear={12}
              inverterReplacementCost={2000}
            />
          </div>
        )}
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Data You Can Trust
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl mb-2">📊</div>
              <p className="font-semibold text-gray-900 mb-1">Perth-Specific Data</p>
              <p className="text-sm text-gray-600">
                Based on actual Bureau of Meteorology solar irradiance data for Perth, WA
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl mb-2">🎯</div>
              <p className="font-semibold text-gray-900 mb-1">Conservative Estimates</p>
              <p className="text-sm text-gray-600">
                Includes realistic efficiency losses, shading, and system degradation
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-gray-900 mb-1">Verified Calculations</p>
              <p className="text-sm text-gray-600">
                All projections follow Clean Energy Council guidelines and industry standards
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-6 py-3 rounded-full border-2 border-green-200">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">
            Ready to start saving? Let's make it happen!
          </span>
        </div>
      </div>
    </div>
  );
}
