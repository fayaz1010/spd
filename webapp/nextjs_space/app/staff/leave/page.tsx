'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  reviewedAt: string | null;
  approvalNotes: string | null;
}

interface LeaveBalance {
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  longServiceLeaveBalance: number;
  rdoBalance: number;
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaveData();
  }, []);

  async function fetchLeaveData() {
    try {
      const [requestsRes, balanceRes] = await Promise.all([
        fetch('/api/staff/leave/requests'),
        fetch('/api/staff/leave/balance')
      ]);

      const requestsData = await requestsRes.json();
      const balanceData = await balanceRes.json();

      if (requestsData.success) {
        setRequests(requestsData.requests);
      }

      if (balanceData.success) {
        setBalance(balanceData.balance);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitLeaveRequest() {
    try {
      const res = await fetch('/api/staff/leave/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchLeaveData();
        setShowForm(false);
        setFormData({
          leaveType: 'ANNUAL',
          startDate: '',
          endDate: '',
          reason: ''
        });
        alert('Leave request submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-200 text-yellow-800';
      case 'APPROVED': return 'bg-green-200 text-green-800';
      case 'REJECTED': return 'bg-red-200 text-red-800';
      case 'CANCELLED': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Request Leave
        </button>
      </div>

      {/* Leave Balance Cards */}
      {balance && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Annual Leave</div>
            <div className="text-3xl font-bold text-blue-600">
              {balance.annualLeaveBalance.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">days available</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Sick Leave</div>
            <div className="text-3xl font-bold text-green-600">
              {balance.sickLeaveBalance.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">days available</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">Long Service</div>
            <div className="text-3xl font-bold text-purple-600">
              {balance.longServiceLeaveBalance.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">days available</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="text-sm text-gray-600 mb-1">RDOs</div>
            <div className="text-3xl font-bold text-orange-600">
              {balance.rdoBalance.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">days available</div>
          </div>
        </div>
      )}

      {/* Leave Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Request Leave</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="ANNUAL">Annual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="PERSONAL">Personal Leave</option>
                  <option value="CARER">Carer's Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="LONG_SERVICE">Long Service Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={submitLeaveRequest}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Leave Requests</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No leave requests yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Start Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">End Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Days</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {req.leaveType.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(req.startDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(req.endDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {req.totalDays}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {req.approvalNotes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
