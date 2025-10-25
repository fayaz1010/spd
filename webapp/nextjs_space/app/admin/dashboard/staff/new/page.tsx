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
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
}

export default function NewStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamId: '',
    role: '',
    isActive: true,
    createAccount: true,
    accountRole: 'TEAM_MEMBER',
    // Compensation fields
    employmentType: 'FULL_TIME',
    baseSalary: '',
    hourlyRate: '',
    overtimeRate: '',
    payFrequency: 'FORTNIGHTLY',
    superannuationRate: '11.0',
    // Contact & Emergency
    address: '',
    suburb: '',
    postcode: '',
    emergencyContact: '',
    emergencyPhone: '',
    // Employment details
    employeeNumber: '',
    startDate: '',
  });

  useEffect(() => {
    fetchTeams();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: data.account?.created
          ? `Staff member created with account. Temp password: ${data.account.tempPassword}`
          : 'Staff member created successfully',
      });

      router.push('/admin/dashboard/staff');
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create staff member',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-2xl font-bold text-primary flex items-center">
                <UserPlus className="h-6 w-6 mr-2" />
                Add Staff Member
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Create a new team member and optionally create their user account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the staff member's personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
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
                      placeholder="john@example.com"
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
                      placeholder="0400 123 456"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team & Role */}
            <Card>
              <CardHeader>
                <CardTitle>Team Assignment</CardTitle>
                <CardDescription>
                  Assign the staff member to a team and role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="teamId">Team *</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role">Role/Position *</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Lead Installer, Electrician, Assistant"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter their job title or position
                  </p>
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
                <CardTitle>Compensation & Pay</CardTitle>
                <CardDescription>
                  Set pay rates and employment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employmentType">Employment Type *</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CASUAL">Casual</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="APPRENTICE">Apprentice</SelectItem>
                        <SelectItem value="SUBCONTRACTOR">Subcontractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <Input
                      id="employeeNumber"
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                      placeholder="EMP-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseSalary">Base Salary (Annual)</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                      placeholder="75000"
                      step="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For salaried employees
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ⭐</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="58.00"
                      step="0.50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used for in-house team cost calculations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overtimeRate">Overtime Rate (1.5x)</Label>
                    <Input
                      id="overtimeRate"
                      type="number"
                      value={formData.overtimeRate}
                      onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                      placeholder="87.00"
                      step="0.50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payFrequency">Pay Frequency</Label>
                    <Select
                      value={formData.payFrequency}
                      onValueChange={(value) => setFormData({ ...formData, payFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="FORTNIGHTLY">Fortnightly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="superannuationRate">Superannuation Rate (%)</Label>
                    <Input
                      id="superannuationRate"
                      type="number"
                      value={formData.superannuationRate}
                      onChange={(e) => setFormData({ ...formData, superannuationRate: e.target.value })}
                      step="0.1"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current Australian rate: 11% (increasing to 12% July 2025)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Emergency */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Emergency Details</CardTitle>
                <CardDescription>
                  Address and emergency contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input
                      id="suburb"
                      value={formData.suburb}
                      onChange={(e) => setFormData({ ...formData, suburb: e.target.value })}
                      placeholder="Perth"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      placeholder="6000"
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Contact Name</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="Jane Smith"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyPhone">Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                        placeholder="0400 123 456"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Creation */}
            <Card>
              <CardHeader>
                <CardTitle>User Account</CardTitle>
                <CardDescription>
                  Create a login account for this staff member
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createAccount"
                    checked={formData.createAccount}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, createAccount: checked as boolean })
                    }
                  />
                  <Label htmlFor="createAccount" className="font-normal cursor-pointer">
                    Create user account (allows login to system)
                  </Label>
                </div>

                {formData.createAccount && (
                  <div>
                    <Label htmlFor="accountRole">Account Role</Label>
                    <Select
                      value={formData.accountRole}
                      onValueChange={(value) => setFormData({ ...formData, accountRole: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Team Members can view and update their assigned jobs. Admins have full access.
                    </p>
                  </div>
                )}

                {formData.createAccount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> A temporary password will be generated and displayed after creation.
                      The staff member should change it on first login.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <Link href="/admin/dashboard/staff">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-coral hover:bg-coral-600"
              >
                {loading ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Staff Member
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
