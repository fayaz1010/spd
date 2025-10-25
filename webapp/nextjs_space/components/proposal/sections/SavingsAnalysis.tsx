'use client';

import { TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface SavingsAnalysisProps {
  savingsData: any;
  monthlyBill: number;
}

export default function SavingsAnalysis({ savingsData, monthlyBill }: SavingsAnalysisProps) {
  const currentBill = savingsData.currentMonthlyBill || monthlyBill;
  const newBill = savingsData.newMonthlyBill || 0;
  const monthlySavings = savingsData.monthlySavings || 0;
  const annualSavings = savingsData.annualSavings || 0;
  const year20Savings = savingsData.year20Savings || 0;

  const isCredit = newBill < 0;

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Electricity Bill Savings
          </h2>
          <p className="text-xl text-gray-600">
            See how much you'll save every month
          </p>
        </div>

        {/* Bill Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Current Bill */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <TrendingUp className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-gray-600 text-sm mb-1">Current Monthly Bill</p>
            <p className="text-4xl font-bold text-red-600">
              ${currentBill}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="text-6xl text-green-600">→</div>
          </div>

          {/* New Bill */}
          <div className={`${isCredit ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border-2 rounded-2xl p-6 text-center`}>
            <TrendingDown className={`w-12 h-12 ${isCredit ? 'text-green-600' : 'text-blue-600'} mx-auto mb-3`} />
            <p className="text-gray-600 text-sm mb-1">
              {isCredit ? 'Monthly Credit' : 'New Monthly Bill'}
            </p>
            <p className={`text-4xl font-bold ${isCredit ? 'text-green-600' : 'text-blue-600'}`}>
              {isCredit ? `+$${Math.abs(newBill)}` : `$${newBill}`}
            </p>
          </div>
        </div>

        {/* Monthly Savings Highlight */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-8 text-white text-center mb-12">
          <p className="text-green-100 text-lg mb-2">You Save Every Month</p>
          <p className="text-6xl font-bold mb-2">${monthlySavings}</p>
          <p className="text-green-100">
            That's ${annualSavings.toLocaleString()} per year!
          </p>
        </div>

        {/* Savings Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Long-Term Savings Projection
          </h3>

          <div className="space-y-6">
            {/* Year 1 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Year 1</p>
                <p className="text-sm text-gray-600">First year savings</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${annualSavings.toLocaleString()}
              </p>
            </div>

            {/* Year 5 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Year 5</p>
                <p className="text-sm text-gray-600">Cumulative savings</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${(annualSavings * 5.13).toLocaleString()} {/* Account for 2.5% escalation */}
              </p>
            </div>

            {/* Year 10 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-200 to-green-300 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Year 10</p>
                <p className="text-sm text-gray-600">Cumulative savings</p>
              </div>
              <p className="text-2xl font-bold text-green-700">
                ${(annualSavings * 11.2).toLocaleString()}
              </p>
            </div>

            {/* Year 20 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-300 to-green-400 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Year 20</p>
                <p className="text-sm text-gray-600">Total lifetime savings</p>
              </div>
              <p className="text-3xl font-bold text-green-800">
                ${year20Savings.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Projection basis:</span> Calculations assume 2.5% annual electricity price increase, 
              based on historical trends. Actual savings may vary based on usage patterns and electricity rates.
            </p>
          </div>
        </div>

        {/* What You Can Do With Savings */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What Could You Do With ${monthlySavings}/month?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🏖️</div>
              <p className="font-semibold text-gray-900">Annual Holiday</p>
              <p className="text-sm text-gray-600">Save for a family vacation</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎓</div>
              <p className="font-semibold text-gray-900">Education Fund</p>
              <p className="text-sm text-gray-600">Invest in your children's future</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏠</div>
              <p className="font-semibold text-gray-900">Home Improvements</p>
              <p className="text-sm text-gray-600">Upgrade your living space</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
