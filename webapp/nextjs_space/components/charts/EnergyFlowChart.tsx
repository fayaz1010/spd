'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, ArrowDownCircle, ArrowUpCircle, Battery, Home, Sun } from 'lucide-react';

interface EnergyFlowChartProps {
  dailyProduction: number;      // kWh
  dailyConsumption: number;     // kWh
  selfConsumedKwh: number;      // kWh
  exportedKwh: number;          // kWh
  gridImportKwh: number;        // kWh
  hasBattery: boolean;
  batteryChargedKwh?: number;   // kWh
  batteryDischargedKwh?: number; // kWh
}

export function EnergyFlowChart({
  dailyProduction,
  dailyConsumption,
  selfConsumedKwh,
  exportedKwh,
  gridImportKwh,
  hasBattery,
  batteryChargedKwh = 0,
  batteryDischargedKwh = 0,
}: EnergyFlowChartProps) {
  // Calculate percentages
  const selfConsumptionPercent = (selfConsumedKwh / dailyProduction) * 100;
  const exportPercent = (exportedKwh / dailyProduction) * 100;
  const gridImportPercent = (gridImportKwh / dailyConsumption) * 100;
  const solarCoveragePercent = (selfConsumedKwh / dailyConsumption) * 100;

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-600" />
          Daily Energy Flow
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visual Flow Diagram */}
        <div className="relative bg-white rounded-xl p-6 border-2 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Solar Production */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-full shadow-lg">
                  <Sun className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Solar Production</p>
                <p className="text-3xl font-bold text-yellow-600">{dailyProduction.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kWh/day</p>
              </div>
            </div>

            {/* Battery (if applicable) */}
            {hasBattery && (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-purple-400 to-purple-600 p-6 rounded-full shadow-lg">
                    <Battery className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Battery Storage</p>
                  <div className="flex items-center gap-2 justify-center mt-1">
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">↓{batteryChargedKwh.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Charged</p>
                    </div>
                    <div className="text-gray-400">/</div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">↑{batteryDischargedKwh.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">Used</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Home Consumption */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 p-6 rounded-full shadow-lg">
                  <Home className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Home Consumption</p>
                <p className="text-3xl font-bold text-blue-600">{dailyConsumption.toFixed(1)}</p>
                <p className="text-xs text-gray-500">kWh/day</p>
              </div>
            </div>
          </div>

          {/* Flow Arrows */}
          <div className="mt-8 space-y-4">
            {/* Solar to Home (Self-Consumption) */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
              </div>
              <div className="min-w-[140px] text-right">
                <p className="text-sm font-bold text-green-600">{selfConsumedKwh.toFixed(1)} kWh</p>
                <p className="text-xs text-gray-500">Self-consumed ({selfConsumptionPercent.toFixed(0)}%)</p>
              </div>
            </div>

            {/* Solar to Grid (Export) */}
            {exportedKwh > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <div className="min-w-[140px] text-right">
                  <p className="text-sm font-bold text-blue-600 flex items-center justify-end gap-1">
                    <ArrowUpCircle className="w-4 h-4" />
                    {exportedKwh.toFixed(1)} kWh
                  </p>
                  <p className="text-xs text-gray-500">Exported ({exportPercent.toFixed(0)}%)</p>
                </div>
              </div>
            )}

            {/* Grid to Home (Import) */}
            {gridImportKwh > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gradient-to-r from-orange-400 to-blue-600 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <div className="min-w-[140px] text-right">
                  <p className="text-sm font-bold text-orange-600 flex items-center justify-end gap-1">
                    <ArrowDownCircle className="w-4 h-4" />
                    {gridImportKwh.toFixed(1)} kWh
                  </p>
                  <p className="text-xs text-gray-500">Grid import ({gridImportPercent.toFixed(0)}%)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Energy Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-xs font-medium text-green-700">Solar Coverage</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{solarCoveragePercent.toFixed(0)}%</p>
            <p className="text-xs text-green-600 mt-1">of your needs met by solar</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <p className="text-xs font-medium text-blue-700">Grid Dependency</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{gridImportPercent.toFixed(0)}%</p>
            <p className="text-xs text-blue-600 mt-1">still from the grid</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Energy Breakdown</h4>
          
          {/* Production */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Solar Production</span>
              <span className="font-medium">{dailyProduction.toFixed(1)} kWh</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* Usage */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Home Consumption</span>
              <span className="font-medium">{dailyConsumption.toFixed(1)} kWh</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600" 
                style={{ width: `${solarCoveragePercent}%` }}
                title={`Solar: ${selfConsumedKwh.toFixed(1)} kWh`}
              ></div>
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600" 
                style={{ width: `${gridImportPercent}%` }}
                title={`Grid: ${gridImportKwh.toFixed(1)} kWh`}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>🟢 Solar: {selfConsumedKwh.toFixed(1)} kWh</span>
              <span>🟠 Grid: {gridImportKwh.toFixed(1)} kWh</span>
            </div>
          </div>

          {/* Export */}
          {exportedKwh > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Exported to Grid</span>
                <span className="font-medium text-blue-600">{exportedKwh.toFixed(1)} kWh</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600" 
                  style={{ width: `${exportPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800 mb-2">💡 Energy Insights:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            {solarCoveragePercent >= 80 && (
              <li>• Excellent! You're highly energy independent</li>
            )}
            {exportedKwh > selfConsumedKwh && !hasBattery && (
              <li>• You're exporting more than you use - a battery would capture this excess energy!</li>
            )}
            {gridImportPercent > 40 && !hasBattery && (
              <li>• A battery system could reduce your grid dependency by storing excess solar</li>
            )}
            {hasBattery && batteryDischargedKwh > 0 && (
              <li>• Your battery is providing {batteryDischargedKwh.toFixed(1)} kWh/day of stored solar energy</li>
            )}
            {solarCoveragePercent < 50 && (
              <li>• Consider a larger system to meet more of your energy needs with solar</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
