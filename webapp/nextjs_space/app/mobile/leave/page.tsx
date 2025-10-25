'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';

export default function MobileLeavePage() {
  const [balance, setBalance] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    reason: ''
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  async function fetchLeaveData() {
    try {
      // Mock data - would fetch from API
      setBalance({
        annualLeaveBalance: 15.5,
        sickLeaveBalance: 8.0,
        rdoBalance: 2.0
      });

      setRequests([
        {
          id: '1',
          leaveType: 'ANNUAL',
          startDate: '2025-10-20',
          endDate: '2025-10-24',
          totalDays: 5,
          status: 'PENDING',
          reason: 'Family vacation'
        },
        {
          id: '2',
          leaveType: 'SICK',
          startDate: '2025-09-15',
          endDate: '2025-09-15',
          totalDays: 1,
          status: 'APPROVED',
          reason: 'Medical appointment'
        }
      ]);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest() {
    try {
      const response = await fetch('/api/staff/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✓ Leave request submitted successfully!');
        setShowRequestForm(false);
        fetchLeaveData();
      } else {
        alert('Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL': return 'bg-blue-100 text-blue-800';
      case 'SICK': return 'bg-green-100 text-green-800';
      case 'PERSONAL': return 'bg-purple-100 text-purple-800';
      case 'UNPAID': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showRequestForm) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRequestForm(false)}
              className="p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold">Request Leave</h1>
              <p className="text-blue-100 text-sm">Submit a new leave request</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Leave Type */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Leave Type
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg font-medium"
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg font-medium mb-3"
            />

            <label className="block text-sm font-semibold text-gray-800 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg font-medium"
            />
          </div>

          {/* Reason */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              placeholder="Provide a reason for your leave request..."
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>

          {/* Balance Info */}
          {balance && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Available Balance:</strong>
                  <div className="mt-1">
                    Annual: {balance.annualLeaveBalance} days • 
                    Sick: {balance.sickLeaveBalance} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={handleSubmitRequest}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg font-bold text-lg active:scale-95 transition-transform"
          >
            Submit Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-1">Leave Management</h1>
        <p className="text-blue-100 text-sm">View balance and request leave</p>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="p-4">
          <h2 className="font-bold text-gray-800 mb-3">Leave Balance</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-sm text-gray-600 mb-1">Annual Leave</div>
              <div className="text-3xl font-bold text-blue-600">
                {balance.annualLeaveBalance}
              </div>
              <div className="text-xs text-gray-600 mt-1">days available</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="text-sm text-gray-600 mb-1">Sick Leave</div>
              <div className="text-3xl font-bold text-green-600">
                {balance.sickLeaveBalance}
              </div>
              <div className="text-xs text-gray-600 mt-1">days available</div>
            </div>
          </div>
          {balance.rdoBalance > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600">RDO Balance</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {balance.rdoBalance} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Button */}
      <div className="px-4 mb-6">
        <button
          onClick={() => setShowRequestForm(true)}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Request Leave
        </button>
      </div>

      {/* Leave Requests */}
      <div className="px-4">
        <h2 className="font-bold text-gray-800 mb-3">Leave Requests</h2>
        
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No leave requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getLeaveTypeColor(request.leaveType)}`}>
                      {request.leaveType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {request.totalDays}
                    </div>
                    <div className="text-xs text-gray-600">
                      {request.totalDays === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {format(new Date(request.startDate), 'dd MMM yyyy')}
                      {request.startDate !== request.endDate && (
                        <> - {format(new Date(request.endDate), 'dd MMM yyyy')}</>
                      )}
                    </span>
                  </div>

                  {request.reason && (
                    <div className="text-gray-600 pt-2 border-t">
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          <a href="/mobile" className="p-3 text-center text-gray-600">
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
          <a href="/mobile/timesheets" className="p-3 text-center text-gray-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-xs font-medium">Timesheet</div>
          </a>
          <a href="/mobile/leave" className="p-3 text-center text-blue-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-xs font-medium">Leave</div>
          </a>
        </div>
      </div>
    </div>
  );
}
