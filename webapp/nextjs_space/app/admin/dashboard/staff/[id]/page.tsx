'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, UserPlus, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
}

interface Position {
  id: string;
  positionCode: string;
  title: string;
  department: string;
  level: string;
  salaryType?: string;
  hourlyRateMin?: number;
  hourlyRateMax?: number;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  superannuationRate: number;
  overtimeRate?: number;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  positionId: string | null;
  position: Position | null;
  isActive: boolean;
  Team: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
  } | null;
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamId: '',
    positionId: '',
    role: '',
    isActive: true,
    hourlyRate: '',
    overtimeRate: '',
    superannuationRate: '11.5',
    workersCompRate: '6.5',
  });

  useEffect(() => {
    fetchTeams();
    fetchPositions();
    fetchStaff();
  }, [params.id]);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchPositions = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/positions?isActive=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff member');
      }

      const data = await response.json();
      setStaff(data.staff);
      setFormData({
        name: data.staff.name,
        email: data.staff.email,
        phone: data.staff.phone,
        teamId: data.staff.Team?.id || '',
        positionId: data.staff.positionId || '',
        role: data.staff.role,
        isActive: data.staff.isActive,
        hourlyRate: data.staff.hourlyRate?.toString() || '',
        overtimeRate: data.staff.overtimeRate?.toString() || '1.5',
        superannuationRate: data.staff.superannuationRate?.toString() || '11.5',
        workersCompRate: data.staff.workersCompRate?.toString() || '6.5',
      });
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update staff member');
      }

      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
      });

      router.push('/admin/dashboard/staff');
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/staff/${params.id}/account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountRole: 'TEAM_MEMBER',
          permissions: ['view_assigned_jobs', 'update_job_status'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const data = await response.json();

      toast({
        title: 'Account Created',
        description: `Temporary password: ${data.account.tempPassword}`,
      });

      fetchStaff();
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff member...</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Staff member not found</p>
          <Link href="/admin/dashboard/staff">
            <Button>Back to Staff</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard/staff">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Edit Staff Member
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Update staff member details and account settings
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Account Status */}
            {staff.user && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">User Account</p>
                      <p className="text-sm text-gray-600">
                        Role: {staff.user.role} • Last Login:{' '}
                        {staff.user.lastLoginAt
                          ? new Date(staff.user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active Account
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Staff Management</CardTitle>
                <CardDescription>
                  Access detailed staff information and records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/admin/dashboard/staff/${params.id}/certifications`}>
                    <Button variant="outline" className="w-full justify-start">
                      🏆 Certifications
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/skills`}>
                    <Button variant="outline" className="w-full justify-start">
                      💡 Skills
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/training`}>
                    <Button variant="outline" className="w-full justify-start">
                      📚 Training
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/performance`}>
                    <Button variant="outline" className="w-full justify-start">
                      ⭐ Performance Reviews
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/metrics`}>
                    <Button variant="outline" className="w-full justify-start bg-green-50 border-green-200 hover:bg-green-100">
                      📊 Performance Metrics
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/documents`}>
                    <Button variant="outline" className="w-full justify-start">
                      📄 Documents
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboard/staff/${params.id}/profile`}>
                    <Button variant="outline" className="w-full justify-start">
                      👤 Edit Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the staff member's personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team & Role */}
            <Card>
              <CardHeader>
                <CardTitle>Team & Position Assignment</CardTitle>
                <CardDescription>
                  Update team and position assignment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="teamId">Team (Optional)</Label>
                  <Select
                    value={formData.teamId || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Team</SelectItem>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="positionId">Position *</Label>
                  <Select
                    value={formData.positionId}
                    onValueChange={(value) => {
                      const selectedPosition = positions.find(p => p.id === value);
                      setFormData({ 
                        ...formData, 
                        positionId: value,
                        role: selectedPosition?.title || formData.role,
                        overtimeRate: selectedPosition?.overtimeRate?.toString() || '1.5',
                        superannuationRate: selectedPosition?.superannuationRate?.toString() || '11.5',
                      });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{position.title}</span>
                            <span className="text-xs text-gray-500">
                              {position.positionCode} • {position.department} • {position.level}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.positionId && staff?.position && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {staff.position.title} ({staff.position.positionCode})
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked as boolean })
                    }
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer">
                    Active (can be assigned to jobs)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Compensation */}
            <Card>
              <CardHeader>
                <CardTitle>Compensation & Payroll</CardTitle>
                <CardDescription>
                  Set hourly rate and payroll parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const selectedPosition = positions.find(p => p.id === formData.positionId);
                  if (formData.positionId && selectedPosition && (selectedPosition.hourlyRateMin || selectedPosition.annualSalaryMin)) {
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Position Pay Range
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                          {selectedPosition.salaryType === 'hourly' ? (
                            <>
                              ${selectedPosition.hourlyRateMin} - ${selectedPosition.hourlyRateMax}/hr
                            </>
                          ) : selectedPosition.annualSalaryMin ? (
                            <>
                              ${(selectedPosition.annualSalaryMin || 0).toLocaleString()} - ${(selectedPosition.annualSalaryMax || 0).toLocaleString()}/yr
                            </>
                          ) : null}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          + {selectedPosition.superannuationRate}% superannuation
                        </p>
                        {selectedPosition.salaryType === 'annual' && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 Annual salary position - set equivalent hourly rate below
                          </p>
                        )}
                      </div>
                    );
                  } else if (formData.positionId && selectedPosition && !selectedPosition.hourlyRateMin && !selectedPosition.annualSalaryMin) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          ⚠️ Position Missing Salary Data
                        </p>
                        <p className="text-xs text-yellow-700">
                          This position doesn't have salary ranges configured. Please update the position settings.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div>
                  {(() => {
                    const selectedPosition = positions.find(p => p.id === formData.positionId);
                    return (
                      <>
                        <Label htmlFor="hourlyRate">
                          {selectedPosition?.salaryType === 'annual' ? 'Equivalent Hourly Rate ($/hr) *' : 'Hourly Rate ($/hr) *'}
                        </Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          step="0.01"
                          min={selectedPosition?.hourlyRateMin || 0}
                          max={selectedPosition?.hourlyRateMax || 999}
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                          required
                          placeholder={
                            selectedPosition?.salaryType === 'annual' 
                              ? `e.g., ${Math.round((selectedPosition.annualSalaryMin || 0) / 52 / 38)} (based on 38hrs/week)`
                              : selectedPosition 
                                ? `Between $${selectedPosition.hourlyRateMin} - $${selectedPosition.hourlyRateMax}` 
                                : 'Enter hourly rate'
                          }
                        />
                        {selectedPosition?.salaryType === 'annual' && formData.hourlyRate && (
                          <p className="text-xs text-gray-600 mt-1">
                            💰 Annual equivalent: ${(parseFloat(formData.hourlyRate) * 38 * 52).toLocaleString()}/yr (38hrs × 52 weeks)
                          </p>
                        )}
                        {formData.positionId && formData.hourlyRate && selectedPosition && selectedPosition?.salaryType === 'hourly' && (
                          parseFloat(formData.hourlyRate) < (selectedPosition.hourlyRateMin || 0) ||
                          parseFloat(formData.hourlyRate) > (selectedPosition.hourlyRateMax || 999)
                        ) && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Rate is outside position range (${selectedPosition.hourlyRateMin} - ${selectedPosition.hourlyRateMax})
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="superannuationRate">Superannuation (%)</Label>
                    <Input
                      id="superannuationRate"
                      type="number"
                      step="0.1"
                      value={formData.superannuationRate}
                      onChange={(e) => setFormData({ ...formData, superannuationRate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="overtimeRate">Overtime Multiplier</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      step="0.1"
                      value={formData.overtimeRate}
                      onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workersCompRate">Workers Comp (%)</Label>
                    <Input
                      id="workersCompRate"
                      type="number"
                      step="0.1"
                      value={formData.workersCompRate}
                      onChange={(e) => setFormData({ ...formData, workersCompRate: e.target.value })}
                    />
                  </div>
                </div>

                {formData.hourlyRate && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate:</span>
                        <span className="font-medium">${parseFloat(formData.hourlyRate || '0').toFixed(2)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Superannuation ({formData.superannuationRate}%):</span>
                        <span className="font-medium">${(parseFloat(formData.hourlyRate || '0') * parseFloat(formData.superannuationRate || '0') / 100).toFixed(2)}/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Workers Comp ({formData.workersCompRate}%):</span>
                        <span className="font-medium">${(parseFloat(formData.hourlyRate || '0') * parseFloat(formData.workersCompRate || '0') / 100).toFixed(2)}/hr</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="font-semibold text-gray-900">Total Cost:</span>
                        <span className="font-bold text-green-700">
                          ${(
                            parseFloat(formData.hourlyRate || '0') * 
                            (1 + parseFloat(formData.superannuationRate || '0') / 100 + parseFloat(formData.workersCompRate || '0') / 100)
                          ).toFixed(2)}/hr
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Management */}
            {!staff.user && (
              <Card>
                <CardHeader>
                  <CardTitle>User Account</CardTitle>
                  <CardDescription>
                    This staff member doesn't have a user account yet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    type="button"
                    onClick={handleCreateAccount}
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User Account
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/admin/dashboard/staff">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="bg-coral hover:bg-coral-600"
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
