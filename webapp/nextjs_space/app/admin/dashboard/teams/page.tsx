
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  User,
  BriefcaseIcon,
  ArrowLeft,
  CheckCircle,
  XCircle,
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
  isActive: boolean;
  maxConcurrentJobs: number;
  specialization: string[];
  teamType: string;
  members: TeamMember[];
  _count: {
    jobs: number;
  };
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getSpecializationIcon = (spec: string) => {
    const icons: { [key: string]: string } = {
      solar: '☀️',
      battery: '🔋',
      ev_charger: '⚡',
      hot_water: '💧',
      maintenance: '🔧',
    };
    return icons[spec] || '📦';
  };

  const getSpecializationLabel = (spec: string) => {
    const labels: { [key: string]: string } = {
      solar: 'Solar',
      battery: 'Battery',
      ev_charger: 'EV Charger',
      hot_water: 'Hot Water',
      maintenance: 'Maintenance',
    };
    return labels[spec] || spec;
  };

  const getTeamTypeBadge = (type: string) => {
    const badges: { [key: string]: { label: string; color: string } } = {
      internal: { label: 'Internal', color: 'bg-blue-100 text-blue-700' },
      subcontractor: {
        label: 'Subcontractor',
        color: 'bg-purple-100 text-purple-700',
      },
      hybrid: { label: 'Hybrid', color: 'bg-green-100 text-green-700' },
    };
    return badges[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await fetch('/api/admin/teams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data.teams);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete team');
      }

      fetchTeams();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading teams...</p>
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
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-primary">
                    Team Management
                  </h1>
                  <p className="text-xs text-gray-500">
                    Manage installation teams and members
                  </p>
                </div>
              </div>
            </div>
            <Link href="/admin/dashboard/teams/new">
              <Button className="bg-coral hover:bg-coral-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {teams.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first installation team to get started.
            </p>
            <Link href="/admin/dashboard/teams/new">
              <Button className="bg-coral hover:bg-coral-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create First Team
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-coral hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Team Color Bar */}
                <div
                  className="h-2"
                  style={{ backgroundColor: team.color }}
                />

                <div className="p-6">
                  {/* Team Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-sm text-gray-600">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {team.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* Team Type & Specializations */}
                  <div className="mb-4">
                    {/* Team Type Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getTeamTypeBadge(team.teamType || 'internal').color
                        }`}
                      >
                        {getTeamTypeBadge(team.teamType || 'internal').label}
                      </span>
                    </div>

                    {/* Specializations */}
                    {team.specialization && team.specialization.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Specializations:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {team.specialization.map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-xs text-primary font-medium"
                            >
                              <span>{getSpecializationIcon(spec)}</span>
                              <span>{getSpecializationLabel(spec)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {team.members.length}
                      </p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-coral">
                        {team._count.jobs}
                      </p>
                      <p className="text-xs text-gray-500">Jobs</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <MapPin className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-2xl font-bold text-emerald">
                        {team.serviceSuburbs.length}
                      </p>
                      <p className="text-xs text-gray-500">Areas</p>
                    </div>
                  </div>

                  {/* Service Areas */}
                  {team.serviceSuburbs.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Service Areas:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {team.serviceSuburbs.slice(0, 3).map((suburb) => (
                          <span
                            key={suburb}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                          >
                            {suburb}
                          </span>
                        ))}
                        {team.serviceSuburbs.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                            +{team.serviceSuburbs.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Team Members Preview */}
                  {team.members.length > 0 && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Team Members:
                      </p>
                      <div className="space-y-1">
                        {team.members.slice(0, 2).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2"
                          >
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.role}
                              </p>
                            </div>
                          </div>
                        ))}
                        {team.members.length > 2 && (
                          <p className="text-xs text-gray-500 pl-8">
                            +{team.members.length - 2} more members
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/dashboard/teams/${team.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    {deleteConfirm === team.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(team.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(team.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
