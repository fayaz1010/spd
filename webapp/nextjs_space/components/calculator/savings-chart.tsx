'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FinancialScenario } from '@/lib/calculations';

interface SavingsChartProps {
  solarOnly: FinancialScenario;
  solarBattery: FinancialScenario;
  ultimate: FinancialScenario;
}

export default function SavingsChart({ solarOnly, solarBattery, ultimate }: SavingsChartProps) {
  // Generate data for 25 years
  const data = [];
  for (let year = 0; year <= 25; year++) {
    let solarCumulative = -solarOnly.totalInvestment;
    let batteryCumulative = -solarBattery.totalInvestment;
    let ultimateCumulative = -ultimate.totalInvestment;

    for (let y = 1; y <= year; y++) {
      solarCumulative += solarOnly.annualSavings * Math.pow(1.03, y - 1);
      batteryCumulative += solarBattery.annualSavings * Math.pow(1.03, y - 1);
      ultimateCumulative += ultimate.annualSavings * Math.pow(1.03, y - 1);
    }

    data.push({
      year,
      solar: Math.round(solarCumulative),
      battery: Math.round(batteryCumulative),
      ultimate: Math.round(ultimateCumulative),
    });
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border-2 border-primary-100 p-4">
          <p className="font-bold text-primary mb-2">Year {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="font-bold" style={{ color: entry.color }}>
                ${entry.value?.toLocaleString?.()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="year" 
          label={{ value: 'Years After Installation', position: 'insideBottom', offset: -10, style: { fontSize: 13, fontWeight: 600, fill: '#1e3a8a' } }}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <YAxis 
          label={{ value: 'Total Savings ($)', angle: -90, position: 'insideLeft', style: { fontSize: 13, fontWeight: 600, fill: '#1e3a8a' } }}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          axisLine={{ stroke: '#d1d5db' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top"
          height={40}
          wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingBottom: 10 }}
          iconType="line"
        />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} />
        <Line 
          type="monotone" 
          dataKey="solar" 
          stroke="#FFD166" 
          strokeWidth={3}
          name="Solar Only"
          dot={false}
          activeDot={{ r: 6, fill: '#FFD166', stroke: '#fff', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="battery" 
          stroke="#FF6B6B" 
          strokeWidth={4}
          name="Solar + Battery ⭐"
          dot={false}
          activeDot={{ r: 7, fill: '#FF6B6B', stroke: '#fff', strokeWidth: 2 }}
        />
        <Line 
          type="monotone" 
          dataKey="ultimate" 
          stroke="#06D6A0" 
          strokeWidth={3}
          name="Ultimate Package"
          dot={false}
          activeDot={{ r: 6, fill: '#06D6A0', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
