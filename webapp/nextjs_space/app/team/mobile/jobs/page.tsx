'use client';

import { useState, useEffect } from 'react';
import { MobileNav } from '@/components/mobile/MobileNav';
import { MobileJobCard } from '@/components/mobile/MobileJobCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar } from 'lucide-react';

export default function MobileJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, statusFilter, dateFilter]);

  const fetchJobs = async () => {
    try {
      // In production, get team member ID from auth
      const response = await fetch('/api/team/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.suburb?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(job => 
        job.scheduledDate && new Date(job.scheduledDate).toDateString() === today
      );
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      filtered = filtered.filter(job =>
        job.scheduledDate && new Date(job.scheduledDate) <= weekFromNow
      );
    }

    setFilteredJobs(filtered);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (lat?: number, lng?: number, address?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await fetch(`/api/team/jobs/${jobId}/start`, {
        method: 'POST',
      });
      fetchJobs();
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const getJobCounts = () => {
    return {
      all: jobs.length,
      scheduled: jobs.filter(j => j.status === 'SCHEDULED').length,
      inProgress: jobs.filter(j => j.status === 'IN_PROGRESS').length,
      today: jobs.filter(j => {
        const today = new Date().toDateString();
        return j.scheduledDate && new Date(j.scheduledDate).toDateString() === today;
      }).length,
    };
  };

  const counts = getJobCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileNav />
        <div className="p-4 text-center">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <MobileNav />

      {/* Header Stats */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold mb-4">My Jobs</h1>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{counts.all}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{counts.today}</div>
            <div className="text-xs text-gray-600">Today</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{counts.scheduled}</div>
            <div className="text-xs text-gray-600">Scheduled</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{counts.inProgress}</div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job List */}
      <div className="p-4 space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found</p>
            <p className="text-sm text-gray-400 mt-2">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No jobs assigned yet'}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <MobileJobCard
              key={job.id}
              job={job}
              onCall={() => handleCall(job.customerPhone)}
              onNavigate={() => handleNavigate(job.siteLatitude, job.siteLongitude, job.address)}
              onStartJob={() => handleStartJob(job.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
