'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp, ArrowDownCircle, ArrowUpCircle, Battery, Info } from 'lucide-react';

interface SelfConsumptionDisplayProps {
  selfConsumptionPercent: number;
  selfSufficiencyPercent: number;
  selfConsumedKwh: number;
  exportedKwh: number;
  gridImportKwh: number;
  hasBattery?: boolean;
  batteryChargedKwh?: number;
  batteryDischargedKwh?: number;
  batteryUsagePercent?: number;
}

export function SelfConsumptionDisplay({
  selfConsumptionPercent,
  selfSufficiencyPercent,
  selfConsumedKwh,
  exportedKwh,
  gridImportKwh,
  hasBattery = false,
  batteryChargedKwh = 0,
  batteryDischargedKwh = 0,
  batteryUsagePercent = 0,
}: SelfConsumptionDisplayProps) {
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          Energy Independence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics - Matching Pylon's Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Calculated self-consumption</span>
            <span className="text-lg font-bold text-green-600">{selfConsumptionPercent}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <span className="text-sm text-gray-600">Self-sufficiency</span>
            <span className="text-lg font-bold text-blue-600">{selfSufficiencyPercent}%</span>
          </div>
        </div>

        {/* What These Mean */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Self-consumption ({selfConsumptionPercent}%):</strong> How much of your solar you use yourself</p>
              <p><strong>Self-sufficiency ({selfSufficiencyPercent}%):</strong> How much of your needs are met by solar</p>
            </div>
          </div>
        </div>

        {/* Energy Flow Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Daily energy flow:</p>
          
          {/* Self-Consumed */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Self-consumed</span>
            </span>
            <span className="font-medium">{selfConsumedKwh} kWh</span>
          </div>

          {/* Exported */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ArrowUpCircle className="w-3 h-3 text-blue-500" />
              <span>Exported to grid</span>
            </span>
            <span className="font-medium">{exportedKwh} kWh</span>
          </div>

          {/* Grid Import */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ArrowDownCircle className="w-3 h-3 text-orange-500" />
              <span>Grid import</span>
            </span>
            <span className="font-medium">{gridImportKwh} kWh</span>
          </div>

          {/* Battery Metrics (if applicable) */}
          {hasBattery && batteryChargedKwh > 0 && (
            <>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium text-gray-600 mb-2">Battery usage:</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Battery className="w-3 h-3 text-purple-500" />
                  <span>Charged</span>
                </span>
                <span className="font-medium">{batteryChargedKwh} kWh</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Battery className="w-3 h-3 text-purple-500" />
                  <span>Discharged</span>
                </span>
                <span className="font-medium">{batteryDischargedKwh} kWh</span>
              </div>
              {batteryUsagePercent > 0 && (
                <div className="p-2 bg-purple-50 rounded text-xs text-purple-700">
                  Battery utilization: {batteryUsagePercent}% of capacity
                </div>
              )}
            </>
          )}
        </div>

        {/* Visual Bar */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Energy breakdown:</p>
          <div className="h-8 flex rounded-lg overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${selfConsumptionPercent}%` }}
              title={`Self-consumed: ${selfConsumptionPercent}%`}
            >
              {selfConsumptionPercent > 15 && `${selfConsumptionPercent}%`}
            </div>
            <div
              className="bg-blue-400 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${100 - selfConsumptionPercent}%` }}
              title={`Exported: ${100 - selfConsumptionPercent}%`}
            >
              {(100 - selfConsumptionPercent) > 15 && `${100 - selfConsumptionPercent}%`}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded"></div>
              Used
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded"></div>
              Exported
            </span>
          </div>
        </div>

        {/* Insights */}
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 font-medium">💡 Insights:</p>
          <ul className="text-xs text-yellow-700 mt-2 space-y-1">
            {selfSufficiencyPercent >= 80 && (
              <li>• Excellent! You're highly energy independent</li>
            )}
            {selfSufficiencyPercent >= 60 && selfSufficiencyPercent < 80 && !hasBattery && (
              <li>• Good! Add a battery to reach 80%+ independence</li>
            )}
            {selfSufficiencyPercent < 60 && !hasBattery && (
              <li>• A battery would significantly boost your independence</li>
            )}
            {exportedKwh > selfConsumedKwh && !hasBattery && (
              <li>• You're exporting more than you use - battery recommended!</li>
            )}
            {hasBattery && selfSufficiencyPercent >= 80 && (
              <li>• Your battery is maximizing solar value!</li>
            )}
            {selfConsumptionPercent < 40 && !hasBattery && (
              <li>• Low self-consumption - consider battery storage</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
