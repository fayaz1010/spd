'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, TrendingUp, Info, Download } from 'lucide-react';
import { MonthlyProduction } from '@/lib/production-calculator';

interface MonthlyProductionChartProps {
  monthlyData: MonthlyProduction[];
  systemSizeKw: number;
  annualTotalKwh: number;
}

type ViewMode = 'daily' | 'monthly';

export function MonthlyProductionChart({
  monthlyData,
  systemSizeKw,
  annualTotalKwh,
}: MonthlyProductionChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    const values = monthlyData.map(m => 
      viewMode === 'daily' ? m.dailyAverage : m.monthlyTotal
    );
    return Math.max(...values);
  }, [monthlyData, viewMode]);

  // Get seasonal colors
  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'Summer': return 'from-yellow-400 to-orange-500';
      case 'Autumn': return 'from-orange-400 to-red-500';
      case 'Winter': return 'from-blue-400 to-cyan-500';
      case 'Spring': return 'from-green-400 to-emerald-500';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getSeasonBg = (season: string) => {
    switch (season) {
      case 'Summer': return 'bg-yellow-50';
      case 'Autumn': return 'bg-orange-50';
      case 'Winter': return 'bg-blue-50';
      case 'Spring': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-yellow-500" />
            Monthly Solar Production
          </CardTitle>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'daily'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Daily Avg
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Monthly Total
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-600">
            <span>{Math.round(maxValue)}</span>
            <span>{Math.round(maxValue * 0.75)}</span>
            <span>{Math.round(maxValue * 0.5)}</span>
            <span>{Math.round(maxValue * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-14 mr-2">
            <div className="h-64 flex items-end justify-between gap-1 border-b-2 border-l-2 border-gray-300 pb-2 pl-2">
              {monthlyData.map((month, index) => {
                const value = viewMode === 'daily' ? month.dailyAverage : month.monthlyTotal;
                const heightPercent = (value / maxValue) * 100;
                const heightPx = (heightPercent / 100) * 240; // 240px = h-64 minus padding
                const isHovered = hoveredMonth === index;

                return (
                  <div
                    key={month.month}
                    className="flex-1 flex flex-col items-center gap-1 relative group"
                    onMouseEnter={() => setHoveredMonth(index)}
                    onMouseLeave={() => setHoveredMonth(null)}
                  >
                    {/* Bar */}
                    <div className="w-full flex flex-col items-center">
                      <div
                        className={`w-full bg-gradient-to-t ${getSeasonColor(month.season)} rounded-t-lg transition-all duration-300 cursor-pointer relative ${
                          isHovered ? 'opacity-100 scale-105 shadow-lg' : 'opacity-90'
                        }`}
                        style={{ height: `${heightPx}px`, minHeight: heightPx > 0 ? '4px' : '0px' }}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 animate-in fade-in slide-in-from-bottom-2">
                            <div className={`${getSeasonBg(month.season)} border-2 border-${month.season.toLowerCase()}-300 rounded-lg p-3 shadow-xl min-w-[200px]`}>
                              <div className="text-center space-y-1">
                                <p className="font-bold text-gray-800 flex items-center justify-center gap-1">
                                  <span>{month.seasonEmoji}</span>
                                  <span>{month.month}</span>
                                </p>
                                <p className="text-2xl font-bold text-blue-600">
                                  {value.toFixed(1)} kWh
                                </p>
                                <p className="text-xs text-gray-600">
                                  {viewMode === 'daily' ? 'per day' : 'per month'}
                                </p>
                                <div className="pt-2 border-t border-gray-300 space-y-0.5">
                                  <p className="text-xs text-gray-600">
                                    Peak sun: {month.peakSunHours}h/day
                                  </p>
                                  {viewMode === 'monthly' && (
                                    <p className="text-xs text-gray-600">
                                      Daily avg: {month.dailyAverage} kWh
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Month label */}
                    <span className="text-xs font-medium text-gray-600 mt-1">
                      {month.month.substring(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* X-axis label */}
            <div className="text-center mt-2">
              <span className="text-sm text-gray-600 font-medium">Month</span>
            </div>
          </div>

          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
            <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
              {viewMode === 'daily' ? 'kWh per day' : 'kWh per month'}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium mb-1">System Size</p>
            <p className="text-2xl font-bold text-blue-900">{systemSizeKw} kW</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium mb-1">Annual Production</p>
            <p className="text-2xl font-bold text-green-900">{annualTotalKwh.toLocaleString()} kWh</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium mb-1">Best Month</p>
            <p className="text-2xl font-bold text-yellow-900">
              {monthlyData.reduce((max, m) => m.monthlyTotal > max.monthlyTotal ? m : max).month}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 font-medium mb-1">Daily Average</p>
            <p className="text-2xl font-bold text-purple-900">
              {Math.round(annualTotalKwh / 365)} kWh
            </p>
          </div>
        </div>

        {/* Seasonal Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Seasonal Production
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Summer', 'Autumn', 'Winter', 'Spring'].map((season) => {
              const seasonData = monthlyData.filter(m => m.season === season);
              const seasonTotal = seasonData.reduce((sum, m) => sum + m.monthlyTotal, 0);
              const seasonPercent = (seasonTotal / annualTotalKwh) * 100;
              
              return (
                <div key={season} className={`${getSeasonBg(season)} p-3 rounded-lg border border-gray-200`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{seasonData[0]?.seasonEmoji}</span>
                    <span className="text-xs font-medium text-gray-700">{season}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{seasonTotal.toLocaleString()} kWh</p>
                  <p className="text-xs text-gray-600">{seasonPercent.toFixed(1)}% of annual</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">About this data:</p>
              <ul className="text-xs space-y-1 ml-4 list-disc">
                <li>Based on Perth, WA solar irradiance data</li>
                <li>Includes system efficiency (87%), shading (5%), and soiling (3%) losses</li>
                <li>Summer months (Dec-Feb) produce ~40% more than winter (Jun-Aug)</li>
                <li>Actual production may vary based on weather and system maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
