'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface PayrollBatch {
  id: string;
  batchNumber: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  totalGrossPay: number;
  totalTax: number;
  totalSuper: number;
  totalNetPay: number;
  staffCount: number;
  status: string;
  processedBy: string | null;
  processedAt: string | null;
}

export default function PayrollDashboardPage() {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    payPeriodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    payPeriodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    payDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchPayrollBatches();
  }, [selectedMonth]);

  async function fetchPayrollBatches() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payroll?month=${format(selectedMonth, 'yyyy-MM-dd')}`);
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBatch() {
    try {
      const response = await fetch('/api/admin/payroll/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('✓ Payroll batch created successfully!');
        setShowCreateModal(false);
        fetchPayrollBatches();
      } else {
        alert('Failed to create payroll batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create payroll batch');
    }
  }

  async function handleProcessBatch(batchId: string) {
    if (!confirm('Process this payroll batch? This will generate payslips for all staff.')) return;

    try {
      const response = await fetch(`/api/admin/payroll/batch/${batchId}/process`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('✓ Payroll batch processed successfully!');
        fetchPayrollBatches();
      } else {
        alert('Failed to process payroll batch');
      }
    } catch (error) {
      console.error('Error processing batch:', error);
      alert('Failed to process payroll batch');
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSED': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
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
        <h1 className="text-3xl font-bold text-gray-800">Payroll Dashboard</h1>
        <p className="text-gray-600">Manage payroll batches and generate payslips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Batches</div>
          <div className="text-3xl font-bold text-blue-600">{batches.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Gross Pay</div>
          <div className="text-3xl font-bold text-green-600">
            ${batches.reduce((sum, b) => sum + b.totalGrossPay, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Net Pay</div>
          <div className="text-3xl font-bold text-purple-600">
            ${batches.reduce((sum, b) => sum + b.totalNetPay, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Staff Paid</div>
          <div className="text-3xl font-bold text-orange-600">
            {batches.reduce((sum, b) => sum + b.staffCount, 0)}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Previous Month
          </button>
          <div className="text-lg font-bold">
            {format(selectedMonth, 'MMMM yyyy')}
          </div>
          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Current Month
          </button>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Payroll Batch
        </button>
      </div>

      {/* Payroll Batches */}
      <div className="space-y-4">
        {batches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium mb-2">No payroll batches for this month</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create first batch →
            </button>
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{batch.batchNumber}</h3>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Pay Period: {format(new Date(batch.payPeriodStart), 'dd MMM')} - {format(new Date(batch.payPeriodEnd), 'dd MMM yyyy')}
                  </div>
                  <div className="text-sm text-gray-600">
                    Pay Date: {format(new Date(batch.payDate), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    ${batch.totalNetPay.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Net Pay</div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Staff Count</div>
                  <div className="text-xl font-bold text-gray-800">{batch.staffCount}</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-sm text-gray-600">Gross Pay</div>
                  <div className="text-xl font-bold text-blue-600">${batch.totalGrossPay.toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-sm text-gray-600">Tax</div>
                  <div className="text-xl font-bold text-red-600">${batch.totalTax.toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <div className="text-sm text-gray-600">Super</div>
                  <div className="text-xl font-bold text-purple-600">${batch.totalSuper.toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-sm text-gray-600">Net Pay</div>
                  <div className="text-xl font-bold text-green-600">${batch.totalNetPay.toLocaleString()}</div>
                </div>
              </div>

              {batch.processedBy && (
                <div className="text-sm text-gray-600 mb-4 pb-4 border-b">
                  Processed by {batch.processedBy} on {batch.processedAt ? format(new Date(batch.processedAt), 'dd MMM yyyy HH:mm') : '-'}
                </div>
              )}

              <div className="flex gap-3">
                {batch.status === 'DRAFT' && (
                  <button
                    onClick={() => handleProcessBatch(batch.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Process Batch
                  </button>
                )}
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  View Details
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">
                  Download Report
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Create Payroll Batch</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-blue-800">
                    This will create a new payroll batch for all staff with approved timesheets in the selected period.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period Start
                </label>
                <input
                  type="date"
                  value={formData.payPeriodStart}
                  onChange={(e) => setFormData({ ...formData, payPeriodStart: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Period End
                </label>
                <input
                  type="date"
                  value={formData.payPeriodEnd}
                  onChange={(e) => setFormData({ ...formData, payPeriodEnd: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Date
                </label>
                <input
                  type="date"
                  value={formData.payDate}
                  onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
