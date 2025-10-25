'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Users,
  Shuffle,
  MapPin,
  Target,
  Bell,
  Save,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface DistributionSettings {
  autoAssignEnabled: boolean;
  assignmentMethod: 'round-robin' | 'territory' | 'load-balance' | 'manual';
  notifyOnAssignment: boolean;
  reassignInactive: boolean;
  inactiveThresholdHours: number;
  territoryRules: TerritoryRule[];
}

interface TerritoryRule {
  id: string;
  name: string;
  postcodes: string[];
  assignedTo: string;
  assignedToName: string;
  active: boolean;
}

export default function LeadDistribution() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DistributionSettings>({
    autoAssignEnabled: false,
    assignmentMethod: 'round-robin',
    notifyOnAssignment: true,
    reassignInactive: false,
    inactiveThresholdHours: 24,
    territoryRules: [],
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    unassignedLeads: 0,
    assignedToday: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    fetchSettings();
    fetchTeamMembers();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/distribution/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/team-members', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.teamMembers || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/distribution/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/distribution/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Lead distribution settings updated successfully',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDistributeNow = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/distribution/distribute-now', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Distribution Complete',
          description: `Assigned ${data.assigned} leads to team members`,
        });
        fetchStats();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to distribute leads',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Lead Distribution</h1>
                <p className="text-xs text-gray-500">Auto-assign leads to team members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDistributeNow}
                variant="outline"
                size="sm"
                disabled={!settings.autoAssignEnabled}
              >
                <Play className="h-4 w-4 mr-2" />
                Distribute Now
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-orange-500 rounded-full p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Unassigned Leads</p>
            <p className="text-3xl font-bold text-gray-900">{stats.unassignedLeads}</p>
            <p className="text-xs text-gray-500 mt-2">Waiting for assignment</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Assigned Today</p>
            <p className="text-3xl font-bold text-gray-900">{stats.assignedToday}</p>
            <p className="text-xs text-gray-500 mt-2">Automatically distributed</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-blue-500 rounded-full p-3">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgResponseTime}h</p>
            <p className="text-xs text-gray-500 mt-2">First contact time</p>
          </Card>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-blue-600" />
              General Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoAssign">Auto-Assign New Leads</Label>
                  <p className="text-xs text-gray-500">Automatically assign leads when they arrive</p>
                </div>
                <Switch
                  id="autoAssign"
                  checked={settings.autoAssignEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoAssignEnabled: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="method">Assignment Method</Label>
                <select
                  id="method"
                  value={settings.assignmentMethod}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      assignmentMethod: e.target.value as any,
                    })
                  }
                  className="w-full mt-2 p-2 border border-gray-300 rounded-md"
                >
                  <option value="round-robin">Round Robin (Equal distribution)</option>
                  <option value="territory">Territory-Based (By postcode)</option>
                  <option value="load-balance">Load Balance (By workload)</option>
                  <option value="manual">Manual Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {settings.assignmentMethod === 'round-robin' && 'Distributes leads evenly across team'}
                  {settings.assignmentMethod === 'territory' && 'Assigns based on postcode rules'}
                  {settings.assignmentMethod === 'load-balance' && 'Assigns to least busy team member'}
                  {settings.assignmentMethod === 'manual' && 'Requires manual assignment'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify">Notify on Assignment</Label>
                  <p className="text-xs text-gray-500">Send email/SMS when lead assigned</p>
                </div>
                <Switch
                  id="notify"
                  checked={settings.notifyOnAssignment}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifyOnAssignment: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reassign">Reassign Inactive Leads</Label>
                  <p className="text-xs text-gray-500">Reassign if no contact made</p>
                </div>
                <Switch
                  id="reassign"
                  checked={settings.reassignInactive}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, reassignInactive: checked })
                  }
                />
              </div>

              {settings.reassignInactive && (
                <div>
                  <Label htmlFor="threshold">Inactive Threshold (hours)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.inactiveThresholdHours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        inactiveThresholdHours: parseInt(e.target.value) || 24,
                      })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Reassign if no contact after {settings.inactiveThresholdHours} hours
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Territory Rules */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Territory Rules
            </h3>
            {settings.assignmentMethod === 'territory' ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Define postcode territories for automatic assignment
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Add Territory Rule
                </Button>
                {settings.territoryRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No territory rules configured yet
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                Territory rules only apply when "Territory-Based" method is selected
              </div>
            )}
          </Card>
        </div>

        {/* Team Member Load */}
        <Card className="p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Team Member Workload
          </h3>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">
                No team members found. Add team members to enable distribution.
              </p>
            ) : (
              teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {member.assignedLeads || 0} leads
                    </p>
                    <p className="text-xs text-gray-500">Active assignments</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
