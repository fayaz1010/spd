'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  DollarSign,
  FileText,
  Users,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Integration {
  id: string;
  provider: string;
  type: string;
  enabled: boolean;
  connected: boolean;
  lastSyncAt?: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectXero = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/integrations/xero/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect to Xero',
        variant: 'destructive',
      });
    }
  };

  const handleConnectQuickBooks = async () => {
    toast({
      title: 'Coming Soon',
      description: 'QuickBooks integration will be available soon',
    });
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setIntegrations(integrations.map(i => 
          i.id === id ? { ...i, enabled } : i
        ));
        toast({
          title: enabled ? 'Integration Enabled' : 'Integration Disabled',
          description: `Integration has been ${enabled ? 'enabled' : 'disabled'}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update integration',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading integrations...</p>
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
              <Link href="/admin/settings">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Integrations</h1>
                <p className="text-xs text-gray-500">Connect external services</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Xero */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Xero</h3>
                  <p className="text-sm text-gray-600">Accounting Software</p>
                </div>
              </div>
              {integrations.find(i => i.provider === 'XERO')?.connected ? (
                <Badge className="bg-green-100 text-green-700">Connected</Badge>
              ) : (
                <Badge variant="outline">Not Connected</Badge>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Automatically sync invoices, payments, and customers to Xero
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Sync invoices automatically</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Track payments in real-time</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Sync customer contacts</span>
              </div>
            </div>

            {integrations.find(i => i.provider === 'XERO')?.connected ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enable sync</span>
                  <Switch
                    checked={integrations.find(i => i.provider === 'XERO')?.enabled}
                    onCheckedChange={(checked) => {
                      const xero = integrations.find(i => i.provider === 'XERO');
                      if (xero) handleToggle(xero.id, checked);
                    }}
                  />
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnectXero} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Xero
              </Button>
            )}
          </Card>

          {/* QuickBooks */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">QuickBooks</h3>
                  <p className="text-sm text-gray-600">Accounting Software</p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Sync your financial data with QuickBooks Online
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Invoice synchronization</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Payment tracking</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Expense management</span>
              </div>
            </div>

            <Button onClick={handleConnectQuickBooks} variant="outline" className="w-full" disabled>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect QuickBooks
            </Button>
          </Card>

          {/* Twilio */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Twilio</h3>
                  <p className="text-sm text-gray-600">SMS & Voice</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Send SMS messages and make calls through Twilio
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Send SMS to customers</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Track message delivery</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Automated campaigns</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Enable SMS</span>
              <Switch checked={true} />
            </div>
          </Card>

          {/* Microsoft 365 */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Microsoft 365</h3>
                  <p className="text-sm text-gray-600">Email & Calendar</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Send emails and sync calendar events with Microsoft 365
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Send emails from CRM</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Track email opens</span>
              </div>
              <div className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span>Calendar integration</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Enable email</span>
              <Switch checked={true} />
            </div>
          </Card>
        </div>

        {/* Integration Stats */}
        <Card className="mt-6 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Integration Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">2</p>
              <p className="text-sm text-gray-600 mt-1">Connected</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">156</p>
              <p className="text-sm text-gray-600 mt-1">Syncs Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">2,340</p>
              <p className="text-sm text-gray-600 mt-1">Total Syncs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">99.8%</p>
              <p className="text-sm text-gray-600 mt-1">Success Rate</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
