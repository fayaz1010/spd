'use client';

import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  address: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  assignedStaff: string[];
  requiredStaff: number;
  estimatedHours: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  available: boolean;
  skills: string[];
}

export default function SchedulingPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateWeekDays();
    fetchScheduleData();
  }, [selectedDate]);

  function generateWeekDays() {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    setWeekDays(days);
  }

  async function fetchScheduleData() {
    setLoading(true);
    try {
      // Mock data - would fetch from API
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
          assignedStaff: ['staff1', 'staff2'],
          requiredStaff: 2,
          estimatedHours: 4
        },
        {
          id: '2',
          jobNumber: 'JOB-2025-002',
          customerName: 'Sarah Williams',
          address: '456 Oak Ave, Perth WA',
          scheduledDate: format(new Date(), 'yyyy-MM-dd'),
          startTime: '13:00',
          endTime: '17:00',
          status: 'unassigned',
          assignedStaff: [],
          requiredStaff: 3,
          estimatedHours: 4
        }
      ];

      const mockStaff: StaffMember[] = [
        { id: 'staff1', name: 'Mike Johnson', role: 'Lead Installer', available: true, skills: ['Solar', 'Battery'] },
        { id: 'staff2', name: 'Tom Brown', role: 'Installer', available: true, skills: ['Solar'] },
        { id: 'staff3', name: 'Sarah Davis', role: 'Electrician', available: true, skills: ['Electrical', 'Solar'] },
        { id: 'staff4', name: 'James Wilson', role: 'Installer', available: false, skills: ['Solar', 'Roof'] }
      ];

      setJobs(mockJobs);
      setStaff(mockStaff);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }

  async function assignStaffToJob(jobId: string, staffIds: string[]) {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds })
      });

      if (response.ok) {
        alert('✓ Staff assigned successfully!');
        setShowAssignModal(false);
        fetchScheduleData();
      } else {
        alert('Failed to assign staff');
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('Failed to assign staff');
    }
  }

  function openAssignModal(job: Job) {
    setSelectedJob(job);
    setShowAssignModal(true);
  }

  const todayJobs = jobs.filter(job => 
    isSameDay(new Date(job.scheduledDate), selectedDate)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Job Scheduling</h1>
        <p className="text-gray-600">Assign staff to jobs and manage schedules</p>
      </div>

      {/* Week Selector */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">
              Week of {format(weekDays[0], 'dd MMM yyyy')}
            </h2>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto">
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const dayJobs = jobs.filter(job => isSameDay(new Date(job.scheduledDate), day));
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex-shrink-0 w-32 p-4 border-r last:border-r-0 hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50' : ''
                }`}
              >
                <div className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-2xl font-bold mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-600">{dayJobs.length} jobs</div>
                  {dayJobs.some(j => j.assignedStaff.length === 0) && (
                    <div className="text-xs text-red-600 font-medium mt-1">Unassigned</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs for Selected Date */}
      <div className="grid grid-cols-3 gap-6">
        {/* Jobs List */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">
                Jobs for {format(selectedDate, 'EEEE, dd MMMM')}
              </h3>
              <p className="text-sm text-gray-600">{todayJobs.length} jobs scheduled</p>
            </div>

            <div className="divide-y">
              {todayJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No jobs scheduled for this day</p>
                </div>
              ) : (
                todayJobs.map((job) => (
                  <div key={job.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs text-blue-600 font-semibold mb-1">
                          {job.jobNumber}
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {job.customerName}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {job.address}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.assignedStaff.length === 0
                          ? 'bg-red-100 text-red-800'
                          : job.assignedStaff.length < job.requiredStaff
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {job.assignedStaff.length === 0
                          ? 'UNASSIGNED'
                          : job.assignedStaff.length < job.requiredStaff
                          ? 'PARTIAL'
                          : 'ASSIGNED'
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <div className="text-gray-600">Time</div>
                        <div className="font-semibold">{job.startTime} - {job.endTime}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Duration</div>
                        <div className="font-semibold">{job.estimatedHours}h</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Staff Required</div>
                        <div className="font-semibold">
                          {job.assignedStaff.length} / {job.requiredStaff}
                        </div>
                      </div>
                    </div>

                    {job.assignedStaff.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">Assigned Staff:</div>
                        <div className="flex flex-wrap gap-2">
                          {job.assignedStaff.map((staffId) => {
                            const staffMember = staff.find(s => s.id === staffId);
                            return (
                              <div key={staffId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {staffMember?.name || staffId}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => openAssignModal(job)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      {job.assignedStaff.length === 0 ? 'Assign Staff' : 'Manage Assignment'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Staff Availability */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border sticky top-6">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">Staff Availability</h3>
              <p className="text-sm text-gray-600">{format(selectedDate, 'dd MMM')}</p>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {staff.map((member) => (
                <div key={member.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">{member.name}</div>
                      <div className="text-xs text-gray-600">{member.role}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      member.available ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Staff Modal */}
      {showAssignModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Assign Staff</h3>
                  <p className="text-sm text-gray-600">{selectedJob.jobNumber} - {selectedJob.customerName}</p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Required:</strong> {selectedJob.requiredStaff} staff members
                  <br />
                  <strong>Time:</strong> {selectedJob.startTime} - {selectedJob.endTime} ({selectedJob.estimatedHours}h)
                </div>
              </div>

              <div className="space-y-2">
                {staff.map((member) => {
                  const isAssigned = selectedJob.assignedStaff.includes(member.id);
                  
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        isAssigned ? 'border-blue-500 bg-blue-50' : ''
                      } ${!member.available ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        disabled={!member.available}
                        onChange={(e) => {
                          const newAssigned = e.target.checked
                            ? [...selectedJob.assignedStaff, member.id]
                            : selectedJob.assignedStaff.filter(id => id !== member.id);
                          setSelectedJob({ ...selectedJob, assignedStaff: newAssigned });
                        }}
                        className="w-5 h-5 text-blue-600"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.role}</div>
                          </div>
                          <div className={`text-xs font-medium ${
                            member.available ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {member.available ? 'Available' : 'Unavailable'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.skills.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => assignStaffToJob(selectedJob.id, selectedJob.assignedStaff)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
