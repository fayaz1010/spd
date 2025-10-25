'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  Calendar, 
  Clock,
  Sun,
  Moon,
  Activity
} from 'lucide-react';

interface ConsumptionAnalysisProps {
  analysis: {
    nmi: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    totalConsumption: number;
    averageDaily: number;
    peakDemand: number;
    peakDemandTime?: string;
    peakDemandDay?: string;
    peakUsage?: number;
    shoulderUsage?: number;
    offPeakUsage?: number;
    qualityScore: number;
  };
}

export function ConsumptionAnalysis({ analysis }: ConsumptionAnalysisProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'bg-green-100 text-green-800';
    if (score >= 85) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Consumption Analysis</h3>
            <p className="text-sm text-gray-600">
              Based on actual smart meter data
            </p>
          </div>
          <Badge className={getQualityColor(analysis.qualityScore)}>
            {analysis.qualityScore}% Quality
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">NMI</p>
            <p className="font-medium">{analysis.nmi}</p>
          </div>
          <div>
            <p className="text-gray-600">Data Period</p>
            <p className="font-medium">
              {formatDate(analysis.startDate)} - {formatDate(analysis.endDate)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Total Days</p>
            <p className="font-medium">{analysis.totalDays} days</p>
          </div>
          <div>
            <p className="text-gray-600">Total Consumption</p>
            <p className="font-medium">{analysis.totalConsumption.toFixed(2)} kWh</p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Daily */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Daily</p>
              <p className="text-2xl font-bold">
                {analysis.averageDaily.toFixed(1)}
                <span className="text-sm font-normal text-gray-600 ml-1">kWh</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Peak Demand */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Peak Demand</p>
              <p className="text-2xl font-bold">
                {analysis.peakDemand.toFixed(1)}
                <span className="text-sm font-normal text-gray-600 ml-1">kW</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Annual Estimate */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Estimate</p>
              <p className="text-2xl font-bold">
                {(analysis.averageDaily * 365).toFixed(0)}
                <span className="text-sm font-normal text-gray-600 ml-1">kWh</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Peak Demand Details */}
      {analysis.peakDemandTime && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-600" />
            Peak Demand Details
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Peak Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <p className="font-medium">
                  {new Date(analysis.peakDemandTime).toLocaleTimeString('en-AU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            {analysis.peakDemandDay && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Peak Day</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{analysis.peakDemandDay}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Time-of-Use Breakdown */}
      {(analysis.peakUsage || analysis.shoulderUsage || analysis.offPeakUsage) && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Time-of-Use Breakdown</h4>
          <div className="space-y-4">
            {/* Peak */}
            {analysis.peakUsage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Peak (2pm-8pm weekdays)</span>
                  </div>
                  <span className="text-sm font-bold">
                    {analysis.peakUsage.toFixed(1)} kWh
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${(analysis.peakUsage / analysis.totalConsumption) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((analysis.peakUsage / analysis.totalConsumption) * 100).toFixed(1)}% of total
                </p>
              </div>
            )}

            {/* Shoulder */}
            {analysis.shoulderUsage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Shoulder (7am-2pm, 8pm-10pm)</span>
                  </div>
                  <span className="text-sm font-bold">
                    {analysis.shoulderUsage.toFixed(1)} kWh
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${(analysis.shoulderUsage / analysis.totalConsumption) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((analysis.shoulderUsage / analysis.totalConsumption) * 100).toFixed(1)}% of total
                </p>
              </div>
            )}

            {/* Off-Peak */}
            {analysis.offPeakUsage && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Off-Peak (10pm-7am)</span>
                  </div>
                  <span className="text-sm font-bold">
                    {analysis.offPeakUsage.toFixed(1)} kWh
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(analysis.offPeakUsage / analysis.totalConsumption) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((analysis.offPeakUsage / analysis.totalConsumption) * 100).toFixed(1)}% of total
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
