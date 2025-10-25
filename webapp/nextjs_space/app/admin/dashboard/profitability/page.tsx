'use client';

import { useState, useEffect } from 'react';
import { format, subMonths } from 'date-fns';

interface ProfitabilityData {
  period: string;
  totalRevenue: number;
  totalLaborCost: number;
  totalMaterialCost: number;
  totalOverhead: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  jobCount: number;
  averageJobValue: number;
  averageLaborCost: number;
  averageProfit: number;
}

interface StaffProfitability {
  id: string;
  name: string;
  role: string;
  jobsCompleted: number;
  hoursWorked: number;
  revenueGenerated: number;
  laborCost: number;
  profitContribution: number;
  profitMargin: number;
  efficiency: number;
}

interface JobTypeProfitability {
  type: string;
  jobCount: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  margin: number;
  averageJobValue: number;
}

export default function ProfitabilityAnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [monthlyData, setMonthlyData] = useState<ProfitabilityData[]>([]);
  const [staffData, setStaffData] = useState<StaffProfitability[]>([]);
  const [jobTypeData, setJobTypeData] = useState<JobTypeProfitability[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitabilityData();
  }, [selectedPeriod]);

  async function fetchProfitabilityData() {
    setLoading(true);
    try {
      // Mock data - would fetch from API
      const mockMonthlyData: ProfitabilityData[] = [
        {
          period: format(new Date(), 'MMM yyyy'),
          totalRevenue: 245000,
          totalLaborCost: 45000,
          totalMaterialCost: 120000,
          totalOverhead: 25000,
          grossProfit: 125000,
          grossMargin: 51.0,
          netProfit: 55000,
          netMargin: 22.4,
          jobCount: 28,
          averageJobValue: 8750,
          averageLaborCost: 1607,
          averageProfit: 1964
        },
        {
          period: format(subMonths(new Date(), 1), 'MMM yyyy'),
          totalRevenue: 198000,
          totalLaborCost: 38000,
          totalMaterialCost: 95000,
          totalOverhead: 22000,
          grossProfit: 103000,
          grossMargin: 52.0,
          netProfit: 43000,
          netMargin: 21.7,
          jobCount: 22,
          averageJobValue: 9000,
          averageLaborCost: 1727,
          averageProfit: 1955
        }
      ];

      const mockStaffData: StaffProfitability[] = [
        {
          id: '1',
          name: 'Mike Johnson',
          role: 'Lead Installer',
          jobsCompleted: 12,
          hoursWorked: 192,
          revenueGenerated: 105000,
          laborCost: 8640,
          profitContribution: 96360,
          profitMargin: 91.8,
          efficiency: 95
        },
        {
          id: '2',
          name: 'Tom Brown',
          role: 'Installer',
          jobsCompleted: 10,
          hoursWorked: 160,
          revenueGenerated: 87500,
          laborCost: 5600,
          profitContribution: 81900,
          profitMargin: 93.6,
          efficiency: 92
        },
        {
          id: '3',
          name: 'Sarah Davis',
          role: 'Electrician',
          jobsCompleted: 8,
          hoursWorked: 128,
          revenueGenerated: 70000,
          laborCost: 5120,
          profitContribution: 64880,
          profitMargin: 92.7,
          efficiency: 88
        }
      ];

      const mockJobTypeData: JobTypeProfitability[] = [
        {
          type: 'Residential Solar',
          jobCount: 18,
          totalRevenue: 157500,
          totalCost: 95000,
          profit: 62500,
          margin: 39.7,
          averageJobValue: 8750
        },
        {
          type: 'Commercial Solar',
          jobCount: 5,
          totalRevenue: 62500,
          totalCost: 38000,
          profit: 24500,
          margin: 39.2,
          averageJobValue: 12500
        },
        {
          type: 'Battery Installation',
          jobCount: 5,
          totalRevenue: 25000,
          totalCost: 14000,
          profit: 11000,
          margin: 44.0,
          averageJobValue: 5000
        }
      ];

      setMonthlyData(mockMonthlyData);
      setCurrentPeriod(mockMonthlyData[0]);
      setStaffData(mockStaffData);
      setJobTypeData(mockJobTypeData);
    } catch (error) {
      console.error('Error fetching profitability data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profitability Analysis</h1>
        <p className="text-gray-600">Comprehensive profit and margin analysis</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {currentPeriod && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-blue-100 text-sm mb-2">Total Revenue</div>
            <div className="text-4xl font-bold mb-1">
              ${(currentPeriod.totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-blue-100 text-sm">
              {currentPeriod.jobCount} jobs • ${currentPeriod.averageJobValue.toLocaleString()} avg
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-green-100 text-sm mb-2">Gross Profit</div>
            <div className="text-4xl font-bold mb-1">
              ${(currentPeriod.grossProfit / 1000).toFixed(0)}k
            </div>
            <div className="text-green-100 text-sm">
              {currentPeriod.grossMargin.toFixed(1)}% margin
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-purple-100 text-sm mb-2">Net Profit</div>
            <div className="text-4xl font-bold mb-1">
              ${(currentPeriod.netProfit / 1000).toFixed(0)}k
            </div>
            <div className="text-purple-100 text-sm">
              {currentPeriod.netMargin.toFixed(1)}% margin
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-6">
            <div className="text-orange-100 text-sm mb-2">Labor Cost</div>
            <div className="text-4xl font-bold mb-1">
              ${(currentPeriod.totalLaborCost / 1000).toFixed(0)}k
            </div>
            <div className="text-orange-100 text-sm">
              {((currentPeriod.totalLaborCost / currentPeriod.totalRevenue) * 100).toFixed(1)}% of revenue
            </div>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {currentPeriod && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Cost Breakdown</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Labor Cost</span>
                <span className="font-semibold">${currentPeriod.totalLaborCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(currentPeriod.totalLaborCost / currentPeriod.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Material Cost</span>
                <span className="font-semibold">${currentPeriod.totalMaterialCost.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(currentPeriod.totalMaterialCost / currentPeriod.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Overhead</span>
                <span className="font-semibold">${currentPeriod.totalOverhead.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ width: `${(currentPeriod.totalOverhead / currentPeriod.totalRevenue) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-800">Net Profit</span>
                <span className="font-bold text-green-600">${currentPeriod.netProfit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${currentPeriod.netMargin}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profitability */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Staff Profitability</h3>
          <p className="text-sm text-gray-600">Profit contribution by team member</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff Member</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Jobs</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Hours</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Labor Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Margin</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staffData.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-800">{staff.name}</div>
                    <div className="text-sm text-gray-600">{staff.role}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{staff.jobsCompleted}</td>
                  <td className="px-4 py-4 text-right font-medium">{staff.hoursWorked}h</td>
                  <td className="px-4 py-4 text-right font-semibold text-blue-600">
                    ${staff.revenueGenerated.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right font-medium text-orange-600">
                    ${staff.laborCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-green-600">
                    ${staff.profitContribution.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                      {staff.profitMargin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            staff.efficiency >= 90 ? 'bg-green-500' :
                            staff.efficiency >= 80 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${staff.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{staff.efficiency}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Type Profitability */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Profitability by Job Type</h3>
          <p className="text-sm text-gray-600">Compare margins across different services</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {jobTypeData.map((jobType, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{jobType.type}</div>
                    <div className="text-sm text-gray-600">
                      {jobType.jobCount} jobs • ${jobType.averageJobValue.toLocaleString()} avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {jobType.margin.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">margin</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Revenue</div>
                    <div className="font-semibold text-blue-600">
                      ${jobType.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Cost</div>
                    <div className="font-semibold text-orange-600">
                      ${jobType.totalCost.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Profit</div>
                    <div className="font-semibold text-green-600">
                      ${jobType.profit.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${jobType.margin}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
