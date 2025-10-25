'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface TrainingSession {
  id: string;
  staffId: string;
  staffName: string;
  trainingType: string;
  trainingProvider: string;
  trainingDate: string;
  completionDate: string | null;
  status: string;
  certificateUrl: string | null;
  notes: string | null;
}

export default function TrainingCalendarPage() {
  const router = useRouter();
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchTrainingSessions();
  }, [currentMonth]);

  async function fetchTrainingSessions() {
    try {
      const response = await fetch(`/api/admin/training?month=${format(currentMonth, 'yyyy-MM-dd')}`);
      
      if (response.ok) {
        const data = await response.json();
        setTrainingSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionsForDate = (date: Date) => {
    return trainingSessions.filter(session => 
      isSameDay(new Date(session.trainingDate), date)
    );
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const filteredSessions = filterStatus === 'all' 
    ? trainingSessions 
    : trainingSessions.filter(s => s.status === filterStatus);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Training Calendar</h1>
            <p className="text-gray-600">Schedule and track staff training sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Schedule Training
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
          <div className="text-3xl font-bold text-blue-600">{trainingSessions.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">
            {trainingSessions.filter(s => s.status === 'COMPLETED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Scheduled</div>
          <div className="text-3xl font-bold text-yellow-600">
            {trainingSessions.filter(s => s.status === 'SCHEDULED').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
          <div className="text-3xl font-bold text-purple-600">
            {trainingSessions.length > 0 
              ? Math.round((trainingSessions.filter(s => s.status === 'COMPLETED').length / trainingSessions.length) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-white shadow-sm' : ''
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'list' ? 'bg-white shadow-sm' : ''
              }`}
            >
              List
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <div className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded"
            >
              →
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Today
            </button>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-gray-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {daysInMonth.map((day, idx) => {
              const sessions = getSessionsForDate(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-b border-r p-2 ${
                    !isSameMonth(day, currentMonth) ? 'bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-semibold mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {sessions.slice(0, 3).map(session => (
                      <div
                        key={session.id}
                        className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(session.status)}`}
                        onClick={() => router.push(`/admin/dashboard/staff/${session.staffId}/training`)}
                        title={`${session.staffName} - ${session.trainingType}`}
                      >
                        {session.staffName.split(' ')[0]}
                      </div>
                    ))}
                    {sessions.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{sessions.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Training Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No training sessions found
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{session.staffName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">{session.trainingType}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">{session.trainingProvider}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">{format(new Date(session.trainingDate), 'dd MMM yyyy')}</div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => router.push(`/admin/dashboard/staff/${session.staffId}/training`)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Training Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Schedule Training</h3>
            <p className="text-gray-600 mb-4">Training scheduling form would go here</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
