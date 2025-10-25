'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';

interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  address: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  teamMembers: string[];
}

export default function MobileSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateWeekDays();
    fetchSchedule();
  }, [selectedDate]);

  function generateWeekDays() {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    setWeekDays(days);
  }

  async function fetchSchedule() {
    setLoading(true);
    try {
      // This would fetch actual schedule data
      // For now, using mock data
      const mockJobs: Job[] = [
        {
          id: '1',
          jobNumber: 'JOB-2025-001',
          customerName: 'John Smith',
          address: '123 Main St, Perth WA',
          scheduledDate: format(new Date(), 'yyyy-MM-dd'),
          startTime: '08:00',
          endTime: '12:00',
          status: 'scheduled',
          teamMembers: ['You', 'Mike Johnson']
        },
        {
          id: '2',
          jobNumber: 'JOB-2025-002',
          customerName: 'Sarah Williams',
          address: '456 Oak Ave, Perth WA',
          scheduledDate: format(new Date(), 'yyyy-MM-dd'),
          startTime: '13:00',
          endTime: '17:00',
          status: 'scheduled',
          teamMembers: ['You', 'Mike Johnson', 'Tom Brown']
        }
      ];
      setJobs(mockJobs);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  const todayJobs = jobs.filter(job => 
    isSameDay(new Date(job.scheduledDate), selectedDate)
  );

  function openInMaps(address: string) {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-1">My Schedule</h1>
        <p className="text-blue-100 text-sm">{format(selectedDate, 'MMMM yyyy')}</p>
      </div>

      {/* Week Selector */}
      <div className="bg-white border-b sticky top-[72px] z-10">
        <div className="flex overflow-x-auto">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 w-16 py-3 text-center border-b-2 transition-colors ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                <div className={`text-xs font-medium ${
                  isSelected ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold mt-1 ${
                  isCurrentDay
                    ? 'text-blue-600'
                    : isSelected
                    ? 'text-blue-600'
                    : 'text-gray-800'
                }`}>
                  {format(day, 'd')}
                </div>
                {isCurrentDay && (
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mx-auto mt-1"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {format(selectedDate, 'EEEE, dd MMMM')}
          </h2>
          <p className="text-sm text-gray-600">
            {todayJobs.length} {todayJobs.length === 1 ? 'job' : 'jobs'} scheduled
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : todayJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No jobs scheduled</p>
            <p className="text-sm text-gray-500 mt-1">Enjoy your day off!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Job Header */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-white border-b">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-blue-600 font-semibold mb-1">
                        {job.jobNumber}
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {job.customerName}
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {job.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="p-4 space-y-3">
                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Time</div>
                      <div className="font-semibold text-gray-800">
                        {job.startTime} - {job.endTime}
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Location</div>
                      <div className="font-medium text-gray-800">{job.address}</div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Team</div>
                      <div className="font-medium text-gray-800">
                        {job.teamMembers.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t flex gap-2">
                  <button
                    onClick={() => openInMaps(job.address)}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Navigate
                  </button>
                  <button
                    onClick={() => window.location.href = `/mobile/clock`}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Clock In
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          <a href="/mobile/schedule" className="p-3 text-center text-blue-600">
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
          <a href="/mobile/leave" className="p-3 text-center text-gray-600">
            <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs font-medium">Leave</div>
          </a>
        </div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="h-20"></div>
    </div>
  );
}
