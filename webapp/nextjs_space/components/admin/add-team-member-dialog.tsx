'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, User, UserCheck, Briefcase, Mail, Phone, CheckCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  Team?: {
    id: string;
    name: string;
  } | null;
  electricianId?: string;
}

interface Electrician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  type: string;
  status: string;
  licenseNumber?: string;
  cecNumber?: string;
}

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'staff' | 'electrician';
  teamRole: string;
}

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onMemberAdded: () => void;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  teamId,
  onMemberAdded,
}: AddTeamMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Map<string, SelectedMember>>(new Map());

  useEffect(() => {
    if (open) {
      fetchAvailableMembers();
      setSelectedMembers(new Map());
      setSearchQuery('');
    }
  }, [open]);

  const fetchAvailableMembers = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch staff members
      const staffResponse = await fetch('/api/admin/staff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaffMembers(staffData.staff || []);
      }
      
      // Fetch electricians
      const electriciansResponse = await fetch('/api/electricians', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (electriciansResponse.ok) {
        const electriciansData = await electriciansResponse.json();
        setElectricians(electriciansData || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleMemberSelection = (member: SelectedMember) => {
    const newSelected = new Map(selectedMembers);
    if (newSelected.has(member.id)) {
      newSelected.delete(member.id);
    } else {
      newSelected.set(member.id, member);
    }
    setSelectedMembers(newSelected);
  };

  const updateMemberRole = (memberId: string, role: string) => {
    const newSelected = new Map(selectedMembers);
    const member = newSelected.get(memberId);
    if (member) {
      member.teamRole = role;
      newSelected.set(memberId, member);
      setSelectedMembers(newSelected);
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.size === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const membersToAdd = Array.from(selectedMembers.values());

      const response = await fetch(`/api/admin/teams/${teamId}/members/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members: membersToAdd }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add members');
      }

      onMemberAdded();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on search
  const filteredStaff = staffMembers.filter((staff) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      staff.name.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.role.toLowerCase().includes(searchLower)
    );
  });

  const filteredElectricians = electricians.filter((elec) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${elec.firstName} ${elec.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      elec.email.toLowerCase().includes(searchLower) ||
      elec.type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Add Team Members
          </DialogTitle>
          <DialogDescription>
            Select staff members and electricians to add to this team. You can select multiple members at once.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Members Summary */}
        {selectedMembers.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Members List */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loadingData ? (
            <div className="text-center py-8 text-gray-500">Loading members...</div>
          ) : (
            <>
              {/* Staff Members */}
              {filteredStaff.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Staff Members ({filteredStaff.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredStaff.map((staff) => {
                      const isSelected = selectedMembers.has(staff.id);
                      const selectedMember = selectedMembers.get(staff.id);
                      
                      return (
                        <div
                          key={staff.id}
                          className={`border rounded-lg p-3 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleMemberSelection({
                                  id: staff.id,
                                  name: staff.name,
                                  email: staff.email,
                                  phone: staff.phone,
                                  type: 'staff',
                                  teamRole: staff.role,
                                })
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-gray-900">{staff.name}</p>
                                {staff.Team && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {staff.Team.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Briefcase className="h-3 w-3" />
                                {staff.role}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {staff.email}
                              </p>
                              
                              {isSelected && (
                                <div className="mt-3">
                                  <Label htmlFor={`role-${staff.id}`} className="text-xs">
                                    Team Role
                                  </Label>
                                  <Input
                                    id={`role-${staff.id}`}
                                    value={selectedMember?.teamRole || ''}
                                    onChange={(e) => updateMemberRole(staff.id, e.target.value)}
                                    placeholder="e.g., Lead Installer, Electrician"
                                    className="mt-1 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Electricians */}
              {filteredElectricians.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Electricians ({filteredElectricians.length})
                  </h3>
                  <div className="space-y-2">
                    {filteredElectricians.map((elec) => {
                      const fullName = `${elec.firstName} ${elec.lastName}`;
                      const isSelected = selectedMembers.has(elec.id);
                      const selectedMember = selectedMembers.get(elec.id);
                      
                      return (
                        <div
                          key={elec.id}
                          className={`border rounded-lg p-3 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleMemberSelection({
                                  id: elec.id,
                                  name: fullName,
                                  email: elec.email,
                                  phone: elec.phone || elec.mobile || '',
                                  type: 'electrician',
                                  teamRole: elec.type === 'IN_HOUSE' ? 'Electrician' : 'Subcontractor',
                                })
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-gray-900">{fullName}</p>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    elec.type === 'IN_HOUSE'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {elec.type === 'IN_HOUSE' ? 'In-House' : 'Subcontractor'}
                                </span>
                              </div>
                              {elec.licenseNumber && (
                                <p className="text-xs text-gray-600 mt-1">
                                  License: {elec.licenseNumber}
                                </p>
                              )}
                              {elec.cecNumber && (
                                <p className="text-xs text-gray-600">
                                  CEC: {elec.cecNumber}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Mail className="h-3 w-3" />
                                {elec.email}
                              </p>
                              
                              {isSelected && (
                                <div className="mt-3">
                                  <Label htmlFor={`role-${elec.id}`} className="text-xs">
                                    Team Role
                                  </Label>
                                  <Input
                                    id={`role-${elec.id}`}
                                    value={selectedMember?.teamRole || ''}
                                    onChange={(e) => updateMemberRole(elec.id, e.target.value)}
                                    placeholder="e.g., Lead Installer, Electrician"
                                    className="mt-1 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredStaff.length === 0 && filteredElectricians.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No members found matching your search' : 'No members available'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAddMembers}
            disabled={loading || selectedMembers.size === 0}
            className="bg-primary hover:bg-primary-600"
          >
            {loading ? 'Adding...' : `Add ${selectedMembers.size} Member${selectedMembers.size > 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
