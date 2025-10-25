'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';

interface StaffKPI {
  staffId: string;
  staffName: string;
  role: string;
  month: string;
  jobsCompleted: number;
  hoursWorked: number;
  jobsPerHour: number;
  customerRating: number;
  reworkRequired: number;
  complianceScore: number;
  safetyIncidents: number;
  revenueGenerated: number;
  laborCost: number;
  profitability: number;
  daysWorked: number;
  daysAbsent: number;
  lateArrivals: number;
}

export default function KPIDashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [kpiData, setKpiData] = useState<StaffKPI[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('profitability');

  useEffect(() => {
    fetchKPIData();
  }, [selectedMonth]);

  async function fetchKPIData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/staff/kpi?month=${format(selectedMonth, 'yyyy-MM-dd')}`);
      
      if (response.ok) {
        const data = await response.json();
        setKpiData(data.kpiData || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  }

  const sortedData = [...kpiData].sort((a, b) => {
    switch (sortBy) {
      case 'profitability':
        return b.profitability - a.profitability;
      case 'jobsCompleted':
        return b.jobsCompleted - a.jobsCompleted;
      case 'customerRating':
        return b.customerRating - a.customerRating;
      case 'complianceScore':
        return b.complianceScore - a.complianceScore;
      default:
        return 0;
    }
  });

  const getPerformanceColor = (value: number, type: string) => {
    if (type === 'rating') {
      if (value >= 4.5) return 'text-green-600';
      if (value >= 4.0) return 'text-blue-600';
      if (value >= 3.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    if (type === 'compliance') {
      if (value >= 95) return 'text-green-600';
      if (value >= 85) return 'text-blue-600';
      if (value >= 75) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
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
        <h1 className="text-3xl font-bold text-gray-800">KPI Dashboard</h1>
        <p className="text-gray-600">Staff performance metrics and key indicators</p>
      </div>

      {/* Month Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Previous
          </button>
          <div className="text-xl font-bold">
            {format(selectedMonth, 'MMMM yyyy')}
          </div>
          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Current Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Total Staff</div>
            <div className="text-3xl font-bold text-blue-600">{summary.totalStaff || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Jobs Completed</div>
            <div className="text-3xl font-bold text-green-600">{summary.totalJobs || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Rating</div>
            <div className="text-3xl font-bold text-purple-600">
              {summary.avgRating ? summary.avgRating.toFixed(1) : 'N/A'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Revenue</div>
            <div className="text-3xl font-bold text-orange-600">
              ${summary.totalRevenue ? (summary.totalRevenue / 1000).toFixed(0) : 0}k
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Safety Incidents</div>
            <div className={`text-3xl font-bold ${summary.totalIncidents === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.totalIncidents || 0}
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="profitability">Profitability</option>
            <option value="jobsCompleted">Jobs Completed</option>
            <option value="customerRating">Customer Rating</option>
            <option value="complianceScore">Compliance Score</option>
          </select>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Jobs</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Hours</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Rating</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Compliance</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Safety</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Profit</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No KPI data available for this month
                  </td>
                </tr>
              ) : (
                sortedData.map((kpi) => (
                  <tr key={kpi.staffId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{kpi.staffName}</div>
                      <div className="text-sm text-gray-600">{kpi.role}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-bold text-gray-800">{kpi.jobsCompleted}</div>
                      <div className="text-xs text-gray-600">
                        {kpi.jobsPerHour ? kpi.jobsPerHour.toFixed(2) : '0'}/hr
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">
                      {kpi.hoursWorked}h
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`font-bold ${getPerformanceColor(kpi.customerRating, 'rating')}`}>
                        {kpi.customerRating ? kpi.customerRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="flex justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${star <= Math.round(kpi.customerRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`font-bold ${getPerformanceColor(kpi.complianceScore, 'compliance')}`}>
                        {kpi.complianceScore ? kpi.complianceScore.toFixed(0) : 0}%
                      </div>
                      {kpi.reworkRequired > 0 && (
                        <div className="text-xs text-red-600 mt-1">
                          {kpi.reworkRequired} rework
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className={`font-bold ${kpi.safetyIncidents === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.safetyIncidents}
                      </div>
                      <div className="text-xs text-gray-600">incidents</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-semibold text-blue-600">
                        ${kpi.revenueGenerated ? kpi.revenueGenerated.toLocaleString() : 0}
                      </div>
                      <div className="text-xs text-gray-600">
                        Cost: ${kpi.laborCost ? kpi.laborCost.toLocaleString() : 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-green-600">
                        {kpi.profitability ? kpi.profitability.toFixed(1) : 0}%
                      </div>
                      <div className="text-xs text-gray-600">
                        ${kpi.revenueGenerated && kpi.laborCost 
                          ? (kpi.revenueGenerated - kpi.laborCost).toLocaleString() 
                          : 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="font-medium text-gray-800">
                        {kpi.daysWorked}/{kpi.daysWorked + kpi.daysAbsent}
                      </div>
                      {kpi.lateArrivals > 0 && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {kpi.lateArrivals} late
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      {sortedData.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-green-800">Top Performer</div>
                <div className="text-sm text-green-700">
                  {sortedData[0].staffName} - {sortedData[0].profitability.toFixed(1)}% profitability
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-blue-800">Highest Rated</div>
                <div className="text-sm text-blue-700">
                  {sortedData.reduce((max, kpi) => kpi.customerRating > max.customerRating ? kpi : max).staffName} - {sortedData.reduce((max, kpi) => kpi.customerRating > max.customerRating ? kpi : max).customerRating.toFixed(1)} stars
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-purple-800">Most Compliant</div>
                <div className="text-sm text-purple-700">
                  {sortedData.reduce((max, kpi) => kpi.complianceScore > max.complianceScore ? kpi : max).staffName} - {sortedData.reduce((max, kpi) => kpi.complianceScore > max.complianceScore ? kpi : max).complianceScore.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
