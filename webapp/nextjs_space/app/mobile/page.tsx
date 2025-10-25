'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function MobileDashboard() {
  const router = useRouter();
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [todayJobs, setTodayJobs] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      // Fetch today's attendance, jobs, leave balance
      // For now using mock data
      setTodayStatus({
        clockedIn: false,
        clockInTime: null,
        hoursWorked: 0
      });

      setTodayJobs([
        {
          id: '1',
          jobNumber: 'JOB-2025-001',
          customerName: 'John Smith',
          startTime: '08:00',
          address: '123 Main St, Perth WA'
        }
      ]);

      setLeaveBalance({
        annualLeaveBalance: 15.5,
        sickLeaveBalance: 8.0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome Back!</h1>
            <p className="text-blue-100">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          </div>
          <button className="p-2 bg-blue-500 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>

        {/* Quick Status */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-100 text-sm mb-1">Today's Status</div>
              <div className="text-2xl font-bold">
                {todayStatus.clockedIn ? 'Clocked In' : 'Not Clocked In'}
              </div>
              {todayStatus.clockInTime && (
                <div className="text-blue-100 text-sm mt-1">
                  Since {todayStatus.clockInTime}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm mb-1">Hours Today</div>
              <div className="text-3xl font-bold">{todayStatus.hoursWorked.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 -mt-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <h2 className="font-bold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/mobile/clock')}
              className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-semibold">Clock In/Out</div>
            </button>

            <button
              onClick={() => router.push('/mobile/schedule')}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="font-semibold">My Schedule</div>
            </button>

            <button
              onClick={() => router.push('/mobile/timesheets')}
              className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <div className="font-semibold">Timesheet</div>
            </button>

            <button
              onClick={() => router.push('/mobile/leave')}
              className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-md active:scale-95 transition-transform"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="font-semibold">Leave</div>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Jobs */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">Today's Jobs</h2>
            <span className="text-sm text-blue-600 font-medium">{todayJobs.length} jobs</span>
          </div>

          {todayJobs.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No jobs scheduled today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold mb-1">
                        {job.jobNumber}
                      </div>
                      <div className="font-semibold text-gray-800">{job.customerName}</div>
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      {job.startTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="truncate">{job.address}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => router.push('/mobile/schedule')}
                className="w-full py-2 text-blue-600 font-medium text-sm"
              >
                View Full Schedule →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Balance */}
      {leaveBalance && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h2 className="font-bold text-gray-800 mb-3">Leave Balance</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-sm text-blue-600 mb-1">Annual Leave</div>
                <div className="text-2xl font-bold text-blue-600">
                  {leaveBalance.annualLeaveBalance}
                </div>
                <div className="text-xs text-blue-600">days</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-sm text-green-600 mb-1">Sick Leave</div>
                <div className="text-2xl font-bold text-green-600">
                  {leaveBalance.sickLeaveBalance}
                </div>
                <div className="text-xs text-green-600">days</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          <a href="/mobile" className="p-3 text-center text-blue-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <div className="text-xs font-medium">Home</div>
          </a>
          <a href="/mobile/schedule" className="p-3 text-center text-gray-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-xs font-medium">Schedule</div>
          </a>
          <a href="/mobile/clock" className="p-3 text-center text-gray-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs font-medium">Clock</div>
          </a>
          <a href="/mobile/timesheets" className="p-3 text-center text-gray-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-xs font-medium">Timesheet</div>
          </a>
        </div>
      </div>
    </div>
  );
}
