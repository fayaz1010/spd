'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  MapPin,
  Zap,
  Battery,
  Clock,
  User,
  ArrowRight,
  Search,
  LogOut,
} from 'lucide-react';
import { formatDate } from '@/lib/blog/utils';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  lead: {
    name: string;
    address: string;
    suburb: string;
    phone: string;
    systemSizeKw: number;
    batterySizeKwh: number;
  };
  team: {
    name: string;
    members: any[];
  } | null;
}

export default function TeamJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, statusFilter, searchQuery]);

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

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/team/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.jobNumber.toLowerCase().includes(query) ||
        job.lead.name.toLowerCase().includes(query) ||
        job.lead.address.toLowerCase().includes(query) ||
        job.lead.suburb.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary">My Jobs</h1>
              {user && (
                <p className="text-sm text-gray-600">
                  {user.name} - {user.role === 'TEAM_MEMBER' ? 'Team Member' : 'Admin'}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by job number, customer, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Jobs</CardDescription>
              <CardTitle className="text-3xl">{jobs.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Scheduled</CardDescription>
              <CardTitle className="text-3xl">
                {jobs.filter(j => j.status === 'scheduled').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-3xl">
                {jobs.filter(j => j.status === 'in_progress').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Completed</CardDescription>
              <CardTitle className="text-3xl">
                {jobs.filter(j => j.status === 'completed').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{job.jobNumber}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusLabel(job.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">{job.lead.name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{job.lead.address}, {job.lead.suburb}</span>
                      </div>
                    </div>
                    <Link href={`/team/jobs/${job.id}`}>
                      <Button>
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Scheduled</p>
                        <p className="font-medium">
                          {job.scheduledDate ? formatDate(new Date(job.scheduledDate)) : 'Not scheduled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <Zap className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-gray-500">System Size</p>
                        <p className="font-medium">{job.lead.systemSizeKw}kW</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <Battery className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Battery</p>
                        <p className="font-medium">
                          {job.lead.batterySizeKwh > 0 ? `${job.lead.batterySizeKwh}kWh` : 'None'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
