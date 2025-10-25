'use client';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ConsumptionChartsProps {
  hourlyPattern: number[];
  dailyPattern: number[];
}

export function ConsumptionCharts({ hourlyPattern, dailyPattern }: ConsumptionChartsProps) {
  // Prepare hourly data
  const hourlyData = hourlyPattern.map((value, hour) => ({
    hour: `${hour}:00`,
    consumption: value,
  }));

  // Prepare daily data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyData = dailyPattern.map((value, day) => ({
    day: dayNames[day],
    consumption: value,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Consumption Patterns</h3>

      <Tabs defaultValue="hourly">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hourly">Hourly Pattern</TabsTrigger>
          <TabsTrigger value="daily">Daily Pattern</TabsTrigger>
        </TabsList>

        {/* Hourly Pattern */}
        <TabsContent value="hourly" className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Average consumption by hour of day (30-minute intervals)
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12 }}
                  interval={2}
                />
                <YAxis 
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(3)} kWh`, 'Consumption']}
                  labelStyle={{ color: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Hours Highlight */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Peak Usage Hours</h4>
            <div className="grid grid-cols-3 gap-2">
              {hourlyPattern
                .map((value, hour) => ({ hour, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={index} className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {item.hour}:00
                    </p>
                    <p className="text-sm text-blue-800">
                      {item.value.toFixed(3)} kWh
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </TabsContent>

        {/* Daily Pattern */}
        <TabsContent value="daily" className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Average consumption by day of week
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Consumption']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar 
                  dataKey="consumption" 
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekday vs Weekend */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Weekday Average</h4>
              <p className="text-3xl font-bold text-green-600">
                {(dailyPattern.slice(1, 6).reduce((a, b) => a + b, 0) / 5).toFixed(1)}
                <span className="text-sm font-normal ml-1">kWh</span>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Weekend Average</h4>
              <p className="text-3xl font-bold text-blue-600">
                {((dailyPattern[0] + dailyPattern[6]) / 2).toFixed(1)}
                <span className="text-sm font-normal ml-1">kWh</span>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
