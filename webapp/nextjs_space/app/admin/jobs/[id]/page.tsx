
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Package,
  Battery,
  Zap,
  Users,
  FileText,
  CheckCircle,
  AlertCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { JobAssignmentCard } from '@/components/admin/JobAssignmentCard';

const STATUS_OPTIONS = [
  { value: 'PENDING_SCHEDULE', label: 'Pending Schedule' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'PENDING_SUB_CONFIRM', label: 'Awaiting Subcontractor' },
  { value: 'SUB_CONFIRMED', label: 'Sub Confirmed' },
  { value: 'MATERIALS_ORDERED', label: 'Materials Ordered' },
  { value: 'MATERIALS_READY', label: 'Materials Ready' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Form state
  const [status, setStatus] = useState('');
  const [teamId, setTeamId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  
  // Time tracking state
  const [actualStartTime, setActualStartTime] = useState('');
  const [actualEndTime, setActualEndTime] = useState('');
  const [breakHours, setBreakHours] = useState('0.5');
  
  // Quality tracking state
  const [qualityScore, setQualityScore] = useState('');
  const [issuesFound, setIssuesFound] = useState('0');
  const [qualityCheckPassed, setQualityCheckPassed] = useState(false);
  const [callbackRequired, setCallbackRequired] = useState(false);
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Calculated values
  const [actualHours, setActualHours] = useState(0);
  const [netWorkHours, setNetWorkHours] = useState(0);
  const [standardTotalHours, setStandardTotalHours] = useState(0);
  const [actualHoursPerKw, setActualHoursPerKw] = useState(0);
  const [timeSaved, setTimeSaved] = useState(0);
  const [speedEfficiency, setSpeedEfficiency] = useState(0);
  const [performanceRating, setPerformanceRating] = useState('');
  const [standardCost, setStandardCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [costSaved, setCostSaved] = useState(0);
  const [bonusEligible, setBonusEligible] = useState(false);
  const [bonusPool, setBonusPool] = useState(0);
  const [teamBonus, setTeamBonus] = useState(0);
  const [companyProfit, setCompanyProfit] = useState(0);
  const [teamBonusSplit, setTeamBonusSplit] = useState<any[]>([]);

  useEffect(() => {
    fetchJob();
    fetchTeams();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }
      
      const res = await fetch(`/api/admin/jobs/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.status === 401) {
        console.error('Authentication failed - token may be invalid');
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
        return;
      }
      
      if (!res.ok) {
        console.error('Failed to fetch job:', res.status, res.statusText);
        return;
      }
      
      const data = await res.json();
      
      if (data.job) {
        setJob(data.job);
        setStatus(data.job.status);
        setTeamId(data.job.teamId || '');
        setScheduledDate(data.job.scheduledDate ? new Date(data.job.scheduledDate).toISOString().split('T')[0] : '');
        setScheduledTime(data.job.scheduledStartTime || '');
        setNotes(data.job.installationNotes || '');
        
        // Load time tracking data
        if (data.job.actualStartTime) {
          setActualStartTime(new Date(data.job.actualStartTime).toISOString().slice(0, 16));
        }
        if (data.job.actualEndTime) {
          setActualEndTime(new Date(data.job.actualEndTime).toISOString().slice(0, 16));
        }
        setBreakHours(data.job.breakHours?.toString() || '0.5');
        setQualityScore(data.job.qualityScore?.toString() || '');
        setIssuesFound(data.job.issuesFound?.toString() || '0');
        setQualityCheckPassed(data.job.qualityCheckPassed || false);
        setCallbackRequired(data.job.callbackRequired || false);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
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
  
  const fetchTeamMembers = async (teamId: string) => {
    if (!teamId) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/teams/${teamId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTeamMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };
  
  // Fetch team members when team changes
  useEffect(() => {
    if (teamId) {
      fetchTeamMembers(teamId);
    }
  }, [teamId]);
  
  // Calculate performance metrics
  useEffect(() => {
    if (!actualStartTime || !actualEndTime || !job) return;
    
    const start = new Date(actualStartTime);
    const end = new Date(actualEndTime);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    setActualHours(hours);
    
    const net = hours - parseFloat(breakHours || '0');
    setNetWorkHours(net);
    
    const standard = job.systemSize * (job.standardHoursPerKw || 1.5);
    setStandardTotalHours(standard);
    
    const hoursPerKw = net / job.systemSize;
    setActualHoursPerKw(hoursPerKw);
    
    const saved = standard - net;
    setTimeSaved(saved);
    
    const efficiency = (standard / net) * 100;
    setSpeedEfficiency(efficiency);
    
    let rating = 'POOR';
    if (efficiency >= 120) rating = 'EXCELLENT';
    else if (efficiency >= 105) rating = 'GOOD';
    else if (efficiency >= 95) rating = 'AVERAGE';
    setPerformanceRating(rating);
    
    if (teamMembers.length > 0) {
      const stdCost = teamMembers.reduce((sum, m) => 
        sum + ((m.hourlyRate || 0) * (m.costMultiplier || 1.45) * standard), 0
      );
      setStandardCost(stdCost);
      
      const actCost = teamMembers.reduce((sum, m) => 
        sum + ((m.hourlyRate || 0) * (m.costMultiplier || 1.45) * net), 0
      );
      setActualCost(actCost);
      
      const savedCost = stdCost - actCost;
      setCostSaved(savedCost);
      
      const eligible = savedCost > 0 && parseFloat(qualityScore || '0') >= 80;
      setBonusEligible(eligible);
      
      if (eligible) {
        setBonusPool(savedCost);
        setTeamBonus(savedCost * 0.5);
        setCompanyProfit(savedCost * 0.5);
        
        const split = splitTeamBonus(savedCost * 0.5, teamMembers);
        setTeamBonusSplit(split);
      } else {
        setBonusPool(0);
        setTeamBonus(0);
        setCompanyProfit(0);
        setTeamBonusSplit([]);
      }
    }
  }, [actualStartTime, actualEndTime, breakHours, qualityScore, teamMembers, job]);
  
  const splitTeamBonus = (teamBonus: number, members: any[]) => {
    const rolePercentages: Record<string, number> = {
      'Lead Electrician': 0.40,
      'Lead Installer': 0.40,
      'Solar Installer': 0.35,
      'Installation Assistant': 0.25,
      'Assistant': 0.25,
    };
    
    const totalPercentage = members.reduce((sum, m) => {
      return sum + (rolePercentages[m.role] || 0.33);
    }, 0);
    
    return members.map(member => {
      const percentage = (rolePercentages[member.role] || 0.33) / totalPercentage;
      const bonus = teamBonus * percentage;
      
      return {
        name: member.name,
        role: member.role,
        bonus,
        percentage,
      };
    });
  };
  
  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'AVERAGE': return 'bg-yellow-100 text-yellow-800';
      case 'POOR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/jobs/${params.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          teamId: teamId || null,
          scheduledDate: scheduledDate || null,
          scheduledStartTime: scheduledTime || null,
          installationNotes: notes,
          // Time tracking
          actualStartTime: actualStartTime || null,
          actualEndTime: actualEndTime || null,
          actualHours: isNaN(actualHours) ? null : actualHours,
          breakHours: parseFloat(breakHours || '0'),
          netWorkHours: isNaN(netWorkHours) ? null : netWorkHours,
          // Performance metrics
          standardTotalHours: isNaN(standardTotalHours) ? null : standardTotalHours,
          actualHoursPerKw: isNaN(actualHoursPerKw) ? null : actualHoursPerKw,
          speedEfficiency: isNaN(speedEfficiency) ? null : speedEfficiency,
          timeSaved: isNaN(timeSaved) ? null : timeSaved,
          performanceRating: performanceRating || null,
          // Quality tracking
          qualityScore: parseFloat(qualityScore || '0'),
          issuesFound: parseInt(issuesFound || '0'),
          qualityCheckPassed,
          callbackRequired,
          // Cost & bonus
          teamBaseCost: isNaN(teamMembers.reduce((sum, m) => sum + ((m.hourlyRate || 0) * netWorkHours), 0)) ? null : teamMembers.reduce((sum, m) => sum + ((m.hourlyRate || 0) * netWorkHours), 0),
          teamTrueCost: isNaN(actualCost) ? null : actualCost,
          teamSize: teamMembers.length || null,
          costSaved: isNaN(costSaved) ? null : costSaved,
          bonusEligible,
          bonusPool: isNaN(bonusPool) ? null : bonusPool,
          bonusPaidToTeam: isNaN(teamBonus) ? null : teamBonus,
          bonusRetainedByCompany: isNaN(companyProfit) ? null : companyProfit,
        }),
      });

      if (res.ok) {
        alert('Job updated successfully!');
        fetchJob();
      } else {
        const errorData = await res.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Failed to update job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!confirm('Auto-assign this job to the nearest available team?')) {
      return;
    }

    try {
      setAutoAssigning(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/jobs/${params.id}/auto-assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`Job auto-assigned to ${data.assignedTeam} on ${new Date(data.scheduledDate).toLocaleDateString()}!`);
        fetchJob();
      } else {
        alert(data.error || 'Failed to auto-assign job');
      }
    } catch (error) {
      console.error('Error auto-assigning job:', error);
      alert('Failed to auto-assign job. Please try again.');
    } finally {
      setAutoAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>The installation job you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const components = job.selectedComponents || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/jobs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{job.jobNumber}</h1>
              <p className="text-gray-600 mt-1">Installation Job Details</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Assignment Card - New Enhanced Component */}
            <JobAssignmentCard 
              job={job} 
              onAssignmentSuccess={fetchJob}
            />

            {/* Schedule Installation Card */}
            {(job.teamId || job.subcontractorId) && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Schedule Installation
                  </CardTitle>
                  <CardDescription>
                    {job.scheduledDate 
                      ? 'Installation date confirmed' 
                      : 'Set installation date and time with customer'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {job.scheduledDate ? (
                    <div className="space-y-3">
                      <Badge className="bg-green-500">✓ Scheduled</Badge>
                      <p className="text-sm">
                        <strong>Date:</strong> {new Date(job.scheduledDate).toLocaleString()}
                      </p>
                      <Link href={`/admin/schedule?jobId=${job.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          View in Schedule
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Team assigned. Ready to schedule installation with customer.
                      </p>
                      <Link href={`/admin/schedule?jobId=${job.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Installation
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Update Card */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
                <CardDescription>Update job status and add notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Installation Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Add notes about the installation..."
                  />
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Status & Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Time Tracking & Performance */}
            {(status === 'IN_PROGRESS' || status === 'COMPLETED') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Tracking & Performance
                  </CardTitle>
                  <CardDescription>
                    Track installation time and calculate team performance bonus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Time Tracking */}
                  <div>
                    <h4 className="font-medium mb-3">Installation Time</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="datetime-local"
                          value={actualStartTime}
                          onChange={(e) => setActualStartTime(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="datetime-local"
                          value={actualEndTime}
                          onChange={(e) => setActualEndTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Break Time (hours)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={breakHours}
                          onChange={(e) => setBreakHours(e.target.value)}
                          placeholder="0.5"
                        />
                        <p className="text-xs text-gray-500">
                          Lunch and break time (typically 0.5-1 hour)
                        </p>
                      </div>

                      {actualHours > 0 && (
                        <div className="space-y-2">
                          <Label>Net Work Hours</Label>
                          <div className="flex items-center h-10 px-3 bg-gray-50 rounded-md">
                            <span className="font-mono font-medium">
                              {netWorkHours.toFixed(1)} hours
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Actual work time (excluding breaks)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {actualHours > 0 && (
                    <>
                      <Separator />

                      {/* Performance Metrics */}
                      <div>
                        <h4 className="font-medium mb-3">Performance Metrics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm text-blue-600 mb-1">Standard Time</div>
                            <div className="text-2xl font-bold text-blue-900">
                              {standardTotalHours.toFixed(1)} hrs
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              {job.systemSize}kW × 1.5 hrs/kW
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-sm text-purple-600 mb-1">Actual Time</div>
                            <div className="text-2xl font-bold text-purple-900">
                              {netWorkHours.toFixed(1)} hrs
                            </div>
                            <div className="text-xs text-purple-600 mt-1">
                              {actualHoursPerKw.toFixed(2)} hrs/kW
                            </div>
                          </div>

                          <div className={`rounded-lg p-4 ${
                            timeSaved > 0 ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <div className={`text-sm mb-1 ${
                              timeSaved > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {timeSaved > 0 ? 'Time Saved' : 'Over Time'}
                            </div>
                            <div className={`text-2xl font-bold ${
                              timeSaved > 0 ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {Math.abs(timeSaved).toFixed(1)} hrs
                            </div>
                            <div className={`text-xs mt-1 ${
                              timeSaved > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {speedEfficiency.toFixed(0)}% efficiency
                            </div>
                          </div>
                        </div>

                        {performanceRating && (
                          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-sm text-gray-600">Performance Rating</div>
                              <div className="text-lg font-bold text-gray-900 mt-1">
                                {performanceRating}
                              </div>
                            </div>
                            <Badge className={getPerformanceColor(performanceRating)}>
                              {performanceRating}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Quality Check */}
                      <div>
                        <h4 className="font-medium mb-3">Quality Check</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Quality Score (0-100)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={qualityScore}
                              onChange={(e) => setQualityScore(e.target.value)}
                              placeholder="95"
                            />
                            <p className="text-xs text-gray-500">
                              Overall installation quality (minimum 80 for bonus)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Issues Found</Label>
                            <Input
                              type="number"
                              min="0"
                              value={issuesFound}
                              onChange={(e) => setIssuesFound(e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="qualityCheckPassed"
                              checked={qualityCheckPassed}
                              onChange={(e) => setQualityCheckPassed(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="qualityCheckPassed" className="cursor-pointer">
                              Quality check passed
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="callbackRequired"
                              checked={callbackRequired}
                              onChange={(e) => setCallbackRequired(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="callbackRequired" className="cursor-pointer">
                              Callback required
                            </Label>
                          </div>
                        </div>

                        {parseFloat(qualityScore || '0') < 80 && qualityScore && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                              <div className="text-sm text-yellow-800">
                                <strong>Quality Warning:</strong> Quality score below 80% will reduce or eliminate bonus eligibility.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bonus Calculation */}
                      {qualityScore && teamMembers.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-3">Bonus Calculation</h4>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Standard Cost:</span>
                                <span className="font-mono">${standardCost.toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Actual Cost:</span>
                                <span className="font-mono">${actualCost.toFixed(0)}</span>
                              </div>
                              <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                <span className={costSaved > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {costSaved > 0 ? 'Cost Saved:' : 'Cost Overrun:'}
                                </span>
                                <span className={`font-mono ${costSaved > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ${Math.abs(costSaved).toFixed(0)}
                                </span>
                              </div>
                            </div>

                            {bonusEligible ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="font-medium text-green-900 mb-2">
                                      Bonus Eligible! 🎉
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-green-700">Total Savings:</span>
                                        <span className="font-mono font-medium text-green-900">
                                          ${bonusPool.toFixed(0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-green-700">Team Bonus (50%):</span>
                                        <span className="font-mono font-medium text-green-900">
                                          ${teamBonus.toFixed(0)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-green-700">Company Profit (50%):</span>
                                        <span className="font-mono font-medium text-green-900">
                                          ${companyProfit.toFixed(0)}
                                        </span>
                                      </div>
                                    </div>

                                    {teamBonusSplit.length > 0 && (
                                      <div className="mt-4 pt-3 border-t border-green-200">
                                        <div className="text-xs font-medium text-green-700 mb-2">
                                          Team Bonus Split:
                                        </div>
                                        {teamBonusSplit.map((member, idx) => (
                                          <div key={idx} className="flex justify-between text-xs mb-1">
                                            <span className="text-green-700">
                                              {member.name} ({member.role}) - {(member.percentage * 100).toFixed(0)}%
                                            </span>
                                            <span className="font-mono text-green-900">
                                              ${member.bonus.toFixed(2)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="w-6 h-6 text-gray-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-gray-700 mb-1">
                                      No Bonus
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {timeSaved <= 0 && 'Installation took longer than standard time.'}
                                      {timeSaved > 0 && parseFloat(qualityScore || '0') < 80 && 'Quality score below 80% threshold.'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* System Details */}
            <Card>
              <CardHeader>
                <CardTitle>System Specifications</CardTitle>
                <CardDescription>Solar system components and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                    <Package className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">System Size</p>
                      <p className="text-xl font-bold text-gray-900">{job.systemSize} kW</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Zap className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Panels</p>
                      <p className="text-xl font-bold text-gray-900">{job.panelCount}</p>
                    </div>
                  </div>

                  {job.batteryCapacity > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <Battery className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Battery</p>
                        <p className="text-xl font-bold text-gray-900">{job.batteryCapacity} kWh</p>
                      </div>
                    </div>
                  )}
                </div>

                {components.panel && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Solar Panels</h4>
                    <p className="text-sm text-gray-600">{components.panel.name || 'Standard Panel'}</p>
                    {components.panel.manufacturer && (
                      <p className="text-xs text-gray-500">Manufacturer: {components.panel.manufacturer}</p>
                    )}
                  </div>
                )}

                {components.battery && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Battery System</h4>
                    <p className="text-sm text-gray-600">{components.battery.name || 'Standard Battery'}</p>
                    {components.battery.manufacturer && (
                      <p className="text-xs text-gray-500">Manufacturer: {components.battery.manufacturer}</p>
                    )}
                  </div>
                )}

                {components.inverter && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Inverter</h4>
                    <p className="text-sm text-gray-600">{components.inverter.name || job.inverterModel}</p>
                    {components.inverter.manufacturer && (
                      <p className="text-xs text-gray-500">Manufacturer: {components.inverter.manufacturer}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Estimated Duration: {job.estimatedDuration} hours</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Customer & Location Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{job.lead.name}</p>
                    <p className="text-sm text-gray-500">Quote: {job.lead.quoteReference}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <a href={`mailto:${job.lead.email}`} className="text-sm text-blue-600 hover:underline">
                    {job.lead.email}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <a href={`tel:${job.lead.phone}`} className="text-sm text-blue-600 hover:underline">
                    {job.lead.phone}
                  </a>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">{job.lead.address}</p>
                    {job.siteSuburb && (
                      <p className="text-xs text-gray-500 mt-1">{job.siteSuburb}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deadline Warning */}
            {job.status === 'PENDING_SCHEDULE' && (
              <Card className="border-orange-500 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-5 h-5" />
                    Scheduling Deadline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.ceil((new Date(job.schedulingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(job.schedulingDeadline).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Team Assignment */}
            {job.team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Assigned Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge 
                      style={{ backgroundColor: job.team.color }}
                      className="text-white text-base px-3 py-1"
                    >
                      {job.team.name}
                    </Badge>
                    
                    {job.team.members && job.team.members.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                        <div className="space-y-2">
                          {job.team.members.map((member: any) => (
                            <div key={member.id} className="text-sm text-gray-600">
                              {member.name} - {member.role}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                {job.assignedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned:</span>
                    <span className="font-medium">{new Date(job.assignedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {job.assignmentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assignment:</span>
                    <span className="font-medium capitalize">{job.assignmentMethod.replace('_', ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type:</span>
                  <span className="font-medium">{job.isCommercial ? 'Commercial' : 'Residential'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
