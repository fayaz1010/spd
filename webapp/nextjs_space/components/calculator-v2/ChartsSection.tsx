'use client';

import { useMemo } from 'react';
import { MonthlyProductionChart } from '@/components/charts/MonthlyProductionChart';
import { EnergyFlowChart } from '@/components/charts/EnergyFlowChart';
import { FinancialProjectionChart } from '@/components/charts/FinancialProjectionChart';
import { calculateAnnualProduction } from '@/lib/production-calculator';
import { calculateSelfConsumption } from '@/lib/self-consumption-calculator';
import { TrendingUp } from 'lucide-react';

interface ChartsSectionProps {
  systemSizeKw: number;
  batterySizeKwh: number;
  dailyConsumption: number;
  totalCostAfterRebates: number;
  annualSavings: number;
  electricityRate?: number;
  feedInTariff?: number;
}

export function ChartsSection({
  systemSizeKw,
  batterySizeKwh,
  dailyConsumption,
  totalCostAfterRebates,
  annualSavings,
  electricityRate = 0.27,
  feedInTariff = 0.07,
}: ChartsSectionProps) {
  // Calculate production data
  const productionData = useMemo(() => {
    return calculateAnnualProduction({
      systemSizeKw,
      tilt: 20, // Perth default
      azimuth: 0, // North-facing optimal
      systemEfficiency: 0.87,
      shadingLoss: 0.05,
      soilingLoss: 0.03,
    });
  }, [systemSizeKw]);

  // Calculate self-consumption
  const selfConsumptionData = useMemo(() => {
    const dailyProduction = systemSizeKw * 4.5; // Perth average: 4.5 peak sun hours
    
    return calculateSelfConsumption({
      dailyProduction,
      dailyConsumption,
      hasBattery: batterySizeKwh > 0,
      batteryCapacityKwh: batterySizeKwh,
      batteryEfficiency: 0.95,
      depthOfDischarge: 0.90,
    });
  }, [systemSizeKw, dailyConsumption, batterySizeKwh]);

  // Calculate feed-in revenue
  const feedInRevenue = useMemo(() => {
    const annualExport = selfConsumptionData.exportedKwh * 365;
    const revenue = annualExport * feedInTariff;
    
    // If revenue is very low (< $50/year), estimate based on system size
    // This happens when battery stores most excess energy
    if (revenue < 50 && batterySizeKwh > 0) {
      // Conservative estimate: 10-15% of production exported even with battery
      const annualProduction = systemSizeKw * 4.5 * 365;
      const estimatedExport = annualProduction * 0.12; // 12% export rate
      return estimatedExport * feedInTariff;
    }
    
    return revenue;
  }, [selfConsumptionData.exportedKwh, feedInTariff, batterySizeKwh, systemSizeKw]);

  const dailyProduction = systemSizeKw * 4.5;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full shadow-lg mb-4">
          <TrendingUp className="w-5 h-5" />
          <span className="font-semibold">Your Solar Performance Analysis</span>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See exactly how your solar system will perform throughout the year, 
          how much energy you'll use vs export, and your long-term financial returns.
        </p>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {/* Monthly Production Chart */}
        <MonthlyProductionChart
          monthlyData={productionData.monthlyData}
          systemSizeKw={systemSizeKw}
          annualTotalKwh={productionData.totalKwh}
        />

        {/* Energy Flow Chart */}
        <EnergyFlowChart
          dailyProduction={dailyProduction}
          dailyConsumption={dailyConsumption}
          selfConsumedKwh={selfConsumptionData.selfConsumedKwh}
          exportedKwh={selfConsumptionData.exportedKwh}
          gridImportKwh={selfConsumptionData.gridImportKwh}
          hasBattery={batterySizeKwh > 0}
          batteryChargedKwh={selfConsumptionData.batteryChargedKwh}
          batteryDischargedKwh={selfConsumptionData.batteryDischargedKwh}
        />

        {/* Financial Projection Chart */}
        <FinancialProjectionChart
          systemCost={totalCostAfterRebates}
          annualSavings={annualSavings}
          feedInRevenue={feedInRevenue}
          electricityRateIncrease={0.03} // 3% annual increase
          systemDegradation={0.005} // 0.5% annual degradation
          inverterReplacementYear={12}
          inverterReplacementCost={2000}
        />
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
        <h3 className="text-2xl font-bold text-green-900 mb-2">
          Ready to Start Saving?
        </h3>
        <p className="text-green-700 mb-4">
          These charts show the real value of your solar investment. 
          Let's make it happen!
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-green-600">
          <span>✅ Accurate Perth data</span>
          <span>•</span>
          <span>✅ Conservative estimates</span>
          <span>•</span>
          <span>✅ 25-year projection</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Export data for saving to database
 */
export function getChartDataForDatabase(
  systemSizeKw: number,
  batterySizeKwh: number,
  dailyConsumption: number,
  feedInTariff: number = 0.07
) {
  // Calculate production
  const production = calculateAnnualProduction({
    systemSizeKw,
    tilt: 20,
    azimuth: 0,
    systemEfficiency: 0.87,
    shadingLoss: 0.05,
    soilingLoss: 0.03,
  });

  // Calculate self-consumption
  const dailyProduction = systemSizeKw * 4.5;
  const selfConsumption = calculateSelfConsumption({
    dailyProduction,
    dailyConsumption,
    hasBattery: batterySizeKwh > 0,
    batteryCapacityKwh: batterySizeKwh,
    batteryEfficiency: 0.95,
    depthOfDischarge: 0.90,
  });

  return {
    // Production data
    monthlyProductionData: production.monthlyData,
    annualProductionKwh: production.totalKwh,
    
    // Self-consumption data
    selfConsumptionPercent: selfConsumption.selfConsumptionPercent,
    selfSufficiencyPercent: selfConsumption.selfSufficiencyPercent,
    selfConsumedKwh: selfConsumption.selfConsumedKwh,
    exportedKwh: selfConsumption.exportedKwh,
    gridImportKwh: selfConsumption.gridImportKwh,
    exportPercent: selfConsumption.exportPercent,
    
    // Battery data (if applicable)
    batteryChargedKwh: selfConsumption.batteryChargedKwh || 0,
    batteryDischargedKwh: selfConsumption.batteryDischargedKwh || 0,
    batteryUsagePercent: selfConsumption.batteryUsagePercent || 0,
  };
}
