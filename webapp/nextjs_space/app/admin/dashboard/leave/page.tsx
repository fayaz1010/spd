'use client';

import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';

interface LeaveRequest {
  id: string;
  staffId: string;
  staff: {
    name: string;
    role: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  requestedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export default function LeaveApprovalPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus]);

  async function fetchLeaveRequests() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/leave?status=${filterStatus}`);
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string) {
    if (!confirm('Approve this leave request?')) return;

    try {
      const response = await fetch(`/api/admin/leave/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: 'Admin', // Would get from session
          reviewNotes: ''
        })
      });

      if (response.ok) {
        alert('✓ Leave request approved!');
        fetchLeaveRequests();
      } else {
        alert('Failed to approve leave request');
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave request');
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/leave/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: 'Admin', // Would get from session
          reviewNotes: reason
        })
      });

      if (response.ok) {
        alert('✓ Leave request rejected');
        fetchLeaveRequests();
      } else {
        alert('Failed to reject leave request');
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave request');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL': return 'bg-blue-100 text-blue-800';
      case 'SICK': return 'bg-green-100 text-green-800';
      case 'PERSONAL': return 'bg-purple-100 text-purple-800';
      case 'UNPAID': return 'bg-gray-100 text-gray-800';
      case 'RDO': return 'bg-orange-100 text-orange-800';
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
        <h1 className="text-3xl font-bold text-gray-800">Leave Request Approval</h1>
        <p className="text-gray-600">Review and approve staff leave requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Pending Approval</div>
          <div className="text-3xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Days Requested</div>
          <div className="text-3xl font-bold text-blue-600">
            {requests.reduce((sum, r) => sum + r.totalDays, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Approved This Month</div>
          <div className="text-3xl font-bold text-green-600">
            {requests.filter(r => r.status === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Staff Affected</div>
          <div className="text-3xl font-bold text-purple-600">
            {new Set(requests.map(r => r.staffId)).size}
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
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All Requests</option>
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Days</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Requested</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{request.staff.name}</div>
                      <div className="text-sm text-gray-600">{request.staff.role}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getLeaveTypeColor(request.leaveType)}`}>
                        {request.leaveType}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div>{format(new Date(request.startDate), 'dd MMM yyyy')}</div>
                        <div className="text-gray-600">to {format(new Date(request.endDate), 'dd MMM yyyy')}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-blue-600">
                      {request.totalDays}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">
                        {request.reason || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">
                      {format(new Date(request.requestedAt), 'dd MMM HH:mm')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                        >
                          View
                        </button>
                        {request.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
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
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Leave Request Details</h3>
                  <p className="text-sm text-gray-600">{selectedRequest.staff.name}</p>
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
                  <div className="text-sm text-gray-600">Leave Type</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getLeaveTypeColor(selectedRequest.leaveType)}`}>
                    {selectedRequest.leaveType}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-semibold">{format(new Date(selectedRequest.startDate), 'dd MMM yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="font-semibold">{format(new Date(selectedRequest.endDate), 'dd MMM yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Days</div>
                  <div className="font-bold text-blue-600 text-xl">{selectedRequest.totalDays} days</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Requested At</div>
                  <div className="font-semibold">{format(new Date(selectedRequest.requestedAt), 'dd MMM yyyy HH:mm')}</div>
                </div>
              </div>

              {selectedRequest.reason && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Reason:</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {selectedRequest.reason}
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Review Information:</div>
                  <div className="text-sm text-gray-600">
                    <div><strong>Reviewed by:</strong> {selectedRequest.reviewedBy}</div>
                    <div><strong>Reviewed at:</strong> {selectedRequest.reviewedAt ? format(new Date(selectedRequest.reviewedAt), 'dd MMM yyyy HH:mm') : '-'}</div>
                    {selectedRequest.reviewNotes && (
                      <div className="mt-2 bg-gray-50 p-3 rounded">
                        <strong>Notes:</strong> {selectedRequest.reviewNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Calendar Preview */}
              <div className="pt-4 border-t">
                <div className="text-sm font-semibold text-gray-700 mb-2">Leave Period:</div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-800">
                        {format(new Date(selectedRequest.startDate), 'EEEE, dd MMMM yyyy')}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">Start date</div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-800">
                        {format(new Date(selectedRequest.endDate), 'EEEE, dd MMMM yyyy')}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">End date</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedRequest.status === 'PENDING' && (
              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => {
                    handleReject(selectedRequest.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    handleApprove(selectedRequest.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                >
                  Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
