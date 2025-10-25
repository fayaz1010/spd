'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  UsersRound,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';

export default function StaffTeamsLandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      const [staffRes, teamsRes] = await Promise.all([
        fetch('/api/admin/staff', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/teams', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      const staffData = await staffRes.json();
      const teamsData = await teamsRes.json();

      setStats({
        totalStaff: staffData.staff?.length || 0,
        activeStaff: staffData.staff?.filter((s: any) => s.isActive).length || 0,
        totalTeams: teamsData.teams?.length || 0,
        activeTeams: teamsData.teams?.filter((t: any) => t.isActive).length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center">
              <Users className="h-6 w-6 mr-2" />
              Staff & Teams Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage your installation teams and staff members
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats?.totalStaff || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats?.activeStaff || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teams</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats?.totalTeams || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <UsersRound className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Teams</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {stats?.activeTeams || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Staff Management Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/dashboard/staff')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Staff Management
              </CardTitle>
              <CardDescription>
                Manage individual staff members, their details, and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">View All Staff</p>
                    <p className="text-sm text-gray-600">
                      See list of all staff members
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/dashboard/staff/new" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff
                    </Button>
                  </Link>
                  <Link href="/admin/performance" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Performance
                    </Button>
                  </Link>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Employee details & compensation</li>
                    <li>• Performance metrics & bonuses</li>
                    <li>• Certifications & training</li>
                    <li>• Time tracking & attendance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Teams Management Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/dashboard/teams')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersRound className="w-6 h-6 text-purple-600" />
                Teams Management
              </CardTitle>
              <CardDescription>
                Manage installation teams, assignments, and schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">View All Teams</p>
                    <p className="text-sm text-gray-600">
                      See list of all teams
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/dashboard/teams/new" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Team
                    </Button>
                  </Link>
                  <Link href="/admin/schedule" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </Link>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Team composition & roles</li>
                    <li>• Service areas & availability</li>
                    <li>• Job assignments</li>
                    <li>• Team performance metrics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/dashboard/staff/new">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4" />
                      <span className="font-medium">Add New Staff</span>
                    </div>
                    <p className="text-xs text-gray-600">Create a new staff member profile</p>
                  </div>
                </Button>
              </Link>

              <Link href="/admin/dashboard/teams/new">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">Create Team</span>
                    </div>
                    <p className="text-xs text-gray-600">Set up a new installation team</p>
                  </div>
                </Button>
              </Link>

              <Link href="/admin/performance">
                <Button variant="outline" className="w-full justify-start h-auto py-4">
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">View Performance</span>
                    </div>
                    <p className="text-xs text-gray-600">Check leaderboards and metrics</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
