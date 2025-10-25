
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SuburbAutocomplete } from '@/components/admin/suburb-autocomplete';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Plus,
  X,
  Users,
  MapPin,
  User,
  Mail,
  Phone,
  Briefcase,
  CheckCircle,
  Shield,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  staffId?: string;
  electricianId?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hasElectricianCredentials?: boolean;
  electricalLicense?: string;
  cecNumber?: string;
}

interface StaffWithElectrician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  electricianId: string;
  electrician: {
    id: string;
    firstName: string;
    lastName: string;
    electricalLicense?: string;
    licenseNumber?: string;
    licenseExpiry?: string;
    licenseVerified: boolean;
    cecNumber?: string;
    cecExpiry?: string;
    cecVerified: boolean;
  };
}

export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Team basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(2);

  // Team specialization and type
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [teamType, setTeamType] = useState('internal');

  // Service areas
  const [serviceSuburbs, setServiceSuburbs] = useState<string[]>([]);

  // Team members
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showStaffSelector, setShowStaffSelector] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<StaffWithElectrician[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [memberForm, setMemberForm] = useState<TeamMember>({
    name: '',
    email: '',
    phone: '',
    role: '',
  });

  // Fetch available staff with electrician credentials
  useEffect(() => {
    fetchAvailableStaff();
  }, []);

  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/staff/with-electrician', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoadingStaff(false);
    }
  };



  const handleAddMember = () => {
    if (
      memberForm.name &&
      memberForm.email &&
      memberForm.phone &&
      memberForm.role
    ) {
      setMembers([...members, memberForm]);
      setMemberForm({ name: '', email: '', phone: '', role: '' });
      setShowMemberForm(false);
    }
  };

  const handleAddStaffMember = (staff: StaffWithElectrician) => {
    // Check if already added
    if (members.some(m => m.staffId === staff.id)) {
      return;
    }

    const newMember: TeamMember = {
      staffId: staff.id,
      electricianId: staff.electricianId,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      hasElectricianCredentials: true,
      electricalLicense: staff.electrician.licenseNumber,
      cecNumber: staff.electrician.cecNumber,
    };

    setMembers([...members, newMember]);
    setShowStaffSelector(false);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleSpecializationToggle = (spec: string) => {
    if (specialization.includes(spec)) {
      setSpecialization(specialization.filter((s) => s !== spec));
    } else {
      setSpecialization([...specialization, spec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          color,
          serviceSuburbs,
          maxConcurrentJobs,
          specialization,
          teamType,
          members,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create team');
      }

      router.push('/admin/dashboard/teams');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Red' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#14b8a6', label: 'Teal' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard/teams">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Teams
                </Button>
              </Link>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    Create New Team
                  </h1>
                  <p className="text-xs text-gray-500">
                    Set up a new installation team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., North Team, South Team"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this team"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Team Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setColor(option.value)}
                        className={`h-10 w-10 rounded-lg border-2 transition-all ${
                          color === option.value
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxJobs">Max Concurrent Jobs</Label>
                  <Input
                    id="maxJobs"
                    type="number"
                    min="1"
                    max="10"
                    value={maxConcurrentJobs}
                    onChange={(e) =>
                      setMaxConcurrentJobs(parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Team Specialization & Type */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Team Capabilities
            </h3>

            <div className="space-y-4">
              {/* Team Type */}
              <div>
                <Label htmlFor="teamType">Team Type *</Label>
                <select
                  id="teamType"
                  value={teamType}
                  onChange={(e) => setTeamType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="internal">Internal Team</option>
                  <option value="subcontractor">Subcontractor</option>
                  <option value="hybrid">Hybrid (Internal + Subcontractor)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Specify whether this team is in-house, outsourced, or a mix of both
                </p>
              </div>

              {/* Specialization */}
              <div>
                <Label>Team Specializations *</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Select all types of installations this team can perform
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'solar', label: 'Solar Panel Installation', icon: '☀️' },
                    { value: 'battery', label: 'Battery Installation', icon: '🔋' },
                    { value: 'ev_charger', label: 'EV Charger Installation', icon: '⚡' },
                    { value: 'hot_water', label: 'Solar Hot Water', icon: '💧' },
                    { value: 'maintenance', label: 'System Maintenance', icon: '🔧' },
                  ].map((spec) => (
                    <button
                      key={spec.value}
                      type="button"
                      onClick={() => handleSpecializationToggle(spec.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        specialization.includes(spec.value)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{spec.icon}</span>
                      <span className="text-sm font-medium text-left">
                        {spec.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-gray-900">Service Areas</h3>
            </div>

            <SuburbAutocomplete
              selectedSuburbs={serviceSuburbs}
              onSuburbsChange={setServiceSuburbs}
              label="Service Suburbs"
              placeholder="Search for suburbs..."
            />
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">
                  Team Members
                </h3>
              </div>
              {!showMemberForm && !showStaffSelector && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setShowStaffSelector(true)}
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Add from Staff
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowMemberForm(true)}
                    variant="outline"
                    size="sm"
                    className="text-primary border-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual
                  </Button>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Recommended:</strong> Add in-house electricians from staff to automatically include their licenses and certifications in documentation.
              </AlertDescription>
            </Alert>

            {/* Staff Selector */}
            {showStaffSelector && (
              <div className="border-2 border-emerald-500/20 rounded-lg p-4 mb-4 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Select from Staff (with Electrician Credentials)</h4>
                  <Button
                    type="button"
                    onClick={() => setShowStaffSelector(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {loadingStaff ? (
                  <p className="text-sm text-gray-600 text-center py-4">Loading staff...</p>
                ) : availableStaff.length === 0 ? (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertDescription className="text-yellow-800 text-sm">
                      No staff members with electrician credentials found. Create electrician profiles in Staff Management first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableStaff.map((staff) => {
                      const isAdded = members.some(m => m.staffId === staff.id);
                      const licenseValid = staff.electrician.licenseVerified;
                      const cecValid = staff.electrician.cecVerified;
                      
                      return (
                        <div
                          key={staff.id}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                            isAdded 
                              ? 'bg-gray-100 border-gray-300 opacity-50' 
                              : 'bg-white border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{staff.name}</p>
                              <p className="text-sm text-gray-600">{staff.role}</p>
                              <div className="flex gap-2 mt-1">
                                {staff.electrician.licenseNumber && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    licenseValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {licenseValid ? '✓' : '⚠'} License: {staff.electrician.licenseNumber}
                                  </span>
                                )}
                                {staff.electrician.cecNumber && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    cecValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {cecValid ? '✓' : '⚠'} CEC: {staff.electrician.cecNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleAddStaffMember(staff)}
                            disabled={isAdded}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {isAdded ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {showMemberForm && (
              <div className="border-2 border-primary/20 rounded-lg p-4 mb-4 bg-primary/5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="memberName">Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="memberName"
                        value={memberForm.name}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, name: e.target.value })
                        }
                        placeholder="John Smith"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="memberEmail">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="memberEmail"
                        type="email"
                        value={memberForm.email}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            email: e.target.value,
                          })
                        }
                        placeholder="john@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="memberPhone">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="memberPhone"
                        value={memberForm.phone}
                        onChange={(e) =>
                          setMemberForm({
                            ...memberForm,
                            phone: e.target.value,
                          })
                        }
                        placeholder="0412 345 678"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="memberRole">Role *</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="memberRole"
                        value={memberForm.role}
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, role: e.target.value })
                        }
                        placeholder="e.g., Lead Installer, Electrician"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddMember}
                    className="bg-primary hover:bg-primary-600"
                  >
                    Add Member
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowMemberForm(false);
                      setMemberForm({
                        name: '',
                        email: '',
                        phone: '',
                        role: '',
                      });
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                      member.hasElectricianCredentials 
                        ? 'border-emerald-200 bg-emerald-50/30' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        member.hasElectricianCredentials 
                          ? 'bg-emerald-100' 
                          : 'bg-primary/10'
                      }`}>
                        {member.hasElectricianCredentials ? (
                          <Shield className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <User className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {member.name}
                          </p>
                          {member.hasElectricianCredentials && (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-xs text-gray-500">
                          {member.email} • {member.phone}
                        </p>
                        {member.hasElectricianCredentials && (
                          <div className="flex gap-2 mt-1">
                            {member.electricalLicense && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                License: {member.electricalLicense}
                              </span>
                            )}
                            {member.cecNumber && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                CEC: {member.cecNumber}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No team members added yet. Add members to get started.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/dashboard/teams">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !name}
              className="bg-coral hover:bg-coral-600 text-white"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
