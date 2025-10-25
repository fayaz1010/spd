'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  Navigation,
  Filter,
  Search,
  Zap,
  Battery,
  ArrowLeft
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
    batterySizeKwh?: number;
  };
}

export default function MobileJobsList() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('team_token');
      const response = await fetch('/api/team/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.lead.suburb.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'ON_SITE': return 'bg-purple-100 text-purple-800';
      case 'EN_ROUTE': return 'bg-orange-100 text-orange-800';
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

  const statusCounts = {
    ALL: jobs.length,
    SCHEDULED: jobs.filter(j => j.status === 'SCHEDULED').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'ON_SITE' || j.status === 'EN_ROUTE').length,
    COMPLETED: jobs.filter(j => j.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">All Jobs</h1>
              <p className="text-sm opacity-90">{filteredJobs.length} jobs</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, customers, suburbs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white border-b sticky top-[140px] z-10">
        <div className="flex overflow-x-auto no-scrollbar">
          {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-1 min-w-[100px] py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600'
              }`}
            >
              <div>{status.replace('_', ' ')}</div>
              <div className="text-xs mt-1">{statusCounts[status as keyof typeof statusCounts]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-4 space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">No jobs found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or search</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <Link 
              key={job.id} 
              href={`/mobile/installer/jobs/${job.id}`}
              className="block"
            >
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm active:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-blue-600 font-semibold mb-1">
                      {job.jobNumber}
                    </div>
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

                {/* System Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {job.lead.systemSizeKw}kW Solar
                  </div>
                  {job.lead.batterySizeKwh && (
                    <div className="flex items-center gap-1">
                      <Battery className="w-4 h-4" />
                      {job.lead.batterySizeKwh}kWh Battery
                    </div>
                  )}
                </div>

                {/* Schedule Info */}
                {job.scheduledDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(job.scheduledDate).toLocaleDateString('en-AU', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
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
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/mobile/installer" className="flex flex-col items-center py-2 text-gray-600">
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/mobile/installer/jobs" className="flex flex-col items-center py-2 text-blue-600">
            <Filter className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Jobs</span>
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
            <Filter className="w-6 h-6 mb-1" />
            <span className="text-xs">More</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
