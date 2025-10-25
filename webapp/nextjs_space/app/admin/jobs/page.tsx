
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle,
  CheckCircle,
  Briefcase,
  Search,
  Filter,
  Plus,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { AssignJobDialog } from '@/components/admin/AssignJobDialog';

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  schedulingDeadline: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number;
  siteSuburb: string | null;
  estimatedDuration: number;
  createdAt: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    quoteReference: string;
  };
  team: {
    id: string;
    name: string;
    color: string;
  } | null;
  subcontractor: {
    id: string;
    companyName: string;
    contactName: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_SCHEDULE: { label: 'Pending Schedule', color: 'bg-yellow-500', icon: Clock },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-500', icon: Calendar },
  PENDING_SUB_CONFIRM: { label: 'Awaiting Subcontractor', color: 'bg-orange-500', icon: AlertCircle },
  SUB_CONFIRMED: { label: 'Sub Confirmed', color: 'bg-green-500', icon: CheckCircle },
  MATERIALS_ORDERED: { label: 'Materials Ordered', color: 'bg-purple-500', icon: Briefcase },
  MATERIALS_READY: { label: 'Materials Ready', color: 'bg-indigo-500', icon: CheckCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-cyan-500', icon: Users },
  COMPLETED: { label: 'Completed', color: 'bg-green-600', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-500', icon: AlertCircle },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
    fetchTeams();
  }, [statusFilter, teamFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (teamFilter !== 'all') params.set('teamId', teamFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleSearch = () => {
    fetchJobs();
  };

  // Group jobs by status
  const urgentJobs = jobs.filter(job => {
    const deadline = new Date(job.schedulingDeadline);
    const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return job.status === 'PENDING_SCHEDULE' && daysUntil <= 3;
  });

  const unassignedJobs = jobs.filter(job => !job.team && !job.subcontractor);

  const pendingJobs = jobs.filter(job => 
    job.status === 'PENDING_SCHEDULE' || 
    job.status === 'PENDING_SUB_CONFIRM'
  );

  const activeJobs = jobs.filter(job => 
    job.status === 'SCHEDULED' || 
    job.status === 'MATERIALS_ORDERED' || 
    job.status === 'MATERIALS_READY' || 
    job.status === 'IN_PROGRESS'
  );

  const completedJobs = jobs.filter(job => job.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary">Installation Jobs</h1>
                <p className="text-sm text-gray-600">Manage and track all installation jobs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/jobs-kanban">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  Kanban View
                </Button>
              </Link>
              <Link href="/admin/leads?status=converted">
                <Button variant="outline">
                  View Converted Leads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Urgent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{urgentJobs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Deadline within 3 days</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Unassigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{unassignedJobs.length}</div>
              <p className="text-xs text-gray-500 mt-1">Need team assignment</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeJobs.length}</div>
              <p className="text-xs text-gray-500 mt-1">In progress or scheduled</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedJobs.length}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search jobs, customer, suburb..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTeamFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="pending">
              Pending ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({jobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <JobsList jobs={pendingJobs} loading={loading} onJobAssigned={fetchJobs} />
          </TabsContent>

          <TabsContent value="active">
            <JobsList jobs={activeJobs} loading={loading} onJobAssigned={fetchJobs} />
          </TabsContent>

          <TabsContent value="completed">
            <JobsList jobs={completedJobs} loading={loading} onJobAssigned={fetchJobs} />
          </TabsContent>

          <TabsContent value="all">
            <JobsList jobs={jobs} loading={loading} onJobAssigned={fetchJobs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function JobsList({ jobs, loading, onJobAssigned }: { jobs: Job[]; loading: boolean; onJobAssigned: () => void }) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No jobs found</p>
        </CardContent>
      </Card>
    );
  }

  const handleAssignClick = (e: React.MouseEvent, job: Job) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedJob(job);
    setAssignDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {jobs.map((job) => {
          const statusInfo = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING_SCHEDULE;
          const StatusIcon = statusInfo.icon;
          
          const deadline = new Date(job.schedulingDeadline);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isUrgent = job.status === 'PENDING_SCHEDULE' && daysUntilDeadline <= 3;

          const canAssign = ['PENDING_SCHEDULE', 'SCHEDULED'].includes(job.status);

          return (
            <Card key={job.id} className={`hover:shadow-lg transition-shadow ${isUrgent ? 'border-red-500 border-2' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/admin/jobs/${job.id}`} className="flex-1">
                    <div className="space-y-3 cursor-pointer">
                      {/* Header */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">{job.jobNumber}</h3>
                        <Badge className={`${statusInfo.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {isUrgent && (
                          <Badge className="bg-red-500 text-white">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{job.lead.name}</p>
                          <p className="text-sm text-gray-500">{job.lead.email}</p>
                          <p className="text-sm text-gray-500">{job.lead.phone}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{job.siteSuburb || 'Location TBD'}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{job.lead.address}</p>
                        </div>
                      </div>

                      {/* System Details */}
                      <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
                        <span>System: {job.systemSize}kW ({job.panelCount} panels)</span>
                        {job.batteryCapacity > 0 && (
                          <span>Battery: {job.batteryCapacity}kWh</span>
                        )}
                        <span>Duration: {job.estimatedDuration}h</span>
                      </div>

                      {/* Assignment */}
                      <div className="flex items-center gap-4 flex-wrap">
                        {job.team ? (
                          <Badge 
                            style={{ backgroundColor: job.team.color }} 
                            className="text-white"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            {job.team.name}
                          </Badge>
                        ) : job.subcontractor ? (
                          <Badge className="bg-purple-500 text-white">
                            {job.subcontractor.companyName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            Unassigned
                          </Badge>
                        )}

                        {job.scheduledDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions & Deadline */}
                  <div className="flex flex-col items-end gap-3">
                    {canAssign && (
                      <Button
                        size="sm"
                        onClick={(e) => handleAssignClick(e, job)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {job.team || job.subcontractor ? 'Reassign' : 'Assign'}
                      </Button>
                    )}
                    
                    {job.status === 'PENDING_SCHEDULE' && (
                      <div className={`text-right ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
                        <p className="text-sm font-medium">Deadline</p>
                        <p className="text-lg font-bold">
                          {daysUntilDeadline} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedJob && (
        <AssignJobDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          job={selectedJob}
          onSuccess={() => {
            onJobAssigned();
            setSelectedJob(null);
          }}
        />
      )}
    </>
  );
}
