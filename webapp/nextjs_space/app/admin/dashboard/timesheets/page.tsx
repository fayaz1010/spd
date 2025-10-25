'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface Timesheet {
  id: string;
  staffId: string;
  staff: {
    name: string;
    role: string;
  };
  weekStartDate: string;
  weekEndDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: string;
  submittedAt: string | null;
  notes: string | null;
}

export default function TimesheetApprovalPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filterStatus, setFilterStatus] = useState('SUBMITTED');
  const [loading, setLoading] = useState(true);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTimesheets();
  }, [filterStatus]);

  async function fetchTimesheets() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/timesheets?status=${filterStatus}`);
      
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data.timesheets || []);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(timesheetId: string) {
    if (!confirm('Approve this timesheet?')) return;

    try {
      const response = await fetch(`/api/admin/timesheets/${timesheetId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('✓ Timesheet approved successfully!');
        fetchTimesheets();
      } else {
        alert('Failed to approve timesheet');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      alert('Failed to approve timesheet');
    }
  }

  async function handleReject(timesheetId: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/timesheets/${timesheetId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('✓ Timesheet rejected');
        fetchTimesheets();
      } else {
        alert('Failed to reject timesheet');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      alert('Failed to reject timesheet');
    }
  }

  async function handleBulkApprove() {
    if (!confirm(`Approve all ${timesheets.length} pending timesheets?`)) return;

    try {
      const response = await fetch('/api/admin/timesheets/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timesheetIds: timesheets.map(t => t.id) 
        })
      });

      if (response.ok) {
        alert('✓ All timesheets approved!');
        fetchTimesheets();
      } else {
        alert('Failed to approve timesheets');
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('Failed to approve timesheets');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-800">Timesheet Approval</h1>
        <p className="text-gray-600">Review and approve staff timesheets</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
          <div className="text-3xl font-bold text-yellow-600">
            {timesheets.filter(t => t.status === 'SUBMITTED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Hours</div>
          <div className="text-3xl font-bold text-blue-600">
            {timesheets.reduce((sum, t) => sum + t.totalHours, 0)}h
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Overtime Hours</div>
          <div className="text-3xl font-bold text-orange-600">
            {timesheets.reduce((sum, t) => sum + t.overtimeHours, 0)}h
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Staff Count</div>
          <div className="text-3xl font-bold text-purple-600">
            {new Set(timesheets.map(t => t.staffId)).size}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="SUBMITTED">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PROCESSED">Processed</option>
            <option value="all">All Timesheets</option>
          </select>
        </div>

        {filterStatus === 'SUBMITTED' && timesheets.length > 0 && (
          <button
            onClick={handleBulkApprove}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            Approve All ({timesheets.length})
          </button>
        )}
      </div>

      {/* Timesheets Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Week</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Regular</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Overtime</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Submitted</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No timesheets found
                  </td>
                </tr>
              ) : (
                timesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{timesheet.staff.name}</div>
                      <div className="text-sm text-gray-600">{timesheet.staff.role}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {format(new Date(timesheet.weekStartDate), 'dd MMM')} - {format(new Date(timesheet.weekEndDate), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">
                      {timesheet.regularHours}h
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-orange-600">
                      {timesheet.overtimeHours}h
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-blue-600">
                      {timesheet.totalHours}h
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(timesheet.status)}`}>
                        {timesheet.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">
                      {timesheet.submittedAt ? format(new Date(timesheet.submittedAt), 'dd MMM HH:mm') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTimesheet(timesheet);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                        >
                          View
                        </button>
                        {timesheet.status === 'SUBMITTED' && (
                          <>
                            <button
                              onClick={() => handleApprove(timesheet.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(timesheet.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTimesheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Timesheet Details</h3>
                  <p className="text-sm text-gray-600">{selectedTimesheet.staff.name}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Week Period</div>
                  <div className="font-semibold">
                    {format(new Date(selectedTimesheet.weekStartDate), 'dd MMM')} - {format(new Date(selectedTimesheet.weekEndDate), 'dd MMM yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedTimesheet.status)}`}>
                    {selectedTimesheet.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Regular Hours</div>
                  <div className="font-semibold">{selectedTimesheet.regularHours}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Overtime Hours</div>
                  <div className="font-semibold text-orange-600">{selectedTimesheet.overtimeHours}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                  <div className="font-bold text-blue-600 text-xl">{selectedTimesheet.totalHours}h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Submitted At</div>
                  <div className="font-semibold">
                    {selectedTimesheet.submittedAt ? format(new Date(selectedTimesheet.submittedAt), 'dd MMM yyyy HH:mm') : 'Not submitted'}
                  </div>
                </div>
              </div>

              {selectedTimesheet.notes && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Notes:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedTimesheet.notes}
                  </div>
                </div>
              )}
            </div>

            {selectedTimesheet.status === 'SUBMITTED' && (
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    handleReject(selectedTimesheet.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedTimesheet.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
