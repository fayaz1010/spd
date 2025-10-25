'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  Mail, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  color: string;
  serviceSuburbs: string[];
  members?: any[];
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceSuburbs: string[];
  perWattRate?: number;
  batteryBaseRate?: number;
  batteryPerKwhRate?: number;
}

interface JobAssignmentCardProps {
  job: any;
  onAssignmentSuccess: () => void;
}

export function JobAssignmentCard({ job, onAssignmentSuccess }: JobAssignmentCardProps) {
  const [assignmentType, setAssignmentType] = useState<'team' | 'subcontractor'>('team');
  const [teams, setTeams] = useState<Team[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Gate checks
  const [gateChecks, setGateChecks] = useState({
    materialsReady: false,
    approvalsReceived: false,
    canSchedule: false,
    blockers: [] as string[],
  });

  useEffect(() => {
    fetchTeamsAndSubcontractors();
    checkGates();
    
    // Set default date to 3 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3);
    setScheduledDate(defaultDate.toISOString().split('T')[0]);

    // Pre-fill existing assignment if any
    if (job.teamId) {
      setAssignmentType('team');
      setSelectedTeamId(job.teamId);
    } else if (job.subcontractorId) {
      setAssignmentType('subcontractor');
      setSelectedSubcontractorId(job.subcontractorId);
    }

    if (job.scheduledDate) {
      setScheduledDate(new Date(job.scheduledDate).toISOString().split('T')[0]);
    }
    if (job.scheduledStartTime) {
      setScheduledTime(job.scheduledStartTime);
    }
    if (job.installationNotes) {
      setNotes(job.installationNotes);
    }
  }, [job]);

  const checkGates = () => {
    const blockers: string[] = [];
    let materialsReady = true;
    
    // Check material orders
    if (job.materialOrders && job.materialOrders.length > 0) {
      const unconfirmedOrders = job.materialOrders.filter(
        (order: any) => order.status !== 'CONFIRMED' && order.status !== 'DELIVERED'
      );
      if (unconfirmedOrders.length > 0) {
        materialsReady = false;
        blockers.push(`${unconfirmedOrders.length} material order(s) not confirmed`);
      }
    } else {
      materialsReady = false;
      blockers.push('No material orders created');
    }
    
    // Check if materials are marked as delivered
    if (!job.materialsDelivered) {
      blockers.push('Materials not marked as delivered');
    }
    
    setGateChecks({
      materialsReady,
      approvalsReceived: true, // TODO: Check actual approvals from Synergy/WP
      canSchedule: blockers.length === 0,
      blockers,
    });
  };

  const fetchTeamsAndSubcontractors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [teamsRes, subcontractorsRes] = await Promise.all([
        fetch('/api/admin/teams', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/subcontractors', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const teamsData = await teamsRes.json();
      const subcontractorsData = await subcontractorsRes.json();

      let filteredTeams = teamsData.teams || [];
      let filteredSubs = subcontractorsData.subcontractors || [];

      // Filter by service area if suburb is available
      if (job.siteSuburb) {
        const matchingTeams = filteredTeams.filter((team: Team) =>
          team.serviceSuburbs.some((suburb: string) =>
            suburb.toLowerCase().includes(job.siteSuburb.toLowerCase())
          )
        );
        const matchingSubs = filteredSubs.filter((sub: Subcontractor) =>
          sub.serviceSuburbs.some((suburb: string) =>
            suburb.toLowerCase().includes(job.siteSuburb.toLowerCase())
          )
        );

        // Use filtered results if available, otherwise show all
        if (matchingTeams.length > 0) filteredTeams = matchingTeams;
        if (matchingSubs.length > 0) filteredSubs = matchingSubs;
      }

      setTeams(filteredTeams);
      setSubcontractors(filteredSubs);
    } catch (error) {
      console.error('Error fetching teams/subcontractors:', error);
      toast.error('Failed to load assignment options');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    // Validation
    if (assignmentType === 'team' && !selectedTeamId) {
      toast.error('Please select a team');
      return;
    }
    if (assignmentType === 'subcontractor' && !selectedSubcontractorId) {
      toast.error('Please select a subcontractor');
      return;
    }
    if (!scheduledDate) {
      toast.error('Please select a date');
      return;
    }

    // Gate check warning - ONLY for internal teams
    // Subcontractors: materials ordered AFTER they confirm date/time
    if (assignmentType === 'team' && !gateChecks.canSchedule) {
      const proceed = window.confirm(
        `⚠️ Warning: There are ${gateChecks.blockers.length} blocker(s):\n\n${gateChecks.blockers.join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

    try {
      setSubmitting(true);

      const payload = {
        assignmentType,
        teamId: assignmentType === 'team' ? selectedTeamId : null,
        subcontractorId: assignmentType === 'subcontractor' ? selectedSubcontractorId : null,
        scheduledDate,
        scheduledStartTime: scheduledTime,
        notes,
      };

      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/jobs/${job.id}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign job');
      }

      if (assignmentType === 'team') {
        toast.success('✅ Job assigned to team and added to schedule!');
      } else {
        toast.success('📧 Confirmation email sent to subcontractor. Awaiting response...');
      }

      onAssignmentSuccess();
    } catch (error: any) {
      console.error('Error assigning job:', error);
      toast.error(error.message || 'Failed to assign job');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedSubcontractor = subcontractors.find((s) => s.id === selectedSubcontractorId);

  // Calculate estimated cost for subcontractor
  const estimatedSubCost = selectedSubcontractor
    ? (job.systemSize * 1000 * (selectedSubcontractor.perWattRate || 0.22)) +
      (job.batteryCapacity > 0 
        ? (selectedSubcontractor.batteryBaseRate || 800) + 
          (job.batteryCapacity * (selectedSubcontractor.batteryPerKwhRate || 50))
        : 0)
    : 0;

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Job Assignment & Scheduling
        </CardTitle>
        <CardDescription>
          Assign this job to an internal team or subcontractor and set the installation date
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {(job.teamId || job.subcontractorId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-1">Currently Assigned</h4>
                {job.team && (
                  <p className="text-sm text-blue-700">
                    Team: <strong>{job.team.name}</strong>
                  </p>
                )}
                {job.subcontractor && (
                  <>
                    <p className="text-sm text-blue-700">
                      Subcontractor: <strong>{job.subcontractor.companyName}</strong>
                    </p>
                    {job.status === 'PENDING_SUB_CONFIRM' && (
                      <Badge className="mt-2 bg-yellow-500">
                        <Mail className="w-3 h-3 mr-1" />
                        Awaiting Confirmation
                      </Badge>
                    )}
                    {job.status === 'SUB_CONFIRMED' && (
                      <Badge className="mt-2 bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Confirmed
                      </Badge>
                    )}
                  </>
                )}
                {job.scheduledDate && (
                  <p className="text-sm text-blue-700 mt-1">
                    Scheduled: <strong>{new Date(job.scheduledDate).toLocaleDateString()}</strong> at {job.scheduledStartTime || '9:00 AM'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gate Checks - Only show for internal teams */}
        {assignmentType === 'team' && gateChecks.blockers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 mb-2">Pre-Installation Blockers</h4>
                <ul className="space-y-1">
                  {gateChecks.blockers.map((blocker, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 flex items-center gap-2">
                      <XCircle className="w-3 h-3" />
                      {blocker}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Info for Subcontractors */}
        {assignmentType === 'subcontractor' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Subcontractor Workflow</h4>
                <p className="text-sm text-blue-700">
                  Materials will be ordered <strong>after</strong> the subcontractor confirms their availability and installation date.
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Assignment Type Toggle */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Assignment Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAssignmentType('team')}
              className={`p-4 rounded-lg border-2 transition-all ${
                assignmentType === 'team'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`w-6 h-6 mx-auto mb-2 ${
                assignmentType === 'team' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <div className={`font-semibold ${
                assignmentType === 'team' ? 'text-orange-900' : 'text-gray-600'
              }`}>
                Internal Team
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Direct scheduling
              </div>
            </button>

            <button
              onClick={() => setAssignmentType('subcontractor')}
              className={`p-4 rounded-lg border-2 transition-all ${
                assignmentType === 'subcontractor'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserCheck className={`w-6 h-6 mx-auto mb-2 ${
                assignmentType === 'subcontractor' ? 'text-orange-600' : 'text-gray-400'
              }`} />
              <div className={`font-semibold ${
                assignmentType === 'subcontractor' ? 'text-orange-900' : 'text-gray-600'
              }`}>
                Subcontractor
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Requires confirmation
              </div>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Team Selection */}
            {assignmentType === 'team' && (
              <div className="space-y-2">
                <Label>Select Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 ? (
                      <SelectItem value="none" disabled>No teams available</SelectItem>
                    ) : (
                      teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: team.color }}
                            />
                            {team.name}
                            {team.members && (
                              <span className="text-xs text-gray-500">
                                ({team.members.length} members)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedTeam && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium text-gray-700 mb-1">Service Areas:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedTeam.serviceSuburbs.map((suburb, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {suburb}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subcontractor Selection */}
            {assignmentType === 'subcontractor' && (
              <div className="space-y-2">
                <Label>Select Subcontractor</Label>
                <Select value={selectedSubcontractorId} onValueChange={setSelectedSubcontractorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subcontractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcontractors.length === 0 ? (
                      <SelectItem value="none" disabled>No subcontractors available</SelectItem>
                    ) : (
                      subcontractors.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.companyName} - {sub.contactName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedSubcontractor && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                    <div>
                      <span className="text-gray-600">Contact:</span>{' '}
                      <span className="font-medium">{selectedSubcontractor.contactName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{selectedSubcontractor.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>{' '}
                      <span className="font-medium">{selectedSubcontractor.phone}</span>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-gray-600">Estimated Cost:</span>{' '}
                      <span className="font-bold text-green-600">
                        ${estimatedSubCost.toFixed(0)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Based on: {job.systemSize}kW system
                      {job.batteryCapacity > 0 && ` + ${job.batteryCapacity}kWh battery`}
                    </div>
                    <Separator />
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-700">
                          <strong>Note:</strong> An email will be sent to the subcontractor requesting confirmation. 
                          Job will remain in "Awaiting Confirmation" status until they respond.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Installation Date
                </Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Start Time
                </Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="07:30">7:30 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="08:30">8:30 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="09:30">9:30 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="10:30">10:30 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Installation Notes */}
            <div className="space-y-2">
              <Label>Installation Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Add any special instructions, site access details, or requirements..."
              />
            </div>

            {/* Action Button */}
            <Button
              onClick={handleAssign}
              disabled={submitting || (!selectedTeamId && !selectedSubcontractorId)}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : assignmentType === 'team' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Assign to Team & Schedule
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Confirmation Request
                </>
              )}
            </Button>

            {assignmentType === 'subcontractor' && (
              <p className="text-xs text-center text-gray-500">
                The subcontractor will receive an email with job details and a link to confirm or decline
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
