'use client';

import { useState, useEffect } from 'react';
import { Zap, Battery, DollarSign, TrendingUp, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber, safeNumber } from '@/lib/format-helpers';

interface SystemCustomizerProps {
  quote: any;
}

export default function SystemCustomizer({ quote }: SystemCustomizerProps) {
  console.log('SystemCustomizer rendering with quote:', {
    systemSizeKw: quote?.systemSizeKw,
    batterySizeKwh: quote?.batterySizeKwh,
    salePrice: quote?.salePrice,
  });

  // CRITICAL: Validate quote data exists
  if (!quote || !quote.systemSizeKw || quote.systemSizeKw <= 0) {
    console.error('SystemCustomizer: Invalid quote data', quote);
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500">System customizer unavailable - invalid system configuration</p>
        </div>
      </div>
    );
  }

  // Current system values with strict validation
  const currentSystemSize = Math.max(1, safeNumber(quote.systemSizeKw, 5.7));
  const currentBatterySize = Math.max(0, safeNumber(quote.batterySizeKwh, 0));
  const currentPrice = Math.max(0, safeNumber(quote.salePrice || quote.totalCostAfterRebates || quote.totalCostIncGst, 0));
  const currentAnnualSavings = Math.max(0, safeNumber(quote.annualSavings, 0));
  const currentPayback = Math.max(0, safeNumber(quote.paybackYears, 0));
  
  // Get ORIGINAL bill (before solar) from bimonthlyBill
  const bimonthlyBill = Math.max(0, safeNumber(quote.bimonthlyBill, 0));
  const originalMonthlyBill = bimonthlyBill / 2;
  
  // Calculate current bill WITH solar
  const currentMonthlyBillWithSolar = Math.max(0, originalMonthlyBill - (currentAnnualSavings / 12));

  // Slider states
  const [systemSize, setSystemSize] = useState(currentSystemSize);
  const [batterySize, setBatterySize] = useState(currentBatterySize);
  const [calculating, setCalculating] = useState(false);
  const [calculatedScenario, setCalculatedScenario] = useState<any>(null);

  // Reset to current when quote changes
  useEffect(() => {
    setSystemSize(currentSystemSize);
    setBatterySize(currentBatterySize);
    setCalculatedScenario(null);
  }, [currentSystemSize, currentBatterySize]);

  // Calculate current total rebates from quote
  const getCurrentTotalRebates = () => {
    return safeNumber(quote.federalSolarRebate, 0) + 
           safeNumber(quote.federalBatteryRebate, 0) + 
           safeNumber(quote.stateBatteryRebate, 0) +
           safeNumber(quote.stcRebateAmount, 0) +
           safeNumber(quote.waStateRebateAmount, 0) +
           safeNumber(quote.totalRebates, 0);
  };

  // Calculate new scenario using unified API
  useEffect(() => {
    const calculateScenario = async () => {
      if (systemSize === currentSystemSize && batterySize === currentBatterySize) {
        // No changes, use current quote data
        setCalculatedScenario({
          systemSize: currentSystemSize,
          batterySize: currentBatterySize,
          newTotalPrice: currentPrice,
          annualSavings: currentAnnualSavings,
          monthlyBill: currentMonthlyBillWithSolar,
          paybackYears: currentPayback,
          netAdditionalCost: 0,
          totalAdditionalRebates: 0,
          totalNewRebates: getCurrentTotalRebates(), // Include rebates for current system
          isZeroBill: currentMonthlyBillWithSolar <= 0,
        });
        return;
      }

      setCalculating(true);
      try {
        // Call unified API endpoint
        const response = await fetch('/api/calculate-unified-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemSizeKw: systemSize,
            batterySizeKwh: batterySize,
            postcode: quote.postcode || quote.suburb,
            region: 'WA',
            includeInstallation: true,
            dailyConsumptionKwh: quote.dailyConsumption || quote.dailyUsage,
            quarterlyBill: quote.quarterlyBill,
            annualConsumption: quote.annualConsumption,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate quote');
        }

        const data = await response.json();
        
        if (data.success && data.quote) {
          const newQuote = data.quote;
          
          // Calculate differences from current quote
          const netAdditionalCost = newQuote.finalPrice - currentPrice;
          const currentRebatesTotal = (quote.federalSolarRebate || 0) + (quote.federalBatteryRebate || 0) + (quote.stateBatteryRebate || 0);
          const additionalRebates = newQuote.rebates.total - currentRebatesTotal;
          
          setCalculatedScenario({
            systemSize: newQuote.systemSizeKw,
            batterySize: newQuote.batterySizeKwh,
            newTotalPrice: newQuote.finalPrice,
            netAdditionalCost,
            totalAdditionalRebates: additionalRebates,
            totalNewRebates: newQuote.rebates.total, // Total rebates for this configuration
            annualSavings: newQuote.savings?.annualSavings || 0,
            monthlyBill: originalMonthlyBill - ((newQuote.savings?.annualSavings || 0) / 12),
            paybackYears: newQuote.savings?.paybackYears || 0,
            year25Savings: newQuote.savings?.year25Savings || 0,
            isZeroBill: (originalMonthlyBill - ((newQuote.savings?.annualSavings || 0) / 12)) <= 0,
            // Additional details from API
            rebates: newQuote.rebates,
            costs: newQuote.costs,
            selectedPanel: newQuote.selectedPanel,
            selectedInverter: newQuote.selectedInverter,
            selectedBattery: newQuote.selectedBattery,
          });
        }
      } catch (error) {
        console.error('Error calculating scenario:', error);
        // Fallback to showing current values
        setCalculatedScenario({
          systemSize: currentSystemSize,
          batterySize: currentBatterySize,
          newTotalPrice: currentPrice,
          annualSavings: currentAnnualSavings,
          monthlyBill: currentMonthlyBillWithSolar,
          paybackYears: currentPayback,
          netAdditionalCost: 0,
          totalAdditionalRebates: 0,
          totalNewRebates: getCurrentTotalRebates(), // Include rebates even on error
          isZeroBill: currentMonthlyBillWithSolar <= 0,
        });
      } finally {
        setCalculating(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(() => {
      calculateScenario();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [systemSize, batterySize]); // Simplified dependencies to prevent infinite loops

  const scenario = calculatedScenario || {
    systemSize: currentSystemSize,
    batterySize: currentBatterySize,
    newTotalPrice: currentPrice,
    annualSavings: currentAnnualSavings,
    monthlyBill: currentMonthlyBillWithSolar,
    paybackYears: currentPayback,
    netAdditionalCost: 0,
    totalAdditionalRebates: 0,
    totalNewRebates: getCurrentTotalRebates(),
    isZeroBill: currentMonthlyBillWithSolar <= 0,
  };
  
  const hasChanges = systemSize !== currentSystemSize || batterySize !== currentBatterySize;

  // Add error state
  const [error, setError] = useState<string | null>(null);

  // System size slider config - Dynamic based on current system
  const minSystemSize = Math.max(3, currentSystemSize - 5);
  // For commercial systems (>20kW), allow much larger range
  const maxSystemSize = currentSystemSize <= 15 
    ? currentSystemSize + 10  // Residential: up to +10kW
    : currentSystemSize <= 30
    ? currentSystemSize + 20  // Small commercial: up to +20kW
    : currentSystemSize + 50; // Large commercial: up to +50kW
  const systemSizeStep = currentSystemSize > 20 ? 1.0 : 0.5; // Larger steps for commercial

  // Battery size slider config - Dynamic based on current battery and system size
  const minBatterySize = 0;
  // Scale max battery based on system size and current battery
  const maxBatterySize = Math.max(
    30,  // Minimum max of 30 kWh
    currentBatterySize + 20,  // At least 20 kWh more than current
    Math.ceil(systemSize * 1400 / 365 * 0.8 / 5) * 5  // Or 80% of daily production, rounded to 5
  );
  const batterySizeStep = maxBatterySize > 50 ? 5 : 2.5; // Larger steps for big batteries

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Interactive Calculator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Customize Your System
          </h2>
          <p className="text-xl text-gray-600">
            Adjust the sliders to explore different scenarios and find your perfect solution
          </p>
        </div>

        {/* Sliders */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* System Size Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Solar System Size</h3>
                  <p className="text-sm text-gray-600">Adjust panel capacity</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900" suppressHydrationWarning>
                  {formatNumber(systemSize, 1)} kW
                </p>
                {hasChanges && systemSize !== currentSystemSize && (
                  <p className="text-sm text-blue-600" suppressHydrationWarning>
                    {systemSize > currentSystemSize ? '+' : ''}{formatNumber(systemSize - currentSystemSize, 1)} kW
                  </p>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minSystemSize}
                max={maxSystemSize}
                step={systemSizeStep}
                value={systemSize}
                onChange={(e) => setSystemSize(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-yellow-200 to-orange-300 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((systemSize - minSystemSize) / (maxSystemSize - minSystemSize)) * 100}%, #e5e7eb ${((systemSize - minSystemSize) / (maxSystemSize - minSystemSize)) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{formatNumber(minSystemSize, 1)} kW</span>
              <span className="text-blue-600 font-semibold">Current: {formatNumber(currentSystemSize, 1)} kW</span>
              <span>{formatNumber(maxSystemSize, 1)} kW</span>
            </div>
          </div>

          {/* Battery Size Slider */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Battery className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Battery Storage</h3>
                  <p className="text-sm text-gray-600">Store excess solar</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900" suppressHydrationWarning>
                  {formatNumber(batterySize, 1)} kWh
                </p>
                {hasChanges && batterySize !== currentBatterySize && (
                  <p className="text-sm text-green-600" suppressHydrationWarning>
                    {batterySize > currentBatterySize ? '+' : ''}{formatNumber(batterySize - currentBatterySize, 1)} kWh
                  </p>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="range"
                min={minBatterySize}
                max={maxBatterySize}
                step={batterySizeStep}
                value={batterySize}
                onChange={(e) => setBatterySize(parseFloat(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-green-200 to-emerald-300 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((batterySize - minBatterySize) / (maxBatterySize - minBatterySize)) * 100}%, #e5e7eb ${((batterySize - minBatterySize) / (maxBatterySize - minBatterySize)) * 100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{formatNumber(minBatterySize, 1)} kWh</span>
              <span className="text-green-600 font-semibold">Current: {formatNumber(currentBatterySize, 1)} kWh</span>
              <span>{formatNumber(maxBatterySize, 1)} kWh</span>
            </div>
            {calculating && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculating...</span>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {hasChanges && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setSystemSize(currentSystemSize);
                  setBatterySize(currentBatterySize);
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Reset to Current System
              </button>
            </div>
          )}
        </div>

        {/* Results Grid - 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Bill */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">Monthly Bill</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              ${formatCurrency(scenario.monthlyBill)}
            </p>
            {hasChanges && (
              <p className="text-sm text-blue-100" suppressHydrationWarning>
                {scenario.monthlyBill < currentMonthlyBillWithSolar ? '↓' : '↑'} ${formatCurrency(Math.abs(currentMonthlyBillWithSolar - scenario.monthlyBill))}/mo
              </p>
            )}
            {scenario.isZeroBill && (
              <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 text-xs font-semibold">
                🎉 Zero Bill Achieved!
              </div>
            )}
          </div>

          {/* Annual Savings */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-semibold">Annual Savings</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              ${formatCurrency(scenario.annualSavings)}
            </p>
            {hasChanges && (
              <p className="text-sm text-emerald-100" suppressHydrationWarning>
                {scenario.annualSavings > currentAnnualSavings ? '+' : ''} ${formatCurrency(Math.abs(scenario.annualSavings - currentAnnualSavings))}/yr
              </p>
            )}
          </div>

          {/* Energy Independence */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5" />
              <h3 className="font-semibold">Independence</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              {calculating ? '...' : `${Math.round((scenario.annualSavings / (originalMonthlyBill * 12)) * 100)}%`}
            </p>
            <p className="text-sm text-green-100" suppressHydrationWarning>
              Energy from solar
            </p>
            {scenario.isZeroBill && (
              <div className="mt-2 bg-white/20 rounded-lg px-3 py-1 text-xs font-semibold">
                ⚡ Fully Independent!
              </div>
            )}
          </div>

          {/* Total Investment */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5" />
              <h3 className="font-semibold">Investment</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              ${formatCurrency(scenario.newTotalPrice)}
            </p>
            <p className="text-xs text-purple-100 mb-1">After rebates</p>
            {hasChanges && scenario.netAdditionalCost !== 0 && (
              <p className="text-sm text-purple-100" suppressHydrationWarning>
                {scenario.netAdditionalCost > 0 ? '+' : ''} ${formatCurrency(scenario.netAdditionalCost)}
              </p>
            )}
          </div>

          {/* Total Rebates */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold">Total Rebates</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              ${formatCurrency(scenario.totalNewRebates)}
            </p>
            {hasChanges && scenario.totalAdditionalRebates !== 0 && (
              <p className="text-sm text-pink-100" suppressHydrationWarning>
                {scenario.totalAdditionalRebates > 0 ? '+' : ''}${formatCurrency(scenario.totalAdditionalRebates)} vs current
              </p>
            )}
          </div>

          {/* Payback Period */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5" />
              <h3 className="font-semibold">Payback</h3>
            </div>
            <p className="text-4xl font-bold mb-2" suppressHydrationWarning>
              {formatNumber(scenario.paybackYears, 1)} yrs
            </p>
            {hasChanges && (
              <p className="text-sm text-orange-100" suppressHydrationWarning>
                {scenario.paybackYears < currentPayback ? '↓' : '↑'} {formatNumber(Math.abs(currentPayback - scenario.paybackYears), 1)} yrs
              </p>
            )}
          </div>
        </div>

        {/* Zero Bill Target */}
        {!scenario.isZeroBill && scenario.zeroBillSystemSize > currentSystemSize && scenario.zeroBillSystemSize <= maxSystemSize && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  🎯 Zero Bill Target: {formatNumber(scenario.zeroBillSystemSize, 1)} kW
                </h3>
                <p className="text-gray-700" suppressHydrationWarning>
                  You're {formatNumber(scenario.zeroBillSystemSize - systemSize, 1)} kW away from $0 bills! 
                  Additional cost: ${formatCurrency((scenario.zeroBillSystemSize - systemSize) * 1200 - (scenario.zeroBillSystemSize - systemSize) * 550)}
                </p>
              </div>
              <button
                onClick={() => setSystemSize(Math.min(maxSystemSize, scenario.zeroBillSystemSize))}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
              >
                Get Zero Bill
              </button>
            </div>
          </div>
        )}

        {/* Detailed Comparison */}
        {hasChanges && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Detailed Comparison</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Metric</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
                    <th className="text-right py-3 px-4 font-semibold text-blue-700">Your Custom</th>
                    <th className="text-right py-3 px-4 font-semibold text-green-700">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">System Size</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>{formatNumber(currentSystemSize, 1)} kW</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-semibold" suppressHydrationWarning>{formatNumber(systemSize, 1)} kW</td>
                    <td className="py-3 px-4 text-right text-green-700 font-semibold" suppressHydrationWarning>
                      {systemSize > currentSystemSize ? '+' : ''}{formatNumber(systemSize - currentSystemSize, 1)} kW
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">Battery Storage</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>{formatNumber(currentBatterySize, 1)} kWh</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-semibold" suppressHydrationWarning>{formatNumber(batterySize, 1)} kWh</td>
                    <td className="py-3 px-4 text-right text-green-700 font-semibold" suppressHydrationWarning>
                      {batterySize > currentBatterySize ? '+' : ''}{formatNumber(batterySize - currentBatterySize, 1)} kWh
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 bg-blue-50">
                    <td className="py-3 px-4 text-gray-700 font-semibold">Total Investment</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>${formatCurrency(currentPrice)}</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-bold" suppressHydrationWarning>${formatCurrency(scenario.newTotalPrice)}</td>
                    <td className="py-3 px-4 text-right font-bold" suppressHydrationWarning>
                      <span className={scenario.netAdditionalCost > 0 ? 'text-red-700' : 'text-green-700'}>
                        {scenario.netAdditionalCost > 0 ? '+' : ''}${formatCurrency(scenario.netAdditionalCost)}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">Monthly Bill</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>${formatCurrency(currentMonthlyBillWithSolar)}</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-semibold" suppressHydrationWarning>${formatCurrency(scenario.monthlyBill)}</td>
                    <td className="py-3 px-4 text-right text-green-700 font-semibold" suppressHydrationWarning>
                      {scenario.monthlyBill < currentMonthlyBillWithSolar ? '-' : '+'}${formatCurrency(Math.abs(currentMonthlyBillWithSolar - scenario.monthlyBill))}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">Annual Savings</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>${formatCurrency(currentAnnualSavings)}</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-semibold" suppressHydrationWarning>${formatCurrency(scenario.annualSavings)}</td>
                    <td className="py-3 px-4 text-right text-green-700 font-semibold" suppressHydrationWarning>
                      +${formatCurrency(scenario.annualSavings - currentAnnualSavings)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-700">Payback Period</td>
                    <td className="py-3 px-4 text-right text-gray-900" suppressHydrationWarning>{formatNumber(currentPayback, 1)} yrs</td>
                    <td className="py-3 px-4 text-right text-blue-900 font-semibold" suppressHydrationWarning>{formatNumber(scenario.paybackYears, 1)} yrs</td>
                    <td className="py-3 px-4 text-right font-semibold" suppressHydrationWarning>
                      <span className={scenario.paybackYears < currentPayback ? 'text-green-700' : 'text-red-700'}>
                        {scenario.paybackYears < currentPayback ? '' : '+'}{formatNumber(scenario.paybackYears - currentPayback, 1)} yrs
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-center">
              <button
                onClick={() => {
                  // TODO: Save scenario or update quote
                  alert('This configuration would be sent to your sales representative for a formal quote update.');
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg"
              >
                Request This Configuration
              </button>
              <button
                onClick={() => {
                  setSystemSize(currentSystemSize);
                  setBatterySize(currentBatterySize);
                }}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Cancel Changes
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #3b82f6;
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 3px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}
