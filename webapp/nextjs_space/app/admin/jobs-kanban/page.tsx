
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AssignJobDialog } from '@/components/admin/assign-job-dialog';
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
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  DollarSign,
  Shield,
  Package,
  FileCheck,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

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

const KANBAN_COLUMNS = [
  { 
    key: 'DEPOSIT_PAID', 
    label: 'Deposit Paid', 
    color: 'bg-yellow-100 border-yellow-300',
    icon: DollarSign,
    iconColor: 'text-yellow-600'
  },
  { 
    key: 'APPLICATIONS_APPROVED', 
    label: 'Approvals Done', 
    color: 'bg-blue-100 border-blue-300',
    icon: Shield,
    iconColor: 'text-blue-600'
  },
  { 
    key: 'TEAM_ASSIGNED', 
    label: 'Team Assigned', 
    color: 'bg-purple-100 border-purple-300',
    icon: Users,
    iconColor: 'text-purple-600'
  },
  { 
    key: 'MATERIALS_ORDERED', 
    label: 'Materials', 
    color: 'bg-orange-100 border-orange-300',
    icon: Package,
    iconColor: 'text-orange-600'
  },
  { 
    key: 'SCHEDULED', 
    label: 'Scheduled', 
    color: 'bg-green-100 border-green-300',
    icon: Calendar,
    iconColor: 'text-green-600'
  },
  { 
    key: 'COMPLETED', 
    label: 'Completed', 
    color: 'bg-emerald-100 border-emerald-300',
    icon: CheckCircle,
    iconColor: 'text-emerald-600'
  },
  { 
    key: 'DOCUMENTATION_SUBMITTED', 
    label: 'Docs Done', 
    color: 'bg-indigo-100 border-indigo-300',
    icon: FileCheck,
    iconColor: 'text-indigo-600'
  },
];

