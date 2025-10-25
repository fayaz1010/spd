'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

interface Timesheet {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: string;
  jobAllocations: any[];
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [currentTimesheet, setCurrentTimesheet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingWeek, setEditingWeek] = useState<Date | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  async function fetchTimesheets() {
    try {
      const res = await fetch('/api/staff/timesheets');
      const data = await res.json();
      
      if (data.success) {
        setTimesheets(data.timesheets);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveTimesheet() {
    setSaving(true);
    try {
      const res = await fetch('/api/staff/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTimesheet)
      });

      if (res.ok) {
        await fetchTimesheets();
        setEditingWeek(null);
        setCurrentTimesheet(null);
        alert('Timesheet saved successfully!');
      }
    } catch (error) {
      console.error('Error saving timesheet:', error);
      alert('Failed to save timesheet');
    } finally {
      setSaving(false);
    }
  }

  async function submitTimesheet(id: string) {
    if (!confirm('Submit this timesheet for approval?')) return;

    try {
      const res = await fetch(`/api/staff/timesheets/${id}/submit`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchTimesheets();
        alert('Timesheet submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Failed to submit timesheet');
    }
  }

  function startNewTimesheet() {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    setEditingWeek(weekStart);
    setCurrentTimesheet({
      weekStartDate: weekStart.toISOString(),
      regularHours: 0,
      overtimeHours: 0,
      doubleTimeHours: 0,
      publicHolidayHours: 0,
      travelAllowance: 0,
      toolAllowance: 0,
      mealAllowance: 0,
      otherAllowances: 0,
      jobAllocations: [],
      status: 'DRAFT'
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-200 text-blue-800';
      case 'APPROVED': return 'bg-green-200 text-green-800';
      case 'REJECTED': return 'bg-red-200 text-red-800';
      case 'PROCESSED': return 'bg-purple-200 text-purple-800';
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

  if (editingWeek) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingWeek(null);
              setCurrentTimesheet(null);
            }}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Timesheets
          </button>
          <h1 className="text-3xl font-bold">
            Timesheet for Week Starting {format(editingWeek, 'dd MMM yyyy')}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hours Worked</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Regular Hours</label>
              <input
                type="number"
                step="0.5"
                value={currentTimesheet?.regularHours || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  regularHours: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Overtime Hours (1.5x)</label>
              <input
                type="number"
                step="0.5"
                value={currentTimesheet?.overtimeHours || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  overtimeHours: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Double Time Hours (2x)</label>
              <input
                type="number"
                step="0.5"
                value={currentTimesheet?.doubleTimeHours || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  doubleTimeHours: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Public Holiday Hours (2.5x)</label>
              <input
                type="number"
                step="0.5"
                value={currentTimesheet?.publicHolidayHours || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  publicHolidayHours: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded">
            <div className="text-lg font-semibold">
              Total Hours: {
                (currentTimesheet?.regularHours || 0) +
                (currentTimesheet?.overtimeHours || 0) +
                (currentTimesheet?.doubleTimeHours || 0) +
                (currentTimesheet?.publicHolidayHours || 0)
              }
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Allowances</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Travel Allowance ($)</label>
              <input
                type="number"
                step="0.01"
                value={currentTimesheet?.travelAllowance || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  travelAllowance: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tool Allowance ($)</label>
              <input
                type="number"
                step="0.01"
                value={currentTimesheet?.toolAllowance || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  toolAllowance: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Meal Allowance ($)</label>
              <input
                type="number"
                step="0.01"
                value={currentTimesheet?.mealAllowance || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  mealAllowance: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Other Allowances ($)</label>
              <input
                type="number"
                step="0.01"
                value={currentTimesheet?.otherAllowances || 0}
                onChange={(e) => setCurrentTimesheet({
                  ...currentTimesheet,
                  otherAllowances: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveTimesheet}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Timesheet'}
          </button>
          <button
            onClick={() => {
              setEditingWeek(null);
              setCurrentTimesheet(null);
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Timesheets</h1>
        <button
          onClick={startNewTimesheet}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Timesheet
        </button>
      </div>

      {timesheets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-500 mb-4">No timesheets yet</p>
          <button
            onClick={startNewTimesheet}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Timesheet
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Week Starting</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Regular Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Overtime</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {format(new Date(ts.weekStartDate), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4">{ts.regularHours.toFixed(1)}</td>
                  <td className="px-6 py-4">{ts.overtimeHours.toFixed(1)}</td>
                  <td className="px-6 py-4 font-semibold">{ts.totalHours.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(ts.status)}`}>
                      {ts.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {ts.status === 'DRAFT' && (
                      <button
                        onClick={() => submitTimesheet(ts.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Submit
                      </button>
                    )}
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
