'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Zap,
  Battery,
  ArrowLeft,
  Clock,
  Users,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  installationDate: string | null;
  systemSize: number;
  customer: {
    name: string;
    address: string;
    phone: string | null;
  };
  team: {
    name: string;
    members: Array<{ name: string; role: string }>;
  } | null;
}

const statusColors: Record<string, string> = {
  PENDING_SCHEDULE: 'bg-yellow-100 text-yellow-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  PENDING_SUB_CONFIRM: 'bg-orange-100 text-orange-800',
  SUB_CONFIRMED: 'bg-purple-100 text-purple-800',
  MATERIALS_ORDERED: 'bg-cyan-100 text-cyan-800',
  MATERIALS_READY: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  PENDING_SCHEDULE: 'Pending Schedule',
  SCHEDULED: 'Scheduled',
  PENDING_SUB_CONFIRM: 'Pending Sub Confirm',
  SUB_CONFIRMED: 'Sub Confirmed',
  MATERIALS_ORDERED: 'Materials Ordered',
  MATERIALS_READY: 'Materials Ready',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function TeamSchedulePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [weekStart, user]);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const params = new URLSearchParams({
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
      });

      const response = await fetch(`/api/team/schedule?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = addDays(weekStart, direction === 'next' ? 7 : -7);
    setWeekStart(newWeekStart);
  };

  const getJobsForDate = (date: Date) => {
    return jobs.filter((job) => {
      const jobDate = job.installationDate || job.scheduledDate;
      if (!jobDate) return false;
      return isSameDay(parseISO(jobDate), date);
    });
  };

  const getDaysOfWeek = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  };

  const getTotalHoursForWeek = () => {
    // Estimate 8 hours per job
    return jobs.length * 8;
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  const daysOfWeek = getDaysOfWeek();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/team/jobs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary flex items-center">
                  <CalendarIcon className="h-6 w-6 mr-2" />
                  My Schedule
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.name} • {user?.teamName || 'No Team'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {format(weekStart, 'MMMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {jobs.length} jobs • {getTotalHoursForWeek()} estimated hours
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
              }}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysOfWeek.map((day) => {
            const dayJobs = getJobsForDate(day);
            const isDayToday = isToday(day);

            return (
              <Card key={day.toISOString()} className={isDayToday ? 'ring-2 ring-coral' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {format(day, 'EEE')}
                  </CardTitle>
                  <CardDescription className={isDayToday ? 'text-coral font-semibold' : ''}>
                    {format(day, 'd MMM')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayJobs.length === 0 ? (
                    <p className="text-xs text-gray-500">No jobs</p>
                  ) : (
                    dayJobs.map((job) => (
                      <Link key={job.id} href={`/team/jobs/${job.id}`}>
                        <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-900">
                              {job.jobNumber}
                            </p>
                            <Badge className={`text-xs ${statusColors[job.status] || 'bg-gray-100'}`}>
                              {statusLabels[job.status] || job.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            {job.customer.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{job.customer.address}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Zap className="h-3 w-3" />
                            <span>{job.systemSize}kW System</span>
                          </div>
                          {job.team && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Users className="h-3 w-3" />
                              <span>{job.team.members.length} team members</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{jobs.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total Jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Estimated Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{getTotalHoursForWeek()}</p>
              <p className="text-xs text-gray-500 mt-1">Work Hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {jobs.filter(j => j.status === 'IN_PROGRESS').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active Jobs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {jobs.filter(j => j.status === 'SCHEDULED' || j.status === 'MATERIALS_READY').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Upcoming Jobs</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
