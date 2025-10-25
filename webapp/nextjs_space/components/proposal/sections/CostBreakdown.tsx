'use client';

import { DollarSign, Minus, Plus, Check } from 'lucide-react';

interface CostBreakdownProps {
  quote: any;
}

export default function CostBreakdown({ quote }: CostBreakdownProps) {
  const panelCost = quote.panelSystemCost || 0;
  const batteryCost = quote.batteryCost || 0;
  const inverterCost = quote.inverterCost || 0;
  const installationCost = quote.installationCost || 0;
  const subtotal = quote.totalCostBeforeRebates || 0;

  const federalSolarRebate = quote.federalSolarRebate || 0;
  const federalBatteryRebate = quote.federalBatteryRebate || 0;
  const stateBatteryRebate = quote.stateBatteryRebate || 0;
  const totalRebates = quote.totalRebates || 0;

  const finalPrice = quote.salePrice || quote.totalCostAfterRebates || quote.totalCostIncGst || 0;
  const depositAmount = quote.depositAmount || (finalPrice * 0.30);

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Complete Cost Breakdown
          </h2>
          <p className="text-xl text-gray-600">
            Transparent pricing with all rebates included
          </p>
        </div>

        {/* System Components */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Plus className="w-6 h-6 text-blue-600" />
            System Components
          </h3>

          <div className="space-y-4">
            {/* Solar Panels */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Solar Panels</p>
                <p className="text-sm text-gray-600">
                  {quote.panelCount} × {quote.panelBrandWattage}W {quote.panelBrandName}
                </p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${panelCost.toLocaleString()}
              </p>
            </div>

            {/* Battery */}
            {batteryCost > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Battery Storage</p>
                  <p className="text-sm text-gray-600">
                    {quote.batterySizeKwh}kWh {quote.batteryBrandName}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${batteryCost.toLocaleString()}
                </p>
              </div>
            )}

            {/* Inverter */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">
                  {batteryCost > 0 ? 'Hybrid Inverter' : 'Solar Inverter'}
                </p>
                <p className="text-sm text-gray-600">{quote.inverterBrandName}</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${inverterCost.toLocaleString()}
              </p>
            </div>

            {/* Installation */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900">Professional Installation</p>
                <p className="text-sm text-gray-600">
                  Labor, mounting, electrical work, permits
                </p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${installationCost.toLocaleString()}
              </p>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <p className="font-bold text-gray-900 text-lg">Subtotal</p>
              <p className="text-2xl font-bold text-gray-900">
                ${subtotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Rebates & Incentives */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Minus className="w-6 h-6 text-green-600" />
            Rebates & Incentives
          </h3>

          <div className="space-y-4">
            {/* Federal Solar Rebate */}
            {federalSolarRebate > 0 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Federal STC Rebate (Solar)
                  </p>
                  <p className="text-sm text-gray-600">
                    Small-scale Technology Certificates
                  </p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  -${federalSolarRebate.toLocaleString()}
                </p>
              </div>
            )}

            {/* Federal Battery Rebate */}
            {federalBatteryRebate > 0 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    Federal STC Rebate (Battery)
                  </p>
                  <p className="text-sm text-gray-600">
                    Battery storage certificates
                  </p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  -${federalBatteryRebate.toLocaleString()}
                </p>
              </div>
            )}

            {/* State Battery Rebate */}
            {stateBatteryRebate > 0 && (
              <div className="flex items-center justify-between p-4 bg-white rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    WA State Battery Rebate
                  </p>
                  <p className="text-sm text-gray-600">
                    Western Australian Government incentive
                  </p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  -${stateBatteryRebate.toLocaleString()}
                </p>
              </div>
            )}

            {/* Total Rebates */}
            <div className="flex items-center justify-between p-4 bg-green-100 border-2 border-green-300 rounded-xl">
              <p className="font-bold text-gray-900 text-lg">Total Rebates</p>
              <p className="text-2xl font-bold text-green-600">
                -${totalRebates.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Final Price */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-2xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-lg mb-1">Your Final Investment</p>
              <h3 className="text-5xl font-bold" suppressHydrationWarning>
                ${finalPrice > 0 ? finalPrice.toLocaleString() : '0'}
              </h3>
              <p className="text-blue-100 text-sm mt-2">Including GST, all rebates applied</p>
            </div>
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Payment Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-sm mb-1">30% Deposit</p>
              <p className="text-2xl font-bold" suppressHydrationWarning>${depositAmount > 0 ? depositAmount.toLocaleString() : '0'}</p>
              <p className="text-blue-100 text-xs mt-1">To commence installation</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-blue-100 text-sm mb-1">Balance</p>
              <p className="text-2xl font-bold" suppressHydrationWarning>${finalPrice > 0 ? (finalPrice - depositAmount).toLocaleString() : '0'}</p>
              <p className="text-blue-100 text-xs mt-1">On completion</p>
            </div>
          </div>
        </div>

        {/* Financing Option */}
        {batteryCost > 0 && (
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  0% Interest Loan Available
                </h4>
                <p className="text-gray-700 mb-3">
                  Eligible for WA Government 0% interest loan up to $10,000 for battery systems. 
                  Repay over 3-10 years with no interest charges.
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Requirements:</span> Household income under $210,000, 
                  property owner, VPP connection required.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
