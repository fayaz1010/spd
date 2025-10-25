'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameWeek } from 'date-fns';

export default function MobileTimesheetsPage() {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timesheet, setTimesheet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchTimesheet();
  }, [selectedWeek]);

  async function fetchTimesheet() {
    setLoading(true);
    try {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
      
      // Mock data - would fetch from API
      const mockTimesheet = {
        id: '1',
        weekStartDate: weekStart,
        weekEndDate: addDays(weekStart, 6),
        status: 'DRAFT',
        regularHours: 38,
        overtimeHours: 4,
        totalHours: 42,
        days: [
          { date: addDays(weekStart, 0), regularHours: 8, overtimeHours: 0 },
          { date: addDays(weekStart, 1), regularHours: 8, overtimeHours: 1 },
          { date: addDays(weekStart, 2), regularHours: 8, overtimeHours: 1 },
          { date: addDays(weekStart, 3), regularHours: 8, overtimeHours: 2 },
          { date: addDays(weekStart, 4), regularHours: 6, overtimeHours: 0 },
          { date: addDays(weekStart, 5), regularHours: 0, overtimeHours: 0 },
          { date: addDays(weekStart, 6), regularHours: 0, overtimeHours: 0 }
        ]
      };
      
      setTimesheet(mockTimesheet);
    } catch (error) {
      console.error('Error fetching timesheet:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!timesheet) return;
    
    try {
      const response = await fetch('/api/staff/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...timesheet,
          status: 'SUBMITTED'
        })
      });

      if (response.ok) {
        alert('✓ Timesheet submitted successfully!');
        setTimesheet({ ...timesheet, status: 'SUBMITTED' });
        setEditing(false);
      } else {
        alert('Failed to submit timesheet');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Failed to submit timesheet');
    }
  }

  function updateDayHours(dayIndex: number, field: string, value: number) {
    if (!timesheet) return;
    
    const newDays = [...timesheet.days];
    newDays[dayIndex] = { ...newDays[dayIndex], [field]: value };
    
    const regularHours = newDays.reduce((sum, day) => sum + day.regularHours, 0);
    const overtimeHours = newDays.reduce((sum, day) => sum + day.overtimeHours, 0);
    
    setTimesheet({
      ...timesheet,
      days: newDays,
      regularHours,
      overtimeHours,
      totalHours: regularHours + overtimeHours
    });
  }

  function previousWeek() {
    setSelectedWeek(addDays(selectedWeek, -7));
  }

  function nextWeek() {
    setSelectedWeek(addDays(selectedWeek, 7));
  }

  function thisWeek() {
    setSelectedWeek(new Date());
  }

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = isSameWeek(new Date(), selectedWeek, { weekStartsOn: 1 });
  const canEdit = timesheet?.status === 'DRAFT' || timesheet?.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-1">Timesheet</h1>
        <p className="text-blue-100 text-sm">Track your weekly hours</p>
      </div>

      {/* Week Selector */}
      <div className="bg-white border-b p-4 sticky top-[72px] z-10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="font-bold text-gray-800">
              {format(weekStart, 'dd MMM')} - {format(weekEnd, 'dd MMM yyyy')}
            </div>
            {isCurrentWeek && (
              <div className="text-xs text-blue-600 font-medium">Current Week</div>
            )}
          </div>
          
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {!isCurrentWeek && (
          <button
            onClick={thisWeek}
            className="w-full py-2 text-blue-600 text-sm font-medium"
          >
            Jump to Current Week
          </button>
        )}
      </div>

      {/* Status Badge */}
      {timesheet && (
        <div className="p-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            timesheet.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
            timesheet.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
            timesheet.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            timesheet.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              timesheet.status === 'DRAFT' ? 'bg-gray-600' :
              timesheet.status === 'SUBMITTED' ? 'bg-blue-600' :
              timesheet.status === 'APPROVED' ? 'bg-green-600' :
              timesheet.status === 'REJECTED' ? 'bg-red-600' :
              'bg-gray-600'
            }`}></div>
            {timesheet.status}
          </div>
        </div>
      )}

      {/* Hours Summary */}
      {timesheet && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Weekly Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {timesheet.regularHours}
                </div>
                <div className="text-xs text-blue-600 mt-1">Regular</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">
                  {timesheet.overtimeHours}
                </div>
                <div className="text-xs text-orange-600 mt-1">Overtime</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  {timesheet.totalHours}
                </div>
                <div className="text-xs text-green-600 mt-1">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Hours */}
      {loading ? (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading timesheet...</p>
          </div>
        </div>
      ) : timesheet ? (
        <div className="px-4 space-y-3">
          {timesheet.days.map((day: any, index: number) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-800">
                    {format(day.date, 'EEEE')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(day.date, 'dd MMM')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">
                    {day.regularHours + day.overtimeHours}h
                  </div>
                </div>
              </div>

              {editing && canEdit ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Regular Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={day.regularHours}
                      onChange={(e) => updateDayHours(index, 'regularHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Overtime</label>
                    <input
                      type="number"
                      min="0"
                      max="8"
                      step="0.5"
                      value={day.overtimeHours}
                      onChange={(e) => updateDayHours(index, 'overtimeHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg text-center font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 text-sm">
                  <div className="flex-1">
                    <span className="text-gray-600">Regular:</span>
                    <span className="font-semibold ml-2">{day.regularHours}h</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-600">OT:</span>
                    <span className="font-semibold ml-2">{day.overtimeHours}h</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No timesheet for this week</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {timesheet && canEdit && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl shadow-lg font-bold text-lg active:scale-95 transition-transform"
            >
              Edit Hours
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-green-600 text-white rounded-2xl shadow-lg font-bold text-lg active:scale-95 transition-transform"
              >
                Submit Timesheet
              </button>
              <button
                onClick={() => setEditing(false)}
                className="w-full py-3 bg-gray-100 text-gray-800 rounded-2xl font-semibold active:scale-95 transition-transform"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {timesheet && timesheet.status === 'SUBMITTED' && (
        <div className="px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-2">
              <div className="text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                Your timesheet has been submitted and is awaiting approval.
              </div>
            </div>
          </div>
        </div>
      )}

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
          <a href="/mobile/timesheets" className="p-3 text-center text-blue-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="text-xs font-medium">Timesheet</div>
          </a>
          <a href="/mobile/leave" className="p-3 text-center text-gray-600">
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
