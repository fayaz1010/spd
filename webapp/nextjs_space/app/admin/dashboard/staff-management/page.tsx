'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface DashboardStats {
  totalStaff: number;
  activeStaff: number;
  complianceRate: number;
  pendingTimesheets: number;
  pendingLeaveRequests: number;
  upcomingLeave: number;
  expiringCertifications: number;
}

interface StaffSummary {
  id: string;
  name: string;
  role: string;
  team: { name: string; color: string };
  complianceScore: number;
  pendingTimesheet: boolean;
  upcomingLeave: boolean;
  expiringCert: boolean;
}

export default function StaffManagementDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    activeStaff: 0,
    complianceRate: 0,
    pendingTimesheets: 0,
    pendingLeaveRequests: 0,
    upcomingLeave: 0,
    expiringCertifications: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch compliance data
      const complianceRes = await fetch('/api/admin/compliance/dashboard');
      const complianceData = await complianceRes.json();

      if (complianceData.success) {
        const complianceRate = complianceData.stats.totalStaff > 0
          ? Math.round((complianceData.stats.fullyCompliant / complianceData.stats.totalStaff) * 100)
          : 0;

        setStats({
          totalStaff: complianceData.stats.totalStaff,
          activeStaff: complianceData.stats.totalStaff,
          complianceRate,
          pendingTimesheets: 0, // Would fetch from timesheets API
          pendingLeaveRequests: 0, // Would fetch from leave API
          upcomingLeave: 0,
          expiringCertifications: complianceData.stats.cecExpiringSoon + complianceData.stats.licenseExpiringSoon
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Staff Management Dashboard</h1>
        <p className="text-gray-600">Complete overview of your workforce</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Total Staff</div>
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.totalStaff}</div>
          <div className="text-sm text-green-600 mt-1">
            {stats.activeStaff} active
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Compliance Rate</div>
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.complianceRate}%</div>
          <div className="text-sm text-gray-600 mt-1">
            {stats.expiringCertifications} expiring soon
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Pending Timesheets</div>
            <div className="text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.pendingTimesheets}</div>
          <div className="text-sm text-gray-600 mt-1">
            Awaiting approval
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">Leave Requests</div>
            <div className="text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold">{stats.pendingLeaveRequests}</div>
          <div className="text-sm text-gray-600 mt-1">
            Pending approval
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/dashboard/staff')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Manage Staff</div>
              <div className="text-sm text-gray-600">View and edit staff details</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/dashboard/compliance')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Compliance Dashboard</div>
              <div className="text-sm text-gray-600">Monitor certifications</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/dashboard/teams')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Manage Teams</div>
              <div className="text-sm text-gray-600">Organize installation teams</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/dashboard/scheduling')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Job Scheduling</div>
              <div className="text-sm text-gray-600">Assign staff to jobs</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/dashboard/labor-costs')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Labor Cost Dashboard</div>
              <div className="text-sm text-gray-600">Track labor costs & margins</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/dashboard/profitability')}
          className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold">Profitability Analysis</div>
              <div className="text-sm text-gray-600">Revenue & profit insights</div>
            </div>
          </div>
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Alerts & Notifications */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Alerts & Notifications</h2>
          </div>
          <div className="p-4 space-y-3">
            {stats.expiringCertifications > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-red-800">Certifications Expiring Soon</div>
                  <div className="text-sm text-red-700">
                    {stats.expiringCertifications} certifications expiring within 30 days
                  </div>
                  <button
                    onClick={() => router.push('/admin/dashboard/compliance')}
                    className="text-sm text-red-600 hover:text-red-800 font-medium mt-1"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            )}

            {stats.pendingTimesheets > 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-yellow-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-yellow-800">Pending Timesheets</div>
                  <div className="text-sm text-yellow-700">
                    {stats.pendingTimesheets} timesheets awaiting approval
                  </div>
                  <button className="text-sm text-yellow-600 hover:text-yellow-800 font-medium mt-1">
                    Review Timesheets →
                  </button>
                </div>
              </div>
            )}

            {stats.pendingLeaveRequests > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-blue-800">Leave Requests</div>
                  <div className="text-sm text-blue-700">
                    {stats.pendingLeaveRequests} leave requests pending approval
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-1">
                    Review Requests →
                  </button>
                </div>
              </div>
            )}

            {stats.expiringCertifications === 0 && stats.pendingTimesheets === 0 && stats.pendingLeaveRequests === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="font-medium">All Clear!</div>
                <div className="text-sm">No pending actions required</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Quick Links</h2>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => router.push('/admin/dashboard/staff/new')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Add New Staff Member</div>
                <div className="text-sm text-gray-600">Create a new staff profile</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/staff/timesheets')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <div className="font-medium">View Timesheets</div>
                <div className="text-sm text-gray-600">Review submitted timesheets</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/staff/leave')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Leave Management</div>
                <div className="text-sm text-gray-600">View leave requests and balances</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/staff/payslips')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Payroll & Payslips</div>
                <div className="text-sm text-gray-600">Generate payroll and view payslips</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/compliance')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Compliance Reports</div>
                <div className="text-sm text-gray-600">View certification compliance</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/timesheets')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Timesheet Approval</div>
                <div className="text-sm text-gray-600">Approve staff timesheets</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/leave')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Leave Approval</div>
                <div className="text-sm text-gray-600">Approve leave requests</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/payroll')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Payroll Dashboard</div>
                <div className="text-sm text-gray-600">Manage payroll batches</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/kpi')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">KPI Dashboard</div>
                <div className="text-sm text-gray-600">View performance metrics</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/skills')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-cyan-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Skills Matrix</div>
                <div className="text-sm text-gray-600">View all staff skills</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/training')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Training Calendar</div>
                <div className="text-sm text-gray-600">Schedule and track training</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/admin/dashboard/performance')}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left"
            >
              <div className="w-8 h-8 bg-pink-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Performance Dashboard</div>
                <div className="text-sm text-gray-600">View staff performance reviews</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
