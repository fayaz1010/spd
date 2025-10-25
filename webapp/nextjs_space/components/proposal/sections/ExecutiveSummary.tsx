'use client';

import { DollarSign, TrendingUp, Calendar, Leaf } from 'lucide-react';
import { formatCurrency, formatNumber, safeNumber } from '@/lib/format-helpers';

interface ExecutiveSummaryProps {
  quote: any;
}

export default function ExecutiveSummary({ quote }: ExecutiveSummaryProps) {
  // Get final price - try multiple fields and ensure it's a valid number
  const finalPrice = safeNumber(
    quote.salePrice || quote.totalCostAfterRebates || quote.totalCostIncGst,
    0
  );
  
  // Get savings data with safe defaults
  const annualSavings = safeNumber(quote.annualSavings, 0);
  const paybackYears = safeNumber(quote.paybackYears, 0);
  const roi = safeNumber(quote.roi, 0);
  const annualProduction = safeNumber(quote.annualProductionKwh, 0);

  // Calculate CO2 savings safely
  const co2Saved = annualProduction > 0 
    ? Math.round((annualProduction * 0.42) / 1000)
    : 0;

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Investment Summary
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know at a glance
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Investment */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-blue-100 hover:border-blue-300 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-600 text-xs font-medium mb-1">Total Investment</p>
            <p className="text-2xl font-bold text-gray-900" suppressHydrationWarning>
              ${formatCurrency(finalPrice)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Including all rebates</p>
          </div>

          {/* Payback Period */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-green-100 hover:border-green-300 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600 text-xs font-medium mb-1">Payback Period</p>
            <p className="text-2xl font-bold text-gray-900" suppressHydrationWarning>
              {formatNumber(paybackYears, 1)} yrs
            </p>
            <p className="text-xs text-gray-500 mt-1">Break-even point</p>
          </div>

          {/* CO2 Saved */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-orange-100 hover:border-orange-300 transition-colors">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
              <Leaf className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-gray-600 text-xs font-medium mb-1">CO₂ Saved Annually</p>
            <p className="text-2xl font-bold text-gray-900" suppressHydrationWarning>
              {co2Saved} tonnes
            </p>
            <p className="text-xs text-gray-500 mt-1">Environmental benefit</p>
          </div>

          {/* ROI */}
          {roi > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4 border border-purple-100 hover:border-purple-300 transition-colors">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-600 text-xs font-medium mb-1">Return on Investment</p>
              <p className="text-2xl font-bold text-gray-900" suppressHydrationWarning>
                {formatNumber(roi, 0)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">Over 20 years</p>
            </div>
          )}
        </div>

        {/* Highlights - Compact Single Row */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between gap-6">
            {/* Annual Savings */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-600 mb-1">Annual Savings</p>
              <p className="text-xl font-bold text-blue-600" suppressHydrationWarning>
                ${formatCurrency(annualSavings)}
              </p>
            </div>

            <div className="h-12 w-px bg-gray-300"></div>

            {/* Annual Production */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-600 mb-1">kWh Generated</p>
              <p className="text-xl font-bold text-green-600" suppressHydrationWarning>
                {formatCurrency(annualProduction)}
              </p>
            </div>

            <div className="h-12 w-px bg-gray-300"></div>

            {/* 20-Year Savings */}
            <div className="flex-1 text-center">
              <p className="text-xs text-gray-600 mb-1">20-Year Savings</p>
              <p className="text-xl font-bold text-purple-600" suppressHydrationWarning>
                ${formatCurrency(safeNumber(quote.year25Savings, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
