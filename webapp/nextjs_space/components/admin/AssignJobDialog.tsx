
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Building2, Calendar, Clock, AlertCircle, Upload, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Team {
  id: string;
  name: string;
  color: string;
  serviceSuburbs: string[];
}

interface Subcontractor {
  id: string;
  companyName: string;
  contactName: string;
  serviceSuburbs: string[];
}

interface MaterialOrder {
  id: string;
  poNumber: string;
  status: string;
  total: number;
  confirmedAt: string | null;
  confirmationDocumentUrl: string | null;
  supplierEstimatedDelivery: string | null;
  supplier: {
    name: string;
  };
}

interface Job {
  id: string;
  jobNumber: string;
  siteSuburb: string | null;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number;
  lead: {
    name: string;
    address: string;
  };
  materialOrders?: MaterialOrder[];
}

interface AssignJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onSuccess: () => void;
}

export function AssignJobDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: AssignJobDialogProps) {
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
  const [uploadingPO, setUploadingPO] = useState(false);
  const [selectedPOFile, setSelectedPOFile] = useState<File | null>(null);
  const [gateChecks, setGateChecks] = useState({
    materialsConfirmed: false,
    approvalsReceived: false,
    canSchedule: false,
    blockers: [] as string[],
  });

  useEffect(() => {
    if (open) {
      fetchTeamsAndSubcontractors();
      checkGates();
      // Set default date to 3 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setScheduledDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [open]);

  const checkGates = () => {
    const blockers: string[] = [];
    let materialsConfirmed = true;
    
    // Check material orders
    if (job.materialOrders && job.materialOrders.length > 0) {
      const unconfirmedOrders = job.materialOrders.filter(
        order => order.status !== 'CONFIRMED' && order.status !== 'DELIVERED'
      );
      if (unconfirmedOrders.length > 0) {
        materialsConfirmed = false;
        blockers.push(`${unconfirmedOrders.length} PO(s) not confirmed by supplier`);
      }
    } else {
      materialsConfirmed = false;
      blockers.push('No material orders created');
    }
    
    // TODO: Add other gate checks (approvals, etc.)
    
    setGateChecks({
      materialsConfirmed,
      approvalsReceived: true, // TODO: Check actual approvals
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
      const subcontractorsData = await subcontractorsRes.json();

      setTeams(teamsData.teams || []);
      setSubcontractors(subcontractorsData.subcontractors || []);

      // Filter by service area if suburb is available
      if (job.siteSuburb && teamsData.teams && subcontractorsData.subcontractors) {
        const filteredTeams = teamsData.teams.filter((team: Team) =>
          team.serviceSuburbs.some((suburb: string) =>
            suburb.toLowerCase().includes(job.siteSuburb!.toLowerCase())
          )
        );
        const filteredSubs = subcontractorsData.subcontractors.filter((sub: Subcontractor) =>
          sub.serviceSuburbs.some((suburb: string) =>
            suburb.toLowerCase().includes(job.siteSuburb!.toLowerCase())
          )
        );

        // If filtered results exist, use them
        if (filteredTeams.length > 0) setTeams(filteredTeams);
        if (filteredSubs.length > 0) setSubcontractors(filteredSubs);
      }
    } catch (error) {
      console.error('Error fetching teams/subcontractors:', error);
      toast.error('Failed to load assignment options');
    } finally {
      setLoading(false);
    }
  };

  const handlePOUpload = async (orderId: string) => {
    if (!selectedPOFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploadingPO(true);
      const formData = new FormData();
      formData.append('file', selectedPOFile);
      formData.append('orderId', orderId);

      const res = await fetch(`/api/admin/material-orders/${orderId}/upload-confirmation`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload PO confirmation');
      }

      toast.success('PO confirmation uploaded successfully!');
      setSelectedPOFile(null);
      checkGates(); // Re-check gates after upload
    } catch (error: any) {
      console.error('Error uploading PO:', error);
      toast.error(error.message || 'Failed to upload PO confirmation');
    } finally {
      setUploadingPO(false);
    }
  };

  const handleSubmit = async () => {
    // Gate check warning
    if (!gateChecks.canSchedule) {
      const proceed = window.confirm(
        `Warning: There are ${gateChecks.blockers.length} blocker(s):\n\n${gateChecks.blockers.join('\n')}\n\nDo you want to proceed anyway?`
      );
      if (!proceed) return;
    }

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

      const res = await fetch(`/api/admin/jobs/${job.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign job');
      }

      if (assignmentType === 'team') {
        toast.success('Job assigned to team successfully!');
      } else {
        toast.success('Confirmation request sent to subcontractor');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error assigning job:', error);
      toast.error(error.message || 'Failed to assign job');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAssignmentType('team');
    setSelectedTeamId('');
    setSelectedSubcontractorId('');
    setScheduledDate('');
    setScheduledTime('09:00');
    setNotes('');
  };

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const selectedSubcontractor = subcontractors.find((s) => s.id === selectedSubcontractorId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Job: {job.jobNumber}</DialogTitle>
          <DialogDescription>
            Assign this installation job to a team or subcontractor
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Gate Checks */}
            {!gateChecks.canSchedule && (
              <Alert className="border-orange-500 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription>
                  <div className="text-sm text-orange-700">
                    <p className="font-semibold mb-2">⚠️ Scheduling Blockers:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {gateChecks.blockers.map((blocker, idx) => (
                        <li key={idx}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Material Orders Status */}
            {job.materialOrders && job.materialOrders.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Material Orders</h4>
                </div>
                {job.materialOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{order.poNumber}</span>
                        <span className="text-xs text-gray-500 ml-2">({order.supplier.name})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'CONFIRMED' || order.status === 'DELIVERED' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className="text-xs font-medium">{order.status}</span>
                      </div>
                    </div>
                    
                    {order.status === 'SENT' && !order.confirmationDocumentUrl && (
                      <div className="space-y-2">
                        <p className="text-xs text-orange-600">⏳ Awaiting supplier confirmation</p>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setSelectedPOFile(e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => handlePOUpload(order.id)}
                            disabled={!selectedPOFile || uploadingPO}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {order.confirmationDocumentUrl && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Confirmation uploaded
                        {order.supplierEstimatedDelivery && (
                          <span className="ml-2 text-gray-600">
                            • Delivery: {new Date(order.supplierEstimatedDelivery).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Job Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-gray-900">Job Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <span className="ml-2 font-medium">{job.lead.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-2 font-medium">{job.siteSuburb || 'TBD'}</span>
                </div>
                <div>
                  <span className="text-gray-500">System Size:</span>
                  <span className="ml-2 font-medium">{job.systemSize}kW ({job.panelCount} panels)</span>
                </div>
                {job.batteryCapacity > 0 && (
                  <div>
                    <span className="text-gray-500">Battery:</span>
                    <span className="ml-2 font-medium">{job.batteryCapacity}kWh</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Type Selection */}
            <div className="space-y-3">
              <Label>Assignment Type</Label>
              <RadioGroup
                value={assignmentType}
                onValueChange={(value) => setAssignmentType(value as 'team' | 'subcontractor')}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="team"
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    assignmentType === 'team'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="team" id="team" />
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Internal Team</span>
                  </div>
                </Label>

                <Label
                  htmlFor="subcontractor"
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    assignmentType === 'subcontractor'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="subcontractor" id="subcontractor" />
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Subcontractor</span>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {/* Team Selection */}
            {assignmentType === 'team' && (
              <div className="space-y-2">
                <Label htmlFor="team-select">Select Team</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger id="team-select">
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        No teams available
                      </div>
                    ) : (
                      teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                            <span>{team.name}</span>
                            <span className="text-xs text-gray-500">
                              ({team.serviceSuburbs.length} suburbs)
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedTeam && (
                  <Alert>
                    <AlertDescription>
                      <div className="text-sm">
                        <span className="font-medium">Service Areas:</span>{' '}
                        {selectedTeam.serviceSuburbs.slice(0, 5).join(', ')}
                        {selectedTeam.serviceSuburbs.length > 5 && ` +${selectedTeam.serviceSuburbs.length - 5} more`}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Subcontractor Selection */}
            {assignmentType === 'subcontractor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sub-select">Select Subcontractor</Label>
                  <Select
                    value={selectedSubcontractorId}
                    onValueChange={setSelectedSubcontractorId}
                  >
                    <SelectTrigger id="sub-select">
                      <SelectValue placeholder="Choose a subcontractor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcontractors.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          No subcontractors available
                        </div>
                      ) : (
                        subcontractors.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            <div className="flex flex-col">
                              <span>{sub.companyName}</span>
                              <span className="text-xs text-gray-500">{sub.contactName}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedSubcontractor && (
                    <Alert>
                      <AlertDescription>
                        <div className="text-sm">
                          <span className="font-medium">Service Areas:</span>{' '}
                          {selectedSubcontractor.serviceSuburbs.slice(0, 5).join(', ')}
                          {selectedSubcontractor.serviceSuburbs.length > 5 &&
                            ` +${selectedSubcontractor.serviceSuburbs.length - 5} more`}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Alert className="border-orange-500 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-sm text-orange-700">
                    The subcontractor will receive a confirmation request email with job details.
                    The job will be marked as "Pending Sub Confirmation" until they confirm.
                  </AlertDescription>
                </Alert>
              </>
            )}

            {/* Date & Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Proposed Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </Label>
                <Select value={scheduledTime} onValueChange={setScheduledTime}>
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or notes for this assignment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || submitting}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : assignmentType === 'team' ? (
              'Assign to Team'
            ) : (
              'Send Confirmation Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
