'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  MapPin,
  Zap,
  Battery,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Package,
  Phone,
  Mail,
  FileText,
  LogOut,
  Home,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { ReviewSubmissionCard } from '@/components/portal/ReviewSubmissionCard';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchDashboard();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/portal/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        router.push('/portal/login');
        return;
      }

      const result = await response.json();
      setUser(result.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/portal/login');
    }
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/portal/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/portal/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">Unable to load your project</p>
            <Button onClick={() => router.push('/portal/login')}>Back to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary">My Solar Project</h1>
              <p className="text-sm text-gray-600">Welcome back, {data.customer.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/portal/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <Card className="mb-6 bg-gradient-to-br from-coral to-orange-600 text-white">
          <CardContent className="py-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{data.progress.currentStage}</h2>
                <p className="text-white/90">{data.progress.nextStep}</p>
              </div>
              {data.progress.daysUntilInstallation !== null && data.progress.daysUntilInstallation >= 0 && (
                <div className="text-center bg-white/20 rounded-lg p-4">
                  <div className="text-4xl font-bold">{data.progress.daysUntilInstallation}</div>
                  <div className="text-sm">days until installation</div>
                </div>
              )}
            </div>
            <Progress value={data.progress.percentage} className="h-3 bg-white/30" />
            <p className="text-sm text-white/80 mt-2">{data.progress.percentage}% Complete</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Details */}
            {data.quote && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Your Quote
                    </CardTitle>
                    <Badge variant={data.quote.status === 'accepted' ? 'default' : 'secondary'}>
                      {data.quote.status}
                    </Badge>
                  </div>
                  <CardDescription>Quote #{data.quote.quoteReference}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="flex items-center mb-2">
                        <Zap className="h-5 w-5 mr-2 text-gray-400" />
                        <p className="text-sm text-gray-500">System Size</p>
                      </div>
                      <p className="text-2xl font-bold">{data.quote.systemSizeKw}kW</p>
                      <p className="text-sm text-gray-500">{data.quote.numPanels} panels</p>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <Battery className="h-5 w-5 mr-2 text-gray-400" />
                        <p className="text-sm text-gray-500">Battery</p>
                      </div>
                      <p className="text-2xl font-bold">
                        {data.quote.batterySizeKwh > 0 ? `${data.quote.batterySizeKwh}kWh` : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Total Investment</span>
                      <span className="text-2xl font-bold text-primary">
                        ${data.quote.totalCost.toLocaleString()}
                      </span>
                    </div>
                    {data.quote.depositAmount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Deposit Required</span>
                        <span className="font-medium">
                          ${data.quote.depositAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {data.quote.status !== 'accepted' && (
                    <div className="mt-6">
                      <Button className="w-full bg-coral hover:bg-coral-600">
                        Accept Quote
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Installation Timeline */}
            {data.job && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Installation Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Timeline Steps */}
                    <TimelineStep
                      icon={<CheckCircle className="h-5 w-5" />}
                      title="Quote Accepted"
                      completed={true}
                      current={false}
                    />
                    <TimelineStep
                      icon={<DollarSign className="h-5 w-5" />}
                      title="Deposit Paid"
                      completed={data.payment.depositPaid}
                      current={!data.payment.depositPaid}
                    />
                    <TimelineStep
                      icon={<Package className="h-5 w-5" />}
                      title="Materials Ordered"
                      completed={data.job.materialOrders.length > 0}
                      current={data.payment.depositPaid && data.job.materialOrders.length === 0}
                    />
                    <TimelineStep
                      icon={<Calendar className="h-5 w-5" />}
                      title="Installation Scheduled"
                      completed={!!data.job.scheduledDate}
                      current={data.job.materialOrders.length > 0 && !data.job.scheduledDate}
                      date={data.job.scheduledDate}
                    />
                    <TimelineStep
                      icon={<Users className="h-5 w-5" />}
                      title="Installation In Progress"
                      completed={data.job.status === 'completed'}
                      current={data.job.status === 'in_progress'}
                    />
                    <TimelineStep
                      icon={<CheckCircle className="h-5 w-5" />}
                      title="System Activated"
                      completed={data.job.status === 'completed'}
                      current={false}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Status */}
            {!data.payment.depositPaid && data.quote?.status === 'accepted' && (
              <Card className="border-coral">
                <CardHeader>
                  <CardTitle className="flex items-center text-coral">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Action Required: Pay Deposit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    To proceed with your installation, please pay the deposit amount of{' '}
                    <strong>${data.payment.depositAmount?.toLocaleString()}</strong>
                  </p>
                  <Button className="w-full bg-coral hover:bg-coral-600">
                    Pay Deposit Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review Submission - Show after installation completed */}
            {data.job?.status === 'completed' && (
              <ReviewSubmissionCard
                jobId={data.job.id}
                customerName={data.customer.name}
                customerEmail={data.customer.email}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Installation Address</p>
                    <p className="font-medium">{data.customer.address}</p>
                    <p className="text-sm text-gray-600">{data.customer.suburb}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{data.customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm">{data.customer.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installation Team */}
            {data.job?.team && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Your Installation Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium mb-3">{data.job.team.name}</p>
                  <div className="space-y-2">
                    {data.job.team.members.map((member: any, index: number) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-gray-500">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Materials */}
            {data.job?.materialOrders && data.job.materialOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.job.materialOrders.map((order: any) => (
                    <div key={order.id} className="mb-3 last:mb-0">
                      <p className="font-medium text-sm">{order.poNumber}</p>
                      <p className="text-xs text-gray-500">{order.supplier}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card className="bg-primary text-white">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/90 mb-4">
                  Our team is here to help with any questions
                </p>
                <Button variant="secondary" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Timeline Step Component
function TimelineStep({
  icon,
  title,
  completed,
  current,
  date,
}: {
  icon: React.ReactNode;
  title: string;
  completed: boolean;
  current: boolean;
  date?: string | null;
}) {
  return (
    <div className="flex items-start">
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          completed
            ? 'bg-green-100 text-green-600'
            : current
            ? 'bg-coral text-white'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <div className="ml-4 flex-1">
        <p
          className={`font-medium ${
            completed ? 'text-green-600' : current ? 'text-coral' : 'text-gray-500'
          }`}
        >
          {title}
        </p>
        {date && (
          <p className="text-sm text-gray-500 mt-1">
            {new Date(date).toLocaleDateString('en-AU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
