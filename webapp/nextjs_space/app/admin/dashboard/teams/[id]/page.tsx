'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SuburbAutocomplete } from '@/components/admin/suburb-autocomplete';
import { AddTeamMemberDialog } from '@/components/admin/add-team-member-dialog';
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
  Trash2,
  Map,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  serviceSuburbs: string[];
  serviceAreaGeoJSON: {
    type: string;
    coordinates: number[][][];
  } | null;
  isActive: boolean;
  maxConcurrentJobs: number;
  specialization: string[];
  teamType: string;
  solarInstallSpeed: number | null;
  batteryInstallSpeed: number | null;
  members: TeamMember[];
}

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Team data
  const [team, setTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [maxConcurrentJobs, setMaxConcurrentJobs] = useState(2);
  const [isActive, setIsActive] = useState(true);
  const [serviceSuburbs, setServiceSuburbs] = useState<string[]>([]);
  const [specialization, setSpecialization] = useState<string[]>([]);
  const [teamType, setTeamType] = useState('internal');
  const [solarInstallSpeed, setSolarInstallSpeed] = useState<string>('');
  const [batteryInstallSpeed, setBatteryInstallSpeed] = useState<string>('');

  // Add member dialog
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTeam();
    }
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team');
      }

      const data = await response.json();
      const teamData = data.team;

      setTeam(teamData);
      setName(teamData.name);
      setDescription(teamData.description || '');
      setColor(teamData.color);
      setMaxConcurrentJobs(teamData.maxConcurrentJobs);
      setIsActive(teamData.isActive);
      setServiceSuburbs(teamData.serviceSuburbs);
      setSpecialization(teamData.specialization || []);
      setTeamType(teamData.teamType || 'internal');
      setSolarInstallSpeed(teamData.solarInstallSpeed?.toString() || '');
      setBatteryInstallSpeed(teamData.batteryInstallSpeed?.toString() || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };




  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(
        `/api/admin/teams/${teamId}/members?memberId=${memberId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      fetchTeam();
    } catch (err: any) {
      alert(err.message);
    }
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
    setSaving(true);

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'PUT',
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
          isActive,
          specialization,
          teamType,
          solarInstallSpeed: solarInstallSpeed ? parseFloat(solarInstallSpeed) : null,
          batteryInstallSpeed: batteryInstallSpeed ? parseFloat(batteryInstallSpeed) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update team');
      }

      router.push('/admin/dashboard/teams');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading team...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Team not found</p>
      </div>
    );
  }

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
                  <h1 className="text-xl font-bold text-primary">Edit Team</h1>
                  <p className="text-xs text-gray-500">{team.name}</p>
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

              <div className="grid grid-cols-3 gap-4">
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

                <div>
                  <Label htmlFor="isActive">Team Status</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
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

          {/* Installation Performance */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Installation Speed
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure the team's average installation speeds for accurate job costing and scheduling
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Solar Install Speed */}
              <div>
                <Label htmlFor="solarSpeed">Solar Panel Speed</Label>
                <div className="mt-1 relative">
                  <Input
                    id="solarSpeed"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="3.75"
                    value={solarInstallSpeed}
                    onChange={(e) => setSolarInstallSpeed(e.target.value)}
                    className="pr-24"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    panels/hour
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Average panels installed per hour (e.g., 3.75 = 15 panels in 4 hours)
                </p>
              </div>

              {/* Battery Install Speed */}
              <div>
                <Label htmlFor="batterySpeed">Battery Installation Time</Label>
                <div className="mt-1 relative">
                  <Input
                    id="batterySpeed"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="3.0"
                    value={batteryInstallSpeed}
                    onChange={(e) => setBatteryInstallSpeed(e.target.value)}
                    className="pr-24"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    hours/unit
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Average hours to install one battery unit (e.g., 3.0 hours)
                </p>
              </div>
            </div>

            {/* Performance Examples */}
            {(solarInstallSpeed || batteryInstallSpeed) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">📊 Estimated Installation Times:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {solarInstallSpeed && parseFloat(solarInstallSpeed) > 0 && (
                    <>
                      <div className="text-blue-700">
                        <span className="font-semibold">6.6kW (15 panels):</span>{' '}
                        {(15 / parseFloat(solarInstallSpeed)).toFixed(1)} hours
                      </div>
                      <div className="text-blue-700">
                        <span className="font-semibold">10kW (23 panels):</span>{' '}
                        {(23 / parseFloat(solarInstallSpeed)).toFixed(1)} hours
                      </div>
                      <div className="text-blue-700">
                        <span className="font-semibold">13.2kW (30 panels):</span>{' '}
                        {(30 / parseFloat(solarInstallSpeed)).toFixed(1)} hours
                      </div>
                    </>
                  )}
                </div>
                {batteryInstallSpeed && parseFloat(batteryInstallSpeed) > 0 && (
                  <div className="mt-2 text-xs text-blue-700">
                    <span className="font-semibold">+ Battery:</span> Add {batteryInstallSpeed} hours per unit
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Areas */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Service Areas</h3>
              </div>
              <Link href={`/admin/dashboard/teams/${teamId}/zone-editor`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-primary border-primary"
                >
                  <Map className="h-4 w-4 mr-2" />
                  Edit Zone on Map
                </Button>
              </Link>
            </div>

            <SuburbAutocomplete
              selectedSuburbs={serviceSuburbs}
              onSuburbsChange={setServiceSuburbs}
              label="Service Suburbs"
              placeholder="Search for suburbs..."
            />

            {team?.serviceAreaGeoJSON && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Map className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">
                  Service zone defined on map
                </span>
              </div>
            )}
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
              <Button
                type="button"
                onClick={() => setShowAddMemberDialog(true)}
                variant="outline"
                size="sm"
                className="text-primary border-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>


            {team.members.length > 0 ? (
              <div className="space-y-2">
                {team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {member.name}
                        </p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-xs text-gray-500">
                          {member.email} • {member.phone}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No team members yet. Add members to get started.
              </p>
            )}
          </div>

          {/* Add Member Dialog */}
          <AddTeamMemberDialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
            teamId={teamId}
            onMemberAdded={fetchTeam}
          />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/dashboard/teams">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving || !name}
              className="bg-coral hover:bg-coral-600 text-white"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
