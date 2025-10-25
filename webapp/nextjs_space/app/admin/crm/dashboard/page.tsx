'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface DashboardMetrics {
  pipeline: {
    totalDeals: number;
    totalValue: number;
    avgDealSize: number;
    winRate: number;
  };
  activity: {
    callsToday: number;
    emailsToday: number;
    smsToday: number;
    tasksCompleted: number;
  };
  leads: {
    newLeads: number;
    hotLeads: number;
    contacted: number;
    converted: number;
  };
  forecast: {
    thisMonth: number;
    nextMonth: number;
    thisQuarter: number;
  };
}

export default function CRMDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/dashboard/metrics', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
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
                <h1 className="text-xl font-bold text-primary">CRM Sales Dashboard</h1>
                <p className="text-xs text-gray-500">Pipeline metrics and activity overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                This Month
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pipeline Value */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-500 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                +12.5%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Pipeline Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${((metrics?.pipeline.totalValue || 0) / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {metrics?.pipeline.totalDeals || 0} active deals
            </p>
          </Card>

          {/* Win Rate */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500 rounded-full p-3">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                +5.2%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Win Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics?.pipeline.winRate || 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </Card>

          {/* Average Deal Size */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-500 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                +8.1%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Deal Size</p>
            <p className="text-3xl font-bold text-gray-900">
              ${((metrics?.pipeline.avgDealSize || 0) / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-500 mt-2">Per installation</p>
          </Card>

          {/* New Leads */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-500 rounded-full p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                +23
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">New Leads</p>
            <p className="text-3xl font-bold text-gray-900">
              {metrics?.leads.newLeads || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">This week</p>
          </Card>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Activity */}
          <Card className="p-6 col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Today's Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Calls Made</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics?.activity.callsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Emails Sent</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics?.activity.emailsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">SMS Sent</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics?.activity.smsToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 rounded-full p-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-600">Tasks Done</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics?.activity.tasksCompleted || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Lead Status */}
          <Card className="p-6 col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Lead Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-full p-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm text-gray-600">Hot Leads</span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {metrics?.leads.hotLeads || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Contacted</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {metrics?.leads.contacted || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Converted</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {metrics?.leads.converted || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <XCircle className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-600">Lost</span>
                </div>
                <span className="text-lg font-bold text-gray-600">
                  {((metrics?.leads.newLeads || 0) - (metrics?.leads.converted || 0))}
                </span>
              </div>
            </div>
          </Card>

          {/* Revenue Forecast */}
          <Card className="p-6 col-span-1">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Revenue Forecast
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${((metrics?.forecast.thisMonth || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Next Month</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${((metrics?.forecast.nextMonth || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">This Quarter</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${((metrics?.forecast.thisQuarter || 0) / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/crm/pipeline">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Pipeline
              </Button>
            </Link>
            <Link href="/admin/crm/deals">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Manage Deals
              </Button>
            </Link>
            <Link href="/admin/crm/email">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </Link>
            <Link href="/admin/crm/automation">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Automation
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