export default function JobsKanbanPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [assignJobId, setAssignJobId] = useState<string | null>(null);
  const [assignJobNumber, setAssignJobNumber] = useState<string>('');

  useEffect(() => {
    fetchJobs();
    fetchTeams();
  }, [teamFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
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

  const getJobsByStatus = (status: string) => {
    return jobs.filter(job => job.status === status);
  };

  const handleAssignJob = (jobId: string, jobNumber: string) => {
    setAssignJobId(jobId);
    setAssignJobNumber(jobNumber);
  };

  const handleAssignSuccess = () => {
    fetchJobs(); // Refresh the jobs list
    setAssignJobId(null);
    setAssignJobNumber('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary">Job Board - Kanban View</h1>
                <p className="text-sm text-gray-600">Visual pipeline of all installation jobs</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/jobs">
                <Button variant="outline">
                  List View
                </Button>
              </Link>
              <Link href="/admin/leads">
                <Button variant="outline">
                  View All Leads
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  setTeamFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading jobs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-7 gap-3 min-w-[1400px]">
              {KANBAN_COLUMNS.map((column) => {
                const columnJobs = getJobsByStatus(column.key);
                const ColumnIcon = column.icon;

                return (
                  <div key={column.key} className="flex-shrink-0 w-80">
                    <Card className={`${column.color} border-2 h-full`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ColumnIcon className={`w-5 h-5 ${column.iconColor}`} />
                            <span className="text-sm font-bold">{column.label}</span>
                          </div>
                          <Badge className={`${column.iconColor} bg-white`}>
                            {columnJobs.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
                        {columnJobs.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            No jobs in this stage
                          </div>
                        ) : (
                          columnJobs.map((job) => (
                            <JobCard 
                              key={job.id} 
                              job={job} 
                              onClick={() => setSelectedJob(job)}
                              onAssign={handleAssignJob}
                            />
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}

      {/* Assign Job Dialog */}
      {assignJobId && (
        <AssignJobDialog
          open={true}
          onClose={() => {
            setAssignJobId(null);
            setAssignJobNumber('');
          }}
          jobId={assignJobId}
          jobNumber={assignJobNumber}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}

function JobCard({ job, onClick, onAssign }: { job: Job; onClick: () => void; onAssign: (jobId: string, jobNumber: string) => void }) {
  const deadline = new Date(job.schedulingDeadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isUrgent = job.status === 'PENDING_SCHEDULE' && daysUntilDeadline <= 3;
  const isUnassigned = !job.team && !job.subcontractor;

  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the detail modal
    onAssign(job.id, job.jobNumber);
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all border ${isUrgent ? 'border-red-500 border-2' : 'border-gray-200'} bg-white`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Job Number & Urgent Badge */}
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-900 text-sm">{job.jobNumber}</h4>
          {isUrgent && (
            <Badge className="bg-red-500 text-white text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {daysUntilDeadline}d
            </Badge>
          )}
        </div>

        {/* Customer Name */}
        <p className="font-medium text-gray-800 text-sm">{job.lead.name}</p>

        {/* System Details */}
        <div className="space-y-1 text-xs text-gray-600">
          <div>🔆 {job.systemSize}kW ({job.panelCount} panels)</div>
          {job.batteryCapacity > 0 && (
            <div>🔋 {job.batteryCapacity}kWh</div>
          )}
          <div>⏱️ {job.estimatedDuration}h</div>
        </div>

        {/* Location */}
        {job.siteSuburb && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{job.siteSuburb}</span>
          </div>
        )}

        {/* Team Assignment */}
        <div className="pt-2 border-t border-gray-200">
          {job.team ? (
            <Badge 
              style={{ backgroundColor: job.team.color }} 
              className="text-white text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              {job.team.name}
            </Badge>
          ) : job.subcontractor ? (
            <Badge className="bg-purple-500 text-white text-xs">
              {job.subcontractor.companyName}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">
              Unassigned
            </Badge>
          )}
        </div>

        {/* Assign Button for Unassigned Jobs */}
        {isUnassigned && (job.status === 'PENDING_SCHEDULE' || job.status === 'SCHEDULED') && (
          <Button 
            size="sm" 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs"
            onClick={handleAssignClick}
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Assign Job
          </Button>
        )}

        {/* Scheduled Date */}
        {job.scheduledDate && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-2xl font-bold">{job.jobNumber}</span>
            <Link href={`/admin/jobs/${job.id}`} target="_blank">
              <Button size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Details
              </Button>
            </Link>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Customer</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{job.lead.name}</p>
              <p className="text-gray-600">{job.lead.email}</p>
              <p className="text-gray-600">{job.lead.phone}</p>
              <p className="text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {job.lead.address}
              </p>
            </div>
          </div>

          {/* System Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">System Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">System Size</p>
                <p className="font-medium">{job.systemSize} kW</p>
              </div>
              <div>
                <p className="text-gray-600">Panel Count</p>
                <p className="font-medium">{job.panelCount} panels</p>
              </div>
              {job.batteryCapacity > 0 && (
                <div>
                  <p className="text-gray-600">Battery Capacity</p>
                  <p className="font-medium">{job.batteryCapacity} kWh</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Estimated Duration</p>
                <p className="font-medium">{job.estimatedDuration} hours</p>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assignment</h3>
            {job.team ? (
              <Badge 
                style={{ backgroundColor: job.team.color }} 
                className="text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                {job.team.name}
              </Badge>
            ) : job.subcontractor ? (
              <Badge className="bg-purple-500 text-white">
                {job.subcontractor.companyName} ({job.subcontractor.contactName})
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                Not yet assigned
              </Badge>
            )}
          </div>

          {/* Schedule */}
          {job.scheduledDate && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Schedule</h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium">
                  {new Date(job.scheduledDate).toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Link href={`/admin/jobs/${job.id}`} className="flex-1">
              <Button className="w-full">
                View Full Job Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
