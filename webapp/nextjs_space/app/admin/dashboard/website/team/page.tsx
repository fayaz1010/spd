'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Eye,
  Upload,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  sortOrder: number;
}

export default function ManageTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      
      if (data.success) {
        setTeam(data.team || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (member: TeamMember) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/team', {
        method: member.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Team member ${member.id ? 'updated' : 'added'} successfully!`);
        loadData();
        setEditing(null);
      } else {
        toast.error('Failed to save team member');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Team member removed successfully!');
        loadData();
      } else {
        toast.error('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to remove team member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/dashboard/website')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Management
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Team Profiles</h1>
              <p className="text-gray-600 mt-1">Staff bios and team member profiles</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/about#team', '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => setEditing({
                  id: '',
                  name: '',
                  role: '',
                  bio: '',
                  image: '',
                  sortOrder: team.length + 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="mb-6 border-coral">
            <CardHeader>
              <CardTitle>{editing.id ? 'Edit Team Member' : 'New Team Member'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role/Position
                  </label>
                  <Input
                    value={editing.role}
                    onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                    placeholder="Managing Director"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <Textarea
                  value={editing.bio}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  rows={3}
                  placeholder="Over 15 years of experience in renewable energy..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={editing.image}
                      onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                      placeholder="/team/john.jpg"
                    />
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={editing.sortOrder}
                    onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSave(editing)}
                  disabled={saving}
                  className="bg-coral hover:bg-coral/90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Team Member
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {team.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-end mb-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-coral font-semibold text-sm mb-2">{member.role}</p>
                <p className="text-xs text-gray-600">{member.bio}</p>
                <p className="text-xs text-gray-400 mt-2">Order: {member.sortOrder}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {team.length === 0 && !editing && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No team members yet</p>
              <Button
                onClick={() => setEditing({
                  id: '',
                  name: '',
                  role: '',
                  bio: '',
                  image: '',
                  sortOrder: 1,
                })}
                className="bg-coral hover:bg-coral/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Team Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
