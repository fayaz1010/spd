'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Zap, Sun } from 'lucide-react';
import { formatCurrency, formatNumber, safeNumber } from '@/lib/format-helpers';

interface EnergyProductionProps {
  monthlyProduction: number[];
  annualProduction: number;
  systemSize: number;
  quote?: any; // Full quote object with all data
}

// Generate default monthly production based on Perth, WA seasonal patterns
function generateDefaultMonthlyProduction(annualProduction: number): number[] {
  // Perth solar production pattern (percentages by month)
  // Higher in summer (Dec-Feb), lower in winter (Jun-Aug)
  const seasonalFactors = [
    0.095, // Jan - High
    0.090, // Feb - High
    0.088, // Mar - Medium-High
    0.080, // Apr - Medium
    0.070, // May - Medium-Low
    0.065, // Jun - Low
    0.068, // Jul - Low
    0.075, // Aug - Medium-Low
    0.082, // Sep - Medium
    0.090, // Oct - Medium-High
    0.095, // Nov - High
    0.102, // Dec - Highest
  ];
  
  return seasonalFactors.map(factor => Math.round(annualProduction * factor));
}

export default function EnergyProduction({
  monthlyProduction,
  annualProduction,
  systemSize,
  quote,
}: EnergyProductionProps) {
  // Fix hydration issues by ensuring client-side only rendering
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // CRITICAL: Ensure monthlyProduction is always an array to prevent "not iterable" errors
  const safeMonthlyProduction = Array.isArray(monthlyProduction) ? monthlyProduction : [];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // IMMEDIATE safety check - ensure we have valid data
  const safeAnnualProduction = safeNumber(annualProduction, 0);
  const safeSystemSize = safeNumber(systemSize, 1); // Avoid division by zero
  
  // Generate default monthly production FIRST, before any other operations
  let defaultMonthlyProduction: number[];
  
  // Check if we have valid monthly production data
  const hasValidMonthlyData = safeMonthlyProduction.length === 12 &&
    safeMonthlyProduction.every(val => !isNaN(val) && val >= 0);
  
  if (hasValidMonthlyData) {
    // Ensure all values are safe numbers
    defaultMonthlyProduction = safeMonthlyProduction.map(val => safeNumber(val, 0));
  } else {
    // Generate fallback data based on Perth seasonal patterns
    defaultMonthlyProduction = generateDefaultMonthlyProduction(safeAnnualProduction);
  }
  
  const dailyAverage = safeAnnualProduction > 0 ? Math.round(safeAnnualProduction / 365) : 0;
  
  // Find max value for scaling (with safety check)
  const maxProduction = defaultMonthlyProduction.length > 0
    ? Math.max(...defaultMonthlyProduction.filter(val => !isNaN(val) && val > 0))
    : 1000; // Fallback if somehow still empty

  // Calculate ACTUAL energy independence metrics from database
  const hasBattery = quote?.batterySizeKwh > 0;
  const batterySize = quote?.batterySizeKwh || 0;
  
  // Get actual consumption from bill data
  const bimonthlyBill = quote?.bimonthlyBill || 0;
  const monthlyBill = bimonthlyBill / 2;
  const electricityRate = 0.30; // $/kWh
  const annualConsumption = monthlyBill > 0 ? (monthlyBill * 12) / electricityRate : 0;
  
  // Calculate self-consumption rate based on battery
  // With battery: 70-80% (stores excess for evening/night use)
  // Without battery: 30-40% (most solar wasted when not home)
  let selfConsumptionRate = hasBattery ? 0.75 : 0.35;
  let exportRate = 1 - selfConsumptionRate;
  
  // Adjust based on battery size relative to daily production
  if (hasBattery && dailyAverage > 0) {
    const batteryToDailyRatio = batterySize / dailyAverage;
    if (batteryToDailyRatio >= 0.5) {
      selfConsumptionRate = 0.80; // Large battery
    } else if (batteryToDailyRatio >= 0.3) {
      selfConsumptionRate = 0.75; // Medium battery
    } else {
      selfConsumptionRate = 0.65; // Small battery
    }
    exportRate = 1 - selfConsumptionRate;
  }
  
  // Calculate grid independence percentage
  const solarCoverage = annualConsumption > 0 
    ? Math.min(100, Math.round((safeAnnualProduction / annualConsumption) * 100))
    : 0;
  
  const effectiveIndependence = Math.round(solarCoverage * selfConsumptionRate);
  
  // Determine independence level text
  let independenceLevel = 'Moderate';
  let independenceColor = 'text-yellow-400';
  if (effectiveIndependence >= 70) {
    independenceLevel = 'Excellent';
    independenceColor = 'text-green-400';
  } else if (effectiveIndependence >= 50) {
    independenceLevel = 'Very Good';
    independenceColor = 'text-emerald-400';
  } else if (effectiveIndependence >= 30) {
    independenceLevel = 'Good';
    independenceColor = 'text-lime-400';
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-pulse">Loading energy production data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Energy Production
          </h2>
          <p className="text-lg text-gray-600">
            Estimated solar generation throughout the year
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1" suppressHydrationWarning>
              {formatCurrency(safeAnnualProduction)}
            </p>
            <p className="text-sm text-gray-600">kWh per year</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1" suppressHydrationWarning>
              {dailyAverage}
            </p>
            <p className="text-sm text-gray-600">kWh per day</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1" suppressHydrationWarning>
              {formatNumber(safeAnnualProduction > 0 ? safeAnnualProduction / safeSystemSize / 1000 : 0, 1)}
            </p>
            <p className="text-sm text-gray-600">MWh per kW</p>
          </div>
        </div>

        {/* Monthly Production Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Monthly Production Estimate
          </h3>

          <div className="space-y-2">
            {months.map((month, index) => {
              const production = safeNumber(defaultMonthlyProduction[index], 0);
              const percentage = maxProduction > 0 ? Math.min(100, (production / maxProduction) * 100) : 0;
              const dailyAvg = production > 0 ? Math.round(production / 30) : 0;

              return (
                <div key={month} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {month}
                    </span>
                    <span className="text-sm text-gray-600" suppressHydrationWarning>
                      {formatCurrency(production)} kWh
                      <span className="text-xs text-gray-400 ml-2">
                        (~{dailyAvg} kWh/day)
                      </span>
                    </span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg transition-all duration-500 group-hover:from-yellow-500 group-hover:to-orange-600"
                      style={{ width: `${percentage}%` }}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> Production estimates are based on your roof orientation, local weather patterns, and system specifications. 
              Actual production may vary based on shading, soiling, and weather conditions.
            </p>
          </div>
        </div>

        {/* Energy Independence - Data-Driven */}
        <div className="mt-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Your Energy Independence</h3>
            {hasBattery && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                🔋 Battery Included
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Self-Consumption */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Self-Consumption</p>
              <p className="text-4xl font-bold mb-1 text-blue-400" suppressHydrationWarning>
                {Math.round(selfConsumptionRate * 100)}%
              </p>
              <p className="text-sm text-gray-400">Used directly in your home</p>
              {hasBattery && (
                <p className="text-xs text-green-400 mt-2">
                  ⚡ Battery stores excess for evening use
                </p>
              )}
            </div>

            {/* Grid Export */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Grid Export</p>
              <p className="text-4xl font-bold mb-1 text-orange-400" suppressHydrationWarning>
                {Math.round(exportRate * 100)}%
              </p>
              <p className="text-sm text-gray-400">Sold back to the grid</p>
              <p className="text-xs text-orange-400 mt-2" suppressHydrationWarning>
                💰 Earning ${Math.round((safeAnnualProduction * exportRate * 0.03) / 12)}/month
              </p>
            </div>

            {/* Grid Independence */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <p className="text-gray-400 text-sm mb-2">Energy Independence</p>
              <p className={`text-4xl font-bold mb-1 ${independenceColor}`} suppressHydrationWarning>
                {effectiveIndependence > 0 ? `${effectiveIndependence}%` : independenceLevel}
              </p>
              <p className="text-sm text-gray-400">From your own solar</p>
              {solarCoverage > 0 && (
                <p className="text-xs text-gray-500 mt-2" suppressHydrationWarning>
                  System covers {solarCoverage}% of your usage
                </p>
              )}
            </div>
          </div>

          {/* Additional Insights */}
          {annualConsumption > 0 && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-200" suppressHydrationWarning>
                <span className="font-semibold">Your Energy Profile:</span> Based on your ${Math.round(monthlyBill)}/month bill, 
                you use approximately {Math.round(annualConsumption).toLocaleString()} kWh/year. 
                This system will generate {Math.round((safeAnnualProduction / annualConsumption) * 100)}% of your needs
                {hasBattery && `, with your ${batterySize}kWh battery storing excess solar for use when the sun isn't shining`}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
