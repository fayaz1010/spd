
'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Package,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  pendingSchedule: number;
  jobsThisWeek: number;
  jobsOverdue: number;
  avgTimePaymentToInstall: number;
  teamUtilization: number;
  pendingSubConfirmations: number;
  weatherAlerts: number;
  totalJobsThisMonth: number;
  completedThisMonth: number;
  jobsByStatus: Record<string, number>;
  jobsByTeam: Array<{ teamName: string; count: number; color: string }>;
  installationTrend: Array<{ month: string; completed: number; scheduled: number }>;
}

export default function InstallationDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/installation-dashboard/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load dashboard data</p>
          <Button onClick={fetchStats} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate status colors
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      PENDING_SCHEDULE: 'bg-yellow-500',
      SCHEDULED: 'bg-blue-500',
      SUB_CONFIRMED: 'bg-green-500',
      MATERIALS_ORDERED: 'bg-purple-500',
      MATERIALS_READY: 'bg-indigo-500',
      IN_PROGRESS: 'bg-orange-500',
      COMPLETED: 'bg-emerald-500',
      CANCELLED: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Installation Operations Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time overview of installation operations
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Schedule */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Schedule
              </p>
              <h3 className="text-3xl font-bold mt-2">{stats.pendingSchedule}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting customer selection
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          {stats.pendingSchedule > 0 && (
            <Link href="/admin/jobs?status=PENDING_SCHEDULE">
              <Button variant="link" className="p-0 h-auto mt-2">
                View Jobs →
              </Button>
            </Link>
          )}
        </Card>

        {/* Jobs This Week */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jobs This Week
              </p>
              <h3 className="text-3xl font-bold mt-2">{stats.jobsThisWeek}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled installations
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <Link href="/admin/calendar">
            <Button variant="link" className="p-0 h-auto mt-2">
              View Calendar →
            </Button>
          </Link>
        </Card>

        {/* Jobs Overdue */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jobs Overdue
              </p>
              <h3 className="text-3xl font-bold mt-2 text-red-500">
                {stats.jobsOverdue}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Past scheduling deadline
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>
          {stats.jobsOverdue > 0 && (
            <Link href="/admin/jobs?overdue=true">
              <Button variant="link" className="p-0 h-auto mt-2 text-red-500">
                Action Required →
              </Button>
            </Link>
          )}
        </Card>

        {/* Avg Time: Payment → Installation */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Lead Time
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.avgTimePaymentToInstall.toFixed(1)}
                <span className="text-lg text-muted-foreground ml-1">days</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Payment to installation
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        {/* Team Utilization */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Utilization
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.teamUtilization.toFixed(0)}%
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Average across all teams
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <Link href="/admin/dashboard/teams">
            <Button variant="link" className="p-0 h-auto mt-2">
              Manage Teams →
            </Button>
          </Link>
        </Card>

        {/* Pending Sub Confirmations */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Sub Confirms
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.pendingSubConfirmations}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting subcontractor
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
          </div>
          {stats.pendingSubConfirmations > 0 && (
            <Link href="/admin/jobs?status=PENDING_SUB_CONFIRM">
              <Button variant="link" className="p-0 h-auto mt-2">
                Follow Up →
              </Button>
            </Link>
          )}
        </Card>

        {/* Weather Alerts */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Weather Alerts
              </p>
              <h3 className="text-3xl font-bold mt-2">{stats.weatherAlerts}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                High rain probability
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          {stats.weatherAlerts > 0 && (
            <Link href="/admin/jobs?weather=true">
              <Button variant="link" className="p-0 h-auto mt-2">
                Review Alerts →
              </Button>
            </Link>
          )}
        </Card>

        {/* This Month */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                This Month
              </p>
              <h3 className="text-3xl font-bold mt-2">
                {stats.completedThisMonth}
                <span className="text-lg text-muted-foreground">/{stats.totalJobsThisMonth}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Completed / Total jobs
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Jobs by Status */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Jobs by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.jobsByStatus).map(([status, count]) => {
              const total = Object.values(stats.jobsByStatus).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded ${getStatusColor(status)}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Jobs by Team */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Jobs by Team</h3>
          <div className="space-y-3">
            {stats.jobsByTeam.map((team) => {
              const total = stats.jobsByTeam.reduce((a, b) => a + b.count, 0);
              const percentage = total > 0 ? ((team.count / total) * 100).toFixed(0) : 0;
              return (
                <div key={team.teamName} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: team.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{team.teamName}</span>
                      <span className="text-sm text-muted-foreground">
                        {team.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: team.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Installation Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Installation Trend (Last 3 Months)</h3>
        <div className="space-y-4">
          {stats.installationTrend.map((month) => (
            <div key={month.month} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{month.month}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600">
                    ✓ {month.completed} Completed
                  </span>
                  <span className="text-blue-600">
                    → {month.scheduled} Scheduled
                  </span>
                </div>
              </div>
              <div className="flex gap-1 h-8">
                <div
                  className="bg-emerald-500 rounded"
                  style={{
                    width: `${(month.completed / (month.completed + month.scheduled)) * 100}%`,
                  }}
                />
                <div
                  className="bg-blue-500 rounded"
                  style={{
                    width: `${(month.scheduled / (month.completed + month.scheduled)) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href="/admin/jobs-kanban">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Job Board
            </Button>
          </Link>
          <Link href="/admin/calendar">
            <Button variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </Link>
          <Link href="/admin/operations-map">
            <Button variant="outline" className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Operations Map
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
