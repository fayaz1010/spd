'use client';

import { Battery, Zap, Sun, ChevronDown, ChevronUp, Shield, Award } from 'lucide-react';
import { useState } from 'react';

interface SystemSpecificationsProps {
  quote: any;
}

export default function SystemSpecifications({ quote }: SystemSpecificationsProps) {
  const [expandedPanel, setExpandedPanel] = useState(false);
  const [expandedBattery, setExpandedBattery] = useState(false);
  const [expandedInverter, setExpandedInverter] = useState(false);

  const hasBattery = quote.batterySizeKwh > 0;

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Your Solar System
          </h2>
          <p className="text-lg text-gray-600">
            Premium equipment designed for maximum performance
          </p>
        </div>

        {/* Complete System Package - Summary */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Complete System Package</h3>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-sm text-gray-600">Solar Panels</p>
              <p className="text-xl font-bold text-gray-900">{quote.panelCount} × {quote.panelBrandWattage}W</p>
            </div>
            {hasBattery && (
              <>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Battery Storage</p>
                  <p className="text-xl font-bold text-gray-900">{quote.batterySizeKwh}kWh</p>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total System</p>
              <p className="text-xl font-bold text-gray-900">{quote.systemSizeKw}kW Solar{hasBattery && ` + ${quote.batterySizeKwh}kWh Battery`}</p>
            </div>
          </div>
        </div>

        {/* Solar Panels */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <Sun className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Solar Panels</h3>
                    <p className="text-sm text-gray-600">{quote.panelBrandName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedPanel(!expandedPanel)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  {expandedPanel ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{quote.panelCount}</p>
                  <p className="text-xs text-gray-600">Panels</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{quote.panelBrandWattage}W</p>
                  <p className="text-xs text-gray-600">Per Panel</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{quote.systemSizeKw}kW</p>
                  <p className="text-xs text-gray-600">Total System</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedPanel && (
                <div className="bg-white/70 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Tier 1 Manufacturer</p>
                      <p className="text-sm text-gray-600">Top-rated global brand</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-gray-900">30-Year Performance Warranty</p>
                      <p className="text-sm text-gray-600">Guaranteed 80% output after 30 years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-gray-900">25-Year Product Warranty</p>
                      <p className="text-sm text-gray-600">Full manufacturer coverage</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Technology:</span> N-Type TOPCon cells with advanced anti-reflective coating for maximum efficiency in all conditions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Battery Storage */}
        {hasBattery && (
          <div className="mb-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Battery className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Battery Storage</h3>
                      <p className="text-sm text-gray-600">{quote.batteryBrandName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedBattery(!expandedBattery)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    {expandedBattery ? (
                      <ChevronUp className="w-6 h-6 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{quote.batterySizeKwh}</p>
                    <p className="text-xs text-gray-600">kWh Capacity</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">LFP</p>
                    <p className="text-xs text-gray-600">Chemistry</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">10yr</p>
                    <p className="text-xs text-gray-600">Warranty</p>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedBattery && (
                  <div className="bg-white/70 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">10-Year Warranty</p>
                        <p className="text-sm text-gray-600">Full coverage on battery system</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Battery className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">LFP Technology</p>
                        <p className="text-sm text-gray-600">Safest battery chemistry available</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">VPP Ready</p>
                        <p className="text-sm text-gray-600">Eligible for Synergy VPP program</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Benefits:</span> Store excess solar energy for use at night, backup power during outages, and participate in virtual power plant programs for additional income.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inverter */}
        <div className="mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {hasBattery ? 'Hybrid Inverter' : 'Solar Inverter'}
                    </h3>
                    <p className="text-sm text-gray-600">{quote.inverterBrandName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedInverter(!expandedInverter)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  {expandedInverter ? (
                    <ChevronUp className="w-6 h-6 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-600" />
                  )}
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">{quote.inverterBrandCapacity || quote.systemSizeKw}kW</p>
                  <p className="text-sm text-gray-600">Capacity</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-600">Efficiency</p>
                </div>
                <div className="bg-white/70 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-gray-900">10yr</p>
                  <p className="text-sm text-gray-600">Warranty</p>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedInverter && (
                <div className="bg-white/70 rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">10-Year Warranty</p>
                      <p className="text-sm text-gray-600">Manufacturer warranty included</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Smart Monitoring</p>
                      <p className="text-sm text-gray-600">Real-time system performance tracking</p>
                    </div>
                  </div>
                  {hasBattery && (
                    <div className="flex items-center gap-3">
                      <Battery className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Battery Management</p>
                        <p className="text-sm text-gray-600">Intelligent charge/discharge control</p>
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Function:</span> Converts DC power from solar panels to AC power for your home. 
                      {hasBattery && ' Manages battery charging and provides backup power capability.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Complete System Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">Solar Panels</p>
              <p className="text-xl font-semibold">{quote.panelCount} × {quote.panelBrandWattage}W</p>
            </div>
            {hasBattery && (
              <div>
                <p className="text-gray-400 text-sm mb-1">Battery Storage</p>
                <p className="text-xl font-semibold">{quote.batterySizeKwh}kWh</p>
              </div>
            )}
            <div>
              <p className="text-gray-400 text-sm mb-1">Total System</p>
              <p className="text-xl font-semibold">{quote.systemSizeKw}kW Solar{hasBattery && ` + ${quote.batterySizeKwh}kWh Battery`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
