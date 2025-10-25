
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface MonthlyProductionChartProps {
  systemSizeKw: number;
  quarterlyBill: number;
  roofAnalysis?: {
    maxSunshineHoursPerYear?: number;
    latitude?: number;
  };
}

export function MonthlyProductionChart({ 
  systemSizeKw, 
  quarterlyBill,
  roofAnalysis 
}: MonthlyProductionChartProps) {
  const monthlyData = useMemo(() => {
    // Calculate monthly production estimates
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Annual production estimate: systemSize (kW) × 1460 hours/year (Perth average)
    const annualProduction = systemSizeKw * 1460;
    
    // Seasonal variation for Perth (Southern Hemisphere)
    // Summer months (Dec-Feb): +30% above average
    // Autumn (Mar-May): +10% above average
    // Winter (Jun-Aug): -30% below average
    // Spring (Sep-Nov): +10% above average
    const seasonalFactors = [
      1.25,  // Jan (Summer)
      1.25,  // Feb (Summer)
      1.10,  // Mar (Autumn)
      1.10,  // Apr (Autumn)
      1.05,  // May (Autumn)
      0.70,  // Jun (Winter)
      0.70,  // Jul (Winter)
      0.75,  // Aug (Winter)
      1.05,  // Sep (Spring)
      1.10,  // Oct (Spring)
      1.15,  // Nov (Spring)
      1.30,  // Dec (Summer)
    ];

    // Calculate monthly consumption from quarterly bill
    const annualUsage = (quarterlyBill * 4) / 0.28; // Assume $0.28/kWh
    const monthlyConsumption = annualUsage / 12;

    return months.map((month, index) => {
      const monthlyProduction = (annualProduction / 12) * seasonalFactors[index];
      const consumption = monthlyConsumption;
      const surplus = Math.max(0, monthlyProduction - consumption);
      const shortfall = Math.max(0, consumption - monthlyProduction);

      return {
        month,
        production: Math.round(monthlyProduction),
        consumption: Math.round(consumption),
        surplus: Math.round(surplus),
        shortfall: Math.round(shortfall),
        coverage: Math.min(100, Math.round((monthlyProduction / consumption) * 100)),
      };
    });
  }, [systemSizeKw, quarterlyBill]);

  const averageProduction = useMemo(() => {
    return Math.round(monthlyData.reduce((sum, data) => sum + data.production, 0) / 12);
  }, [monthlyData]);

  const averageCoverage = useMemo(() => {
    return Math.round(monthlyData.reduce((sum, data) => sum + data.coverage, 0) / 12);
  }, [monthlyData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Production Forecast</CardTitle>
        <CardDescription>
          Estimated solar production vs. your energy consumption throughout the year
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg Monthly Production</div>
            <div className="text-2xl font-bold text-orange-600">{averageProduction} kWh</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Peak Month (Dec)</div>
            <div className="text-2xl font-bold text-orange-600">{monthlyData[11].production} kWh</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Low Month (Jun)</div>
            <div className="text-2xl font-bold text-blue-600">{monthlyData[5].production} kWh</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg Coverage</div>
            <div className="text-2xl font-bold text-green-600">{averageCoverage}%</div>
          </div>
        </div>

        {/* Production vs Consumption Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Production vs Consumption</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Bar 
                dataKey="production" 
                fill="#f97316" 
                name="Solar Production"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="consumption" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                name="Your Consumption"
                dot={{ fill: '#0ea5e9', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Coverage Percentage Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Monthly Coverage</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                label={{ value: 'Coverage %', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                domain={[0, 120]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `${value}%`}
              />
              <Bar 
                dataKey="coverage" 
                fill="#10b981"
                name="Coverage"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Seasonal Insights */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            ☀️ Seasonal Insights
          </h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• <strong>Summer (Dec-Feb):</strong> Peak production months with {Math.round((monthlyData[0].production + monthlyData[1].production + monthlyData[11].production) / 3)} kWh average</li>
            <li>• <strong>Winter (Jun-Aug):</strong> Lower production with {Math.round((monthlyData[5].production + monthlyData[6].production + monthlyData[7].production) / 3)} kWh average</li>
            <li>• <strong>Annual Range:</strong> Production varies by {Math.round(((monthlyData[11].production - monthlyData[5].production) / monthlyData[5].production) * 100)}% between peak and low months</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          * Production estimates based on Perth solar radiation data and typical {systemSizeKw}kW system performance
        </p>
      </CardContent>
    </Card>
  );
}
