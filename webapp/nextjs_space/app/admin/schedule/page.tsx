"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Truck,
  Wrench,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  deliveryDate: string | null;
  installationDate: string | null;
  systemSize: number;
  teamId: string | null;
  teamName: string | null;
  teamColor: string | null;
  customer: {
    name: string;
    address: string;
    phone: string | null;
  };
}

interface ScheduleData {
  jobs: Job[];
  deliveries: Job[];
  installations: Job[];
}

const statusColors: Record<string, string> = {
  PENDING_SCHEDULE: "#eab308",
  SCHEDULED: "#3b82f6",
  PENDING_SUB_CONFIRM: "#f97316",
  SUB_CONFIRMED: "#8b5cf6",
  MATERIALS_ORDERED: "#06b6d4",
  MATERIALS_READY: "#10b981",
  IN_PROGRESS: "#14b8a6",
  COMPLETED: "#22c55e",
  CANCELLED: "#6b7280",
};

const statusLabels: Record<string, string> = {
  PENDING_SCHEDULE: "Pending Schedule",
  SCHEDULED: "Scheduled",
  PENDING_SUB_CONFIRM: "Pending Sub Confirm",
  SUB_CONFIRMED: "Sub Confirmed",
  MATERIALS_ORDERED: "Materials Ordered",
  MATERIALS_READY: "Materials Ready",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function SchedulePage() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams.get('jobId');
  
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    jobs: [],
    deliveries: [],
    installations: [],
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  });
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [teams, setTeams] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [prefilledJob, setPrefilledJob] = useState<any>(null);
  const [showAddJobsModal, setShowAddJobsModal] = useState(false);
  const [readyJobs, setReadyJobs] = useState<any[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  // Fetch job details if jobId is provided in URL
  useEffect(() => {
    if (jobIdParam) {
      fetchJobDetails(jobIdParam);
    }
  }, [jobIdParam]);

  useEffect(() => {
    fetchScheduleData();
  }, [dateRange, filterTeam, filterStatus]);

  useEffect(() => {
    updateDateRange();
  }, [viewMode, selectedDate]);

  const fetchReadyJobs = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/jobs?status=READY_TO_SCHEDULE', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReadyJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching ready jobs:', error);
    }
  };

  const fetchJobDetails = async (jobId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const job = data.job; // API returns { job: {...} }
        console.log('Fetched job data:', job);
        setPrefilledJob(job);
        
        // Auto-set filter to the assigned team/subcontractor
        if (job.teamId) {
          setFilterTeam(job.teamId);
        } else if (job.subcontractorId) {
          setFilterTeam(`sub_${job.subcontractorId}`);
        }
        
        // If job has a scheduled date, jump to that week
        if (job.scheduledDate) {
          const scheduledDate = new Date(job.scheduledDate);
          setSelectedDate(scheduledDate);
          setDateRange({
            from: startOfWeek(scheduledDate),
            to: endOfWeek(scheduledDate),
          });
          toast.success(`Viewing week of ${job.jobNumber} (${scheduledDate.toLocaleDateString()})`);
        } else {
          toast.success(`Job ${job.jobNumber} loaded. Select date and time to schedule!`);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    }
  };

  const confirmSchedule = async () => {
    if (!prefilledJob || !selectedScheduleDate) return;

    try {
      const scheduledDateTime = new Date(selectedScheduleDate);
      const [hours, minutes] = selectedTime.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/jobs/${prefilledJob.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduledDate: scheduledDateTime.toISOString(),
          status: 'SCHEDULED'
        })
      });

      if (response.ok) {
        toast.success(`Job ${prefilledJob.jobNumber} scheduled for ${format(scheduledDateTime, 'PPP p')}`);
        setShowTimePickerModal(false);
        setPrefilledJob(null);
        fetchScheduleData();
        // Optionally redirect back
        // router.push(`/admin/leads/${prefilledJob.leadId}`);
      } else {
        throw new Error('Failed to schedule job');
      }
    } catch (error) {
      console.error('Error scheduling job:', error);
      toast.error('Failed to schedule job');
    }
  };

  const updateDateRange = () => {
    switch (viewMode) {
      case "day":
        setDateRange({ from: selectedDate, to: selectedDate });
        break;
      case "week":
        setDateRange({
          from: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          to: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        });
        break;
      case "month":
        setDateRange({
          from: startOfMonth(selectedDate),
          to: endOfMonth(selectedDate),
        });
        break;
    }
  };

  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");

      const params = new URLSearchParams({
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
      });

      if (filterTeam !== "all") params.append("teamId", filterTeam);
      if (filterStatus !== "all") params.append("status", filterStatus);

      const response = await fetch(`/api/admin/schedule?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScheduleData(data);
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    let newDate = new Date(selectedDate);
    switch (viewMode) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
    }
    setSelectedDate(newDate);
  };

  const getJobsForDate = (date: Date, type: "all" | "delivery" | "installation") => {
    const jobs = type === "delivery" 
      ? scheduleData.deliveries 
      : type === "installation" 
      ? scheduleData.installations 
      : scheduleData.jobs;

    return jobs.filter((job) => {
      const jobDate = job.deliveryDate || job.installationDate || job.scheduledDate;
      if (!jobDate) return false;
      return isSameDay(parseISO(jobDate), date);
    });
  };

  const renderDayView = () => {
    const deliveries = getJobsForDate(selectedDate, "delivery");
    const installations = getJobsForDate(selectedDate, "installation");

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Deliveries ({deliveries.length})
            </CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deliveries scheduled</p>
              ) : (
                deliveries.map((job) => (
                  <JobCard key={job.id} job={job} type="delivery" />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Installations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Installations ({installations.length})
            </CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {installations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No installations scheduled</p>
              ) : (
                installations.map((job) => (
                  <JobCard key={job.id} job={job} type="installation" />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(dateRange.from, i));
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const deliveries = getJobsForDate(day, "delivery");
          const installations = getJobsForDate(day, "installation");
          const isToday = isSameDay(day, new Date());
          const hasJobs = deliveries.length > 0 || installations.length > 0;

          return (
            <Card
              key={day.toISOString()}
              className={`${isToday ? "border-primary" : ""} ${
                hasJobs ? "cursor-pointer hover:shadow-md transition-shadow" : ""
              }`}
              onClick={() => {
                if (hasJobs) {
                  setSelectedDate(day);
                  setViewMode("day");
                }
              }}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm">
                  {format(day, "EEE")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(day, "MMM d")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {deliveries.length > 0 && (
                  <div className="text-xs">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Truck className="h-3 w-3" />
                      <span>{deliveries.length}</span>
                    </div>
                  </div>
                )}
                {installations.length > 0 && (
                  <div className="text-xs">
                    <div className="flex items-center gap-1 text-green-600">
                      <Wrench className="h-3 w-3" />
                      <span>{installations.length}</span>
                    </div>
                  </div>
                )}
                {deliveries.length === 0 && installations.length === 0 && (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);
    const days = [];
    
    let currentDate = startOfWeek(startDate, { weekStartsOn: 1 });
    const lastDate = endOfWeek(endDate, { weekStartsOn: 1 });

    while (currentDate <= lastDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center text-sm font-semibold p-2">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const deliveries = getJobsForDate(day, "delivery");
          const installations = getJobsForDate(day, "installation");
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
          const hasJobs = deliveries.length > 0 || installations.length > 0;
          const isScheduledDate = prefilledJob?.scheduledDate && isSameDay(parseISO(prefilledJob.scheduledDate), day);

          return (
            <Card
              key={day.toISOString()}
              className={`${isToday ? "border-primary" : ""} ${
                isScheduledDate ? "border-green-500 border-2 bg-green-50" : ""
              } ${
                !isCurrentMonth ? "opacity-50" : ""
              } ${
                hasJobs || prefilledJob ? "cursor-pointer hover:shadow-md transition-shadow" : ""
              }`}
              onClick={() => {
                if (prefilledJob) {
                  // If there's a prefilled job, open time picker
                  setSelectedScheduleDate(day);
                  // Pre-fill time if already scheduled
                  if (prefilledJob.scheduledDate) {
                    const scheduledTime = new Date(prefilledJob.scheduledDate);
                    const hours = scheduledTime.getHours().toString().padStart(2, '0');
                    const minutes = scheduledTime.getMinutes().toString().padStart(2, '0');
                    setSelectedTime(`${hours}:${minutes}`);
                  }
                  setShowTimePickerModal(true);
                } else if (hasJobs) {
                  setSelectedDate(day);
                  setViewMode("day");
                }
              }}
            >
              <CardContent className="p-2">
                <div className="text-sm font-semibold mb-1">
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {deliveries.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Truck className="h-3 w-3" />
                      <span>{deliveries.length}</span>
                    </div>
                  )}
                  {installations.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Wrench className="h-3 w-3" />
                      <span>{installations.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Operations Schedule
            </h1>
            <p className="text-muted-foreground">
              Manage deliveries and installations
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              fetchReadyJobs();
              setShowAddJobsModal(true);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Add Jobs
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Prefilled Job Alert */}
      {prefilledJob && (
        <Card className={`border-2 ${prefilledJob.scheduledDate ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${prefilledJob.scheduledDate ? 'text-green-900' : 'text-blue-900'}`}>
              {prefilledJob.scheduledDate ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {prefilledJob.scheduledDate ? 'Already Scheduled' : 'Ready to Schedule'}: {prefilledJob.jobNumber}
            </CardTitle>
            <CardDescription className={prefilledJob.scheduledDate ? 'text-green-700' : 'text-blue-700'}>
              {prefilledJob.scheduledDate 
                ? `Scheduled for ${format(new Date(prefilledJob.scheduledDate), 'PPP p')}. Click a date to reschedule.`
                : 'Select a date and time below, then confirm to add this job to the schedule.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Customer:</span>
                <p className="text-blue-900">{prefilledJob.lead?.name}</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">System:</span>
                <p className="text-blue-900">{prefilledJob.systemSize}kW</p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Installer:</span>
                <p className="text-blue-900">
                  {prefilledJob.team?.name || prefilledJob.subcontractor?.companyName || 'Not assigned'}
                </p>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Status:</span>
                <Badge className="bg-blue-600">{prefilledJob.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and View Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "day" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("day")}
              >
                Day
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Week
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Month
              </Button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold ml-2">
                {viewMode === "day" && format(selectedDate, "MMMM d, yyyy")}
                {viewMode === "week" &&
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`}
                {viewMode === "month" && format(selectedDate, "MMMM yyyy")}
              </span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 ml-auto">
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule View */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading schedule...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "day" && renderDayView()}
          {viewMode === "week" && renderWeekView()}
          {viewMode === "month" && renderMonthView()}
        </>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{scheduleData.jobs.length}</div>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {scheduleData.deliveries.length}
            </div>
            <p className="text-sm text-muted-foreground">Deliveries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {scheduleData.installations.length}
            </div>
            <p className="text-sm text-muted-foreground">Installations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {scheduleData.jobs.filter((j) => j.status === "IN_PROGRESS").length}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Jobs Modal */}
      <Dialog open={showAddJobsModal} onOpenChange={setShowAddJobsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Jobs to Schedule</DialogTitle>
            <DialogDescription>
              Select jobs ready to be scheduled.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {readyJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No jobs ready to schedule.
              </p>
            ) : (
              readyJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => {
                    setSelectedJobs(prev => 
                      prev.includes(job.id) 
                        ? prev.filter(id => id !== job.id)
                        : [...prev, job.id]
                    );
                  }}
                >
                  <Checkbox
                    checked={selectedJobs.includes(job.id)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{job.jobNumber}</p>
                    <p className="text-sm">{job.lead?.name} - {job.systemSize}kW</p>
                    <p className="text-sm text-muted-foreground">{job.team?.name || job.subcontractor?.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Picker Modal */}
      <Dialog open={showTimePickerModal} onOpenChange={setShowTimePickerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Installation</DialogTitle>
            <DialogDescription>
              Select time for {prefilledJob?.jobNumber} on {selectedScheduleDate && format(selectedScheduleDate, 'PPP')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Installation Time</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Job Details:</p>
              <p className="text-sm">Customer: {prefilledJob?.lead?.name}</p>
              <p className="text-sm">System: {prefilledJob?.systemSize}kW</p>
              <p className="text-sm">Installer: {prefilledJob?.team?.name || prefilledJob?.subcontractor?.companyName || 'Not assigned'}</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowTimePickerModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={confirmSchedule}
              >
                Confirm Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function JobCard({ job, type }: { job: Job; type: "delivery" | "installation" }) {
  return (
    <Link href={`/admin/jobs/${job.id}`} className="block">
      <div className="border rounded-lg p-3 hover:bg-accent hover:border-primary transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-semibold text-sm">{job.jobNumber}</div>
            <div className="text-xs text-muted-foreground">{job.customer.name}</div>
          </div>
          <Badge
            style={{
              backgroundColor: statusColors[job.status],
              color: "#ffffff",
            }}
          >
            {statusLabels[job.status]}
          </Badge>
        </div>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            {type === "delivery" ? (
              <Truck className="h-3 w-3" />
            ) : (
              <Wrench className="h-3 w-3" />
            )}
            <span>{job.systemSize}kW System</span>
          </div>
          {job.teamName && (
            <div
              className="inline-block px-2 py-0.5 rounded text-white text-xs"
              style={{ backgroundColor: job.teamColor || "#6b7280" }}
            >
              {job.teamName}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
