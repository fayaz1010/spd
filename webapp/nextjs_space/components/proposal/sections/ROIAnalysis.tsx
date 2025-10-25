'use client';

import { TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';

interface ROIAnalysisProps {
  savingsData: any;
}

export default function ROIAnalysis({ savingsData }: ROIAnalysisProps) {
  const npv = savingsData.npv || 0;
  const roi = savingsData.roi || 0;
  const irr = savingsData.irr || 0;
  const paybackYears = savingsData.paybackYears || 0;

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Investment Performance
          </h2>
          <p className="text-xl text-gray-600">
            Financial metrics that matter
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* NPV */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-green-100 text-sm mb-1">Net Present Value</p>
                <h3 className="text-5xl font-bold">${npv.toLocaleString()}</h3>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
            <p className="text-green-100 text-sm">
              The total value your investment will generate over 20 years in today's dollars
            </p>
          </div>

          {/* ROI */}
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">Return on Investment</p>
                <h3 className="text-5xl font-bold">{roi}%</h3>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
            <p className="text-blue-100 text-sm">
              For every dollar invested, you'll receive ${(roi / 100 + 1).toFixed(2)} back over 20 years
            </p>
          </div>

          {/* IRR */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-purple-100 text-sm mb-1">Internal Rate of Return</p>
                <h3 className="text-5xl font-bold">{irr}%</h3>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
            </div>
            <p className="text-purple-100 text-sm">
              Your annual return rate - significantly higher than most traditional investments
            </p>
          </div>

          {/* Payback Period */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-orange-100 text-sm mb-1">Payback Period</p>
                <h3 className="text-5xl font-bold">{paybackYears.toFixed(1)} yrs</h3>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
            <p className="text-orange-100 text-sm">
              Time until your savings equal your initial investment - then it's all profit!
            </p>
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Compare to Other Investments
          </h3>
          
          <div className="space-y-4">
            {/* Solar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">☀️</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Your Solar Investment</p>
                  <p className="text-sm text-gray-600">Tax-free returns</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{irr}%</p>
            </div>

            {/* Stock Market */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📈</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Stock Market Average</p>
                  <p className="text-sm text-gray-600">Historical average</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-600">~10%</p>
            </div>

            {/* Term Deposit */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">🏦</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Term Deposit</p>
                  <p className="text-sm text-gray-600">Current rates</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-600">~4%</p>
            </div>

            {/* Savings Account */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">💰</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Savings Account</p>
                  <p className="text-sm text-gray-600">Typical interest</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-600">~2%</p>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Why solar wins:</span> Unlike traditional investments, solar provides tax-free returns, 
              protects against rising electricity prices, and increases your property value. Plus, you're helping the environment!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
