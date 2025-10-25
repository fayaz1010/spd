'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Zap,
  Award,
  Target,
  Clock,
  Star,
  Trophy,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function PerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [companyMetrics, setCompanyMetrics] = useState<any>(null);
  const [leaderboards, setLeaderboards] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [pendingBonuses, setPendingBonuses] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [metricsRes, leaderboardsRes, teamsRes, bonusesRes] = await Promise.all([
        fetch(`/api/admin/performance/company?month=${selectedMonth}&year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/performance/leaderboards?month=${selectedMonth}&year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/performance/teams?month=${selectedMonth}&year=${selectedYear}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/performance/bonuses/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setCompanyMetrics(data);
      }

      if (leaderboardsRes.ok) {
        const data = await leaderboardsRes.json();
        setLeaderboards(data);
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams || []);
      }

      if (bonusesRes.ok) {
        const data = await bonusesRes.json();
        setPendingBonuses(data.bonuses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBonuses = async () => {
    if (!confirm('Approve all pending bonuses for payment?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/performance/bonuses/approve', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bonusIds: pendingBonuses.map(b => b.id),
        }),
      });

      if (res.ok) {
        alert('Bonuses approved successfully!');
        fetchData();
      } else {
        throw new Error('Failed to approve bonuses');
      }
    } catch (error) {
      console.error('Error approving bonuses:', error);
      alert('Failed to approve bonuses');
    }
  };

  const exportReport = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `/api/admin/performance/export?month=${selectedMonth}&year=${selectedYear}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${selectedYear}-${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    );
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  Performance Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Company-wide performance metrics and leaderboards
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Savings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Savings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${companyMetrics?.totalSavings?.toFixed(0) || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This month
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              {companyMetrics?.savingsChange && (
                <div className="mt-3 flex items-center text-sm">
                  {companyMetrics.savingsChange > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      <span className="text-green-600">
                        +{companyMetrics.savingsChange.toFixed(1)}% from last month
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                      <span className="text-red-600">
                        {companyMetrics.savingsChange.toFixed(1)}% from last month
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Bonuses */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bonuses Paid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${companyMetrics?.totalBonuses?.toFixed(0) || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    To {companyMetrics?.staffCount || 0} staff
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Speed */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Speed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {companyMetrics?.avgSpeed?.toFixed(2) || '0.00'} hrs/kW
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: 1.5 hrs/kW
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Quality */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Quality</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {companyMetrics?.avgQuality?.toFixed(0) || '0'}/100
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: 80+
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Bonuses Alert */}
        {pendingBonuses.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900">
                      {pendingBonuses.length} Pending Bonus Payments
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Total amount: ${pendingBonuses.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button onClick={handleApproveBonuses} className="bg-orange-600 hover:bg-orange-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="leaderboards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leaderboards">Leaderboards</TabsTrigger>
            <TabsTrigger value="teams">Team Performance</TabsTrigger>
            <TabsTrigger value="bonuses">Bonus Payments</TabsTrigger>
          </TabsList>

          {/* Leaderboards Tab */}
          <TabsContent value="leaderboards" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Speed Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Fastest Installers
                  </CardTitle>
                  <CardDescription>Top performers by speed (hrs/kW)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards?.speed?.slice(0, 10).map((staff: any, idx: number) => (
                      <Link key={staff.id} href={`/admin/dashboard/staff/${staff.id}/metrics`}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                              idx === 1 ? 'bg-gray-100 text-gray-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-50 text-blue-800'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{staff.name}</p>
                              <p className="text-xs text-gray-500">{staff.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm">
                              {staff.averageInstallSpeed?.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">hrs/kW</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quality Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Highest Quality
                  </CardTitle>
                  <CardDescription>Top performers by quality score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards?.quality?.slice(0, 10).map((staff: any, idx: number) => (
                      <Link key={staff.id} href={`/admin/dashboard/staff/${staff.id}/metrics`}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                              idx === 1 ? 'bg-gray-100 text-gray-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-green-50 text-green-800'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{staff.name}</p>
                              <p className="text-xs text-gray-500">{staff.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm">
                              {staff.qualityScore?.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">/100</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bonus Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    Top Earners
                  </CardTitle>
                  <CardDescription>Highest bonus earners this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboards?.bonus?.slice(0, 10).map((staff: any, idx: number) => (
                      <Link key={staff.id} href={`/admin/dashboard/staff/${staff.id}/metrics`}>
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                              idx === 1 ? 'bg-gray-100 text-gray-800' :
                              idx === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-purple-50 text-purple-800'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{staff.name}</p>
                              <p className="text-xs text-gray-500">{staff.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm text-green-600">
                              ${staff.currentMonthBonus?.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-500">this month</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Comparison</CardTitle>
                <CardDescription>Performance metrics by team</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Avg Speed</TableHead>
                      <TableHead>Avg Quality</TableHead>
                      <TableHead>Total Bonus</TableHead>
                      <TableHead>Savings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell>
                          <Badge style={{ backgroundColor: team.color }}>
                            {team.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{team.memberCount}</TableCell>
                        <TableCell>{team.jobsCompleted}</TableCell>
                        <TableCell className="font-mono">
                          {team.avgSpeed?.toFixed(2)} hrs/kW
                        </TableCell>
                        <TableCell className="font-mono">
                          {team.avgQuality?.toFixed(0)}/100
                        </TableCell>
                        <TableCell className="font-mono text-green-600">
                          ${team.totalBonus?.toFixed(0)}
                        </TableCell>
                        <TableCell className="font-mono text-blue-600">
                          ${team.totalSavings?.toFixed(0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonuses Tab */}
          <TabsContent value="bonuses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bonus Payments</CardTitle>
                <CardDescription>All bonus payments for selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBonuses.map((bonus) => (
                      <TableRow key={bonus.id}>
                        <TableCell>
                          {new Date(bonus.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Link href={`/admin/dashboard/staff/${bonus.staffId}/metrics`}>
                            <span className="text-blue-600 hover:underline">
                              {bonus.staff?.name}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {bonus.bonusType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {bonus.reason}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-green-600">
                          ${bonus.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {bonus.paidAt ? (
                            <Badge className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
