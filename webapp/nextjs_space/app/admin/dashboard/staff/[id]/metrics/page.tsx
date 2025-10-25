'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Award,
  Target,
  Zap,
  Star,
} from 'lucide-react';
import Link from 'link';

export default function StaffMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      const [staffRes, metricsRes, jobsRes, bonusesRes] = await Promise.all([
        fetch(`/api/admin/staff/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/staff/${params.id}/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/staff/${params.id}/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/admin/staff/${params.id}/bonuses`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaff(data.staff);
      }

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics);
      }

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
      }

      if (bonusesRes.ok) {
        const data = await bonusesRes.json();
        setBonuses(data.bonuses || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Staff Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/dashboard/staff">
              <Button>Back to Staff List</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-green-600 bg-green-50';
      case 'GOOD': return 'text-blue-600 bg-blue-50';
      case 'AVERAGE': return 'text-yellow-600 bg-yellow-50';
      case 'POOR': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/admin/dashboard/staff/${params.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">
                {staff.name} - Performance Metrics
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Installation speed, quality, and bonus tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Average Speed */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Speed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {staff.averageInstallSpeed?.toFixed(2) || '0.00'} hrs/kW
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: 1.5 hrs/kW
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              {staff.averageInstallSpeed && (
                <div className="mt-3">
                  {staff.averageInstallSpeed <= 1.2 ? (
                    <Badge className="bg-green-100 text-green-800">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Excellent
                    </Badge>
                  ) : staff.averageInstallSpeed <= 1.5 ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Target className="w-3 h-3 mr-1" />
                      On Target
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Needs Improvement
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quality Score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {staff.qualityScore?.toFixed(0) || '0'}/100
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Target: 80+
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
              </div>
              {staff.qualityScore && (
                <div className="mt-3">
                  {staff.qualityScore >= 95 ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Award className="w-3 h-3 mr-1" />
                      Outstanding
                    </Badge>
                  ) : staff.qualityScore >= 80 ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Good
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Below Standard
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Bonus Earned */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bonus Earned</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${staff.totalBonusEarned?.toFixed(0) || '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    This month: ${staff.currentMonthBonus?.toFixed(0) || '0'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Jobs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Installations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {staff.totalInstallations || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {staff.totalSystemsKw?.toFixed(1) || '0'} kW total
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job History</TabsTrigger>
            <TabsTrigger value="bonuses">Bonus History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Statistics</CardTitle>
                <CardDescription>Detailed performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Speed Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average hrs/kW:</span>
                        <span className="font-mono font-medium">
                          {staff.averageInstallSpeed?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total hours worked:</span>
                        <span className="font-mono font-medium">
                          {staff.totalInstallHours?.toFixed(1) || '0.0'} hrs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total systems installed:</span>
                        <span className="font-mono font-medium">
                          {staff.totalSystemsKw?.toFixed(1) || '0.0'} kW
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quality score:</span>
                        <span className="font-mono font-medium">
                          {staff.qualityScore?.toFixed(0) || '0'}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Callback rate:</span>
                        <span className="font-mono font-medium">
                          {staff.callbackRate?.toFixed(1) || '0.0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jobs completed:</span>
                        <span className="font-mono font-medium">
                          {staff.totalInstallations || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-4">Financial Impact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 mb-1">Total Bonus Earned</p>
                      <p className="text-2xl font-bold text-green-900">
                        ${staff.totalBonusEarned?.toFixed(0) || '0'}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 mb-1">Savings Generated</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${staff.lifetimeSavings?.toFixed(0) || '0'}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600 mb-1">This Month</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ${staff.currentMonthBonus?.toFixed(0) || '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job History Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
                <CardDescription>Installation history with performance data</CardDescription>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No jobs found</p>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{job.jobNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {job.systemSize}kW System
                            </p>
                          </div>
                          {job.performanceRating && (
                            <Badge className={getPerformanceColor(job.performanceRating)}>
                              {job.performanceRating}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Time Taken</p>
                            <p className="font-medium">
                              {job.netWorkHours?.toFixed(1) || '0'} hrs
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">hrs/kW</p>
                            <p className="font-medium">
                              {job.actualHoursPerKw?.toFixed(2) || '0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Quality</p>
                            <p className="font-medium">
                              {job.qualityScore || '0'}/100
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Bonus</p>
                            <p className="font-medium text-green-600">
                              ${job.bonusEarned?.toFixed(0) || '0'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonus History Tab */}
          <TabsContent value="bonuses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bonus Payments</CardTitle>
                <CardDescription>All bonus payments received</CardDescription>
              </CardHeader>
              <CardContent>
                {bonuses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No bonuses yet</p>
                ) : (
                  <div className="space-y-4">
                    {bonuses.map((bonus) => (
                      <div key={bonus.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{bonus.bonusType.replace('_', ' ')}</h4>
                            <p className="text-sm text-gray-600">{bonus.reason}</p>
                          </div>
                          <p className="text-lg font-bold text-green-600">
                            ${bonus.amount.toFixed(2)}
                          </p>
                        </div>

                        {bonus.standardHours && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-gray-600">Standard</p>
                                <p className="font-medium">{bonus.standardHours} hrs</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Actual</p>
                                <p className="font-medium">{bonus.actualHours} hrs</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Saved</p>
                                <p className="font-medium text-green-600">
                                  {bonus.hoursSaved} hrs
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-500">
                          {bonus.paidAt ? (
                            <span className="text-green-600">
                              ✓ Paid on {new Date(bonus.paidAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-yellow-600">
                              Pending payment
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
