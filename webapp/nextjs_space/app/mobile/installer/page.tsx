'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserGuide } from '@/components/installer/UserGuide';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Navigation,
  Camera,
  ClipboardList,
  Zap,
  Wrench,
  Menu,
  Bell,
  User,
  LogOut,
  BookOpen
} from 'lucide-react';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  lead: {
    name: string;
    address: string;
    suburb: string;
    phone: string;
    systemSizeKw: number;
  };
}

export default function MobileInstallerDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [todayJobs, setTodayJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [stats, setStats] = useState({
    todayJobs: 0,
    completedThisWeek: 0,
    inProgress: 0,
    upcoming: 0
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Support multiple token types (installer_token, team_token, auth_token, admin_token)
      const token = localStorage.getItem('installer_token') ||
                    localStorage.getItem('auth_token') || 
                    localStorage.getItem('team_token') || 
                    localStorage.getItem('admin_token');
      
      if (!token) {
        router.push('/installer');
        return;
      }
      
      const response = await fetch('/api/installer/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
        
        // Filter today's jobs
        const today = new Date().toISOString().split('T')[0];
        const todaysJobs = (data.jobs || []).filter((job: Job) => 
          job.scheduledDate?.startsWith(today)
        );
        setTodayJobs(todaysJobs);

        // Calculate stats
        setStats({
          todayJobs: todaysJobs.length,
          completedThisWeek: (data.jobs || []).filter((j: Job) => j.status === 'COMPLETED').length,
          inProgress: (data.jobs || []).filter((j: Job) => j.status === 'IN_PROGRESS').length,
          upcoming: (data.jobs || []).filter((j: Job) => j.status === 'SCHEDULED').length
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'ON_SITE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4" />;
      case 'IN_PROGRESS': return <Clock className="w-4 h-4" />;
      case 'ON_SITE': return <MapPin className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm opacity-90">Installer Portal</div>
                <div className="font-semibold">Welcome Back</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowGuide(true)}
                className="p-2 hover:bg-white/10 rounded-lg"
                title="User Guide"
              >
                <BookOpen className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('team_token');
                  router.push('/login');
                }}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.todayJobs}</div>
              <div className="text-xs opacity-90">Today</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <div className="text-xs opacity-90">Active</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
              <div className="text-xs opacity-90">Done</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{stats.upcoming}</div>
              <div className="text-xs opacity-90">Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Today's Jobs */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Jobs
          </h2>

          {todayJobs.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No jobs scheduled for today</p>
              <p className="text-sm text-gray-500 mt-1">Check upcoming jobs below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <Link 
                  key={job.id} 
                  href={`/mobile/installer/jobs/${job.id}/wizard`}
                  className="block"
                >
                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm active:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">{job.lead.name}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.lead.suburb}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(job.status)}`}>
                        {getStatusIcon(job.status)}
                        {job.status.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {(job.lead as any).systemSizeKw}kW
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.scheduledDate).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `tel:${job.lead.phone}`;
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `https://maps.google.com/?q=${encodeURIComponent(job.lead.address + ', ' + job.lead.suburb)}`;
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                      >
                        <Navigation className="w-4 h-4" />
                        Navigate
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* User Guide Card */}
            <button
              onClick={() => setShowGuide(true)}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 border-2 border-blue-400 text-white text-center hover:shadow-lg transition-shadow col-span-2"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="font-bold">📖 How to Use This App</div>
              <div className="text-xs opacity-90 mt-1">7-stage workflow guide</div>
            </button>

            <Link href="/mobile/clock">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="font-medium text-gray-900">Clock In/Out</div>
                <div className="text-xs text-gray-500 mt-1">Attendance</div>
              </div>
            </Link>

            <Link href="/mobile/installer/jobs">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <div className="font-medium text-gray-900">All Jobs</div>
                <div className="text-xs text-gray-500 mt-1">{jobs.length} total</div>
              </div>
            </Link>

            <Link href="/mobile/installer/service">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
                <div className="font-medium text-gray-900">Service Jobs</div>
                <div className="text-xs text-gray-500 mt-1">Maintenance</div>
              </div>
            </Link>

            <Link href="/mobile/installer/checklists">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="font-medium text-gray-900">Checklists</div>
                <div className="text-xs text-gray-500 mt-1">Templates</div>
              </div>
            </Link>

            <Link href="/mobile/timesheets">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClipboardList className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="font-medium text-gray-900">Timesheets</div>
                <div className="text-xs text-gray-500 mt-1">View hours</div>
              </div>
            </Link>

            <Link href="/mobile/leave">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="font-medium text-gray-900">Leave</div>
                <div className="text-xs text-gray-500 mt-1">Request leave</div>
              </div>
            </Link>

            <Link href="/mobile/schedule">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
                <div className="font-medium text-gray-900">Schedule</div>
                <div className="text-xs text-gray-500 mt-1">View calendar</div>
              </div>
            </Link>

            <Link href="/mobile/installer/scan">
              <div className="bg-white rounded-xl p-4 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Camera className="w-6 h-6 text-teal-600" />
                </div>
                <div className="font-medium text-gray-900">Scan Panel</div>
                <div className="text-xs text-gray-500 mt-1">Serial validation</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Jobs</h2>
          <div className="space-y-2">
            {jobs
              .filter(job => job.status === 'SCHEDULED' && !todayJobs.find(tj => tj.id === job.id))
              .slice(0, 5)
              .map((job) => (
                <Link 
                  key={job.id} 
                  href={`/mobile/installer/jobs/${job.id}/wizard`}
                  className="block bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{job.lead.name}</div>
                      <div className="text-xs text-gray-500">{job.lead.suburb}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(job.scheduledDate).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">{job.lead.systemSizeKw}kW</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-blue-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-gray-600">
            <ClipboardList className="w-6 h-6 mb-1" />
            <span className="text-xs">Jobs</span>
          </Link>
          <Link href="/mobile/clock" className="flex flex-col items-center py-2 text-gray-600">
            <Clock className="w-6 h-6 mb-1" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/mobile/schedule" className="flex flex-col items-center py-2 text-gray-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs">Schedule</span>
          </Link>
          <Link href="/mobile/timesheets" className="flex flex-col items-center py-2 text-gray-600">
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>

      {/* User Guide Modal */}
      {showGuide && <UserGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
}
