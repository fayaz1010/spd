
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
}

interface AssignJobDialogProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  jobNumber: string;
  onSuccess: () => void;
}

export function AssignJobDialog({
  open,
  onClose,
  jobId,
  jobNumber,
  onSuccess,
}: AssignJobDialogProps) {
  const [assignmentType, setAssignmentType] = useState<'team' | 'subcontractor'>('team');
  const [teams, setTeams] = useState<Team[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('09:00');
  const [estimatedDuration, setEstimatedDuration] = useState('4');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      fetchTeamsAndSubcontractors();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
    }
  }, [open]);

  const fetchTeamsAndSubcontractors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [teamsRes, subsRes] = await Promise.all([
        fetch('/api/admin/teams', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch('/api/admin/subcontractors', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const teamsData = await teamsRes.json();
      const subsData = await subsRes.json();

      if (teamsData.teams) {
        setTeams(teamsData.teams);
      }

      if (subsData.subcontractors) {
        setSubcontractors(subsData.subcontractors);
      }
    } catch (error) {
      console.error('Error fetching teams and subcontractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (assignmentType === 'team' && !selectedTeamId) {
      alert('Please select a team');
      return;
    }

    if (assignmentType === 'subcontractor' && !selectedSubcontractorId) {
      alert('Please select a subcontractor');
      return;
    }

    if (!scheduledDate) {
      alert('Please select a date');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/admin/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentType,
          teamId: assignmentType === 'team' ? selectedTeamId : undefined,
          subcontractorId: assignmentType === 'subcontractor' ? selectedSubcontractorId : undefined,
          scheduledDate,
          scheduledStartTime,
          estimatedDuration: parseFloat(estimatedDuration),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to assign job');
        return;
      }

      alert(data.message || 'Job assigned successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning job:', error);
      alert('Failed to assign job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Job #{jobNumber}</DialogTitle>
          <DialogDescription>
            Assign this installation job to an internal team or subcontractor
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assignment Type */}
            <div className="space-y-3">
              <Label>Assign To</Label>
              <RadioGroup value={assignmentType} onValueChange={(v) => setAssignmentType(v as any)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-blue-50 cursor-pointer">
                  <RadioGroupItem value="team" id="type-team" />
                  <Label htmlFor="type-team" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Internal Team</p>
                      <p className="text-xs text-gray-600">Job will be immediately confirmed to customer</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-orange-50 cursor-pointer">
                  <RadioGroupItem value="subcontractor" id="type-sub" />
                  <Label htmlFor="type-sub" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <div>
                      <p className="font-semibold">Subcontractor</p>
                      <p className="text-xs text-gray-600">Subcontractor must confirm before customer is notified</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Team Selection */}
            {assignmentType === 'team' && (
              <div className="space-y-2">
                <Label htmlFor="team">Select Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger id="team">
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 ? (
                      <SelectItem value="no-teams" disabled>
                        No teams available
                      </SelectItem>
                    ) : (
                      teams
                        .filter((team) => team.id)
                        .map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Subcontractor Selection */}
            {assignmentType === 'subcontractor' && (
              <div className="space-y-2">
                <Label htmlFor="subcontractor">Select Subcontractor</Label>
                <Select value={selectedSubcontractorId} onValueChange={setSelectedSubcontractorId}>
                  <SelectTrigger id="subcontractor">
                    <SelectValue placeholder="Choose a subcontractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subcontractors.length === 0 ? (
                      <SelectItem value="no-subs" disabled>
                        No subcontractors available
                      </SelectItem>
                    ) : (
                      subcontractors
                        .filter((sub) => sub.id)
                        .map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.companyName} ({sub.contactName})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Installation Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Start Time</Label>
                <Select value={scheduledStartTime} onValueChange={setScheduledStartTime}>
                  <SelectTrigger id="time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00">7:00 AM</SelectItem>
                    <SelectItem value="08:00">8:00 AM</SelectItem>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (hours)</Label>
              <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 hours (Standard)</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="8">8 hours (Full day)</SelectItem>
                  <SelectItem value="16">16 hours (2 days)</SelectItem>
                  <SelectItem value="24">24 hours (3 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Installation Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or notes for the installation team..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Job'
                )}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
