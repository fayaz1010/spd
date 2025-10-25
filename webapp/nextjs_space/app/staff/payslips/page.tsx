'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Payslip {
  id: string;
  payslipNumber: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  taxWithheld: number;
  superannuation: number;
  netPay: number;
  paymentStatus: string;
  annualLeaveBalance: number | null;
  sickLeaveBalance: number | null;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, []);

  async function fetchPayslips() {
    try {
      const res = await fetch('/api/staff/payslips');
      const data = await res.json();
      
      if (data.success) {
        setPayslips(data.payslips);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-200 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-200 text-blue-800';
      case 'PAID': return 'bg-green-200 text-green-800';
      case 'FAILED': return 'bg-red-200 text-red-800';
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

  if (selectedPayslip) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedPayslip(null)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Payslips
        </button>

        <div className="bg-white rounded-lg shadow-lg border p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">Payslip</h1>
            <div className="text-gray-600">
              <div>Payslip Number: {selectedPayslip.payslipNumber}</div>
              <div>Pay Date: {format(new Date(selectedPayslip.payDate), 'dd MMMM yyyy')}</div>
              <div>
                Pay Period: {format(new Date(selectedPayslip.payPeriodStart), 'dd MMM')} - {format(new Date(selectedPayslip.payPeriodEnd), 'dd MMM yyyy')}
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Earnings</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Regular Hours ({selectedPayslip.regularHours.toFixed(1)}h)</span>
                <span className="font-semibold">${(selectedPayslip.regularHours * (selectedPayslip.grossPay / (selectedPayslip.regularHours + selectedPayslip.overtimeHours * 1.5))).toFixed(2)}</span>
              </div>
              {selectedPayslip.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span>Overtime Hours ({selectedPayslip.overtimeHours.toFixed(1)}h @ 1.5x)</span>
                  <span className="font-semibold">${(selectedPayslip.overtimeHours * 1.5 * (selectedPayslip.grossPay / (selectedPayslip.regularHours + selectedPayslip.overtimeHours * 1.5))).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between pt-3 border-t mt-3">
              <span className="font-semibold">Gross Pay</span>
              <span className="font-bold text-lg">${selectedPayslip.grossPay.toFixed(2)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Deductions</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tax Withheld</span>
                <span className="font-semibold text-red-600">-${selectedPayslip.taxWithheld.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between pt-3 border-t mt-3">
              <span className="font-semibold">Total Deductions</span>
              <span className="font-bold text-lg text-red-600">-${selectedPayslip.taxWithheld.toFixed(2)}</span>
            </div>
          </div>

          {/* Superannuation */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Superannuation</h2>
            <div className="flex justify-between">
              <span>Employer Contribution (11%)</span>
              <span className="font-semibold text-green-600">${selectedPayslip.superannuation.toFixed(2)}</span>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">Net Pay</span>
              <span className="text-3xl font-bold text-blue-600">${selectedPayslip.netPay.toFixed(2)}</span>
            </div>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded text-sm ${getStatusColor(selectedPayslip.paymentStatus)}`}>
                {selectedPayslip.paymentStatus}
              </span>
            </div>
          </div>

          {/* Leave Balances */}
          {(selectedPayslip.annualLeaveBalance !== null || selectedPayslip.sickLeaveBalance !== null) && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Leave Balances (as at pay date)</h2>
              <div className="grid grid-cols-2 gap-4">
                {selectedPayslip.annualLeaveBalance !== null && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Annual Leave</div>
                    <div className="text-xl font-bold">{selectedPayslip.annualLeaveBalance.toFixed(1)} days</div>
                  </div>
                )}
                {selectedPayslip.sickLeaveBalance !== null && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">Sick Leave</div>
                    <div className="text-xl font-bold">{selectedPayslip.sickLeaveBalance.toFixed(1)} days</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Payslips</h1>

      {payslips.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center text-gray-500">
          No payslips available yet
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Pay Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Pay Period</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Gross Pay</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Net Pay</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payslips.map((payslip) => (
                <tr key={payslip.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {format(new Date(payslip.payDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {format(new Date(payslip.payPeriodStart), 'dd MMM')} - {format(new Date(payslip.payPeriodEnd), 'dd MMM')}
                  </td>
                  <td className="px-6 py-4">
                    {(payslip.regularHours + payslip.overtimeHours).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    ${payslip.grossPay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    ${payslip.netPay.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(payslip.paymentStatus)}`}>
                      {payslip.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedPayslip(payslip)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
