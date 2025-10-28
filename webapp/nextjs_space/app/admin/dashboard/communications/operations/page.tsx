'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  Package,
  Users,
  TrendingUp,
  ExternalLink,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface OperationItem {
  id: string;
  type: string;
  status: string;
  subject: string;
  relatedRecord: string;
  recordType: string;
  recordId: string;
  lastUpdate: string;
  emailCount: number;
  requiresAction: boolean;
}

export default function OperationsIntelligence() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Operations data
  const [approvals, setApprovals] = useState<OperationItem[]>([]);
  const [rebates, setRebates] = useState<OperationItem[]>([]);
  const [orders, setOrders] = useState<OperationItem[]>([]);
  const [subcontractors, setSubcontractors] = useState<OperationItem[]>([]);
  const [plenti, setPlenti] = useState<OperationItem[]>([]);

  // Stats
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    pendingRebates: 0,
    activeOrders: 0,
    unlinkedEmails: 0,
    requiresAction: 0
  });

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Fetch operations intelligence data
      const response = await fetch('/api/admin/communications/operations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setApprovals(data.approvals || []);
        setRebates(data.rebates || []);
        setOrders(data.orders || []);
        setSubcontractors(data.subcontractors || []);
        setPlenti(data.plenti || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to fetch operations data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch operations data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/communications/email/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Emails synced and categorized'
        });
        await fetchOperationsData();
      }
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'received':
        return <Badge className="bg-purple-500">Received</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
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
              <Link href="/admin/dashboard/communications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Operations Intelligence</h1>
                  <p className="text-xs text-gray-500">Email-linked operations tracking & visualization</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncEmails}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync & Analyze
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
              </div>
              <Clock className="h-10 w-10 text-orange-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Rebates</p>
                <p className="text-3xl font-bold text-blue-600">{stats.pendingRebates}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-purple-600">{stats.activeOrders}</p>
              </div>
              <Package className="h-10 w-10 text-purple-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-red-50 to-white border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Requires Action</p>
                <p className="text-3xl font-bold text-red-600">{stats.requiresAction}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unlinked Emails</p>
                <p className="text-3xl font-bold text-gray-600">{stats.unlinkedEmails}</p>
              </div>
              <Mail className="h-10 w-10 text-gray-400" />
            </div>
          </Card>
        </div>

        {/* Network Approvals (Synergy & Western Power) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-6 w-6 text-orange-600" />
              Network Approvals (Synergy & Western Power)
            </h2>
            <Link href="/admin/dashboard/communications/email/groups?category=approval">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {approvals.length === 0 ? (
              <Card className="p-8 text-center col-span-2">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No pending approvals</p>
              </Card>
            ) : (
              approvals.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(item.status)}
                        {item.requiresAction && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.subject}</h3>
                      <p className="text-sm text-gray-600">Type: {item.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {item.emailCount} emails
                      </span>
                      <span>{new Date(item.lastUpdate).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/admin/${item.recordType}/${item.recordId}`}>
                      <Button variant="ghost" size="sm">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        View {item.recordType}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Rebates & STC Certificates */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Rebates & STC Certificates
            </h2>
            <Link href="/admin/dashboard/communications/email/groups?category=rebate">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {rebates.length === 0 ? (
              <Card className="p-8 text-center col-span-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No pending rebates</p>
              </Card>
            ) : (
              rebates.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(item.status)}
                    <span className="text-xs text-gray-500">{item.type}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{item.subject}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.emailCount}
                    </span>
                    <Link href={`/admin/${item.recordType}/${item.recordId}`}>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                        View Record
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Material Orders & Suppliers */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-600" />
              Material Orders & Supplier Communications
            </h2>
            <Link href="/admin/dashboard/orders">
              <Button variant="outline" size="sm">
                View All Orders
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {orders.length === 0 ? (
              <Card className="p-8 text-center col-span-2">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active orders</p>
              </Card>
            ) : (
              orders.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.subject}</h3>
                      <p className="text-sm text-gray-600">{item.relatedRecord}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {item.emailCount} emails
                      </span>
                      <span>{new Date(item.lastUpdate).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/admin/dashboard/orders`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Order
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Subcontractors */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-green-600" />
              Subcontractor Communications
            </h2>
            <Link href="/admin/dashboard/subcontractors">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {subcontractors.length === 0 ? (
              <Card className="p-8 text-center col-span-3">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent subcontractor communications</p>
              </Card>
            ) : (
              subcontractors.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(item.status)}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{item.subject}</h3>
                  <p className="text-xs text-gray-600 mb-2">{item.relatedRecord}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {item.emailCount}
                    </span>
                    <span>{new Date(item.lastUpdate).toLocaleDateString()}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Plenti Finance */}
        {plenti.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-600" />
                Plenti Finance Applications
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {plenti.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.subject}</h3>
                      <p className="text-sm text-gray-600">{item.relatedRecord}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {item.emailCount} emails
                      </span>
                      <span>{new Date(item.lastUpdate).toLocaleDateString()}</span>
                    </div>
                    <Link href={`/admin/${item.recordType}/${item.recordId}`}>
                      <Button variant="ghost" size="sm">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        View Application
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
