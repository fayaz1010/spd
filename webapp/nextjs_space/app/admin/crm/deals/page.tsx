'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  TrendingUp,
  Target,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Zap,
  Battery
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
  status: string;
  leadScore: number;
  expectedCloseDate?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  lead?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    systemSizeKw: number;
    batterySizeKwh: number;
  };
  owner?: {
    name: string;
    email: string;
  };
  activities?: any[];
}

interface Metrics {
  totalDeals: number;
  totalValue: number;
  byStage: Record<string, number>;
  byStatus: Record<string, number>;
}

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: 'New Lead',
  QUALIFIED: 'Qualified',
  INITIAL_QUOTE_SENT: 'Initial Quote Sent',
  DEPOSIT_PAID: 'Deposit Paid',
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETE: 'Site Visit Complete',
  FINAL_PROPOSAL_SENT: 'Final Proposal Sent',
  PROPOSAL_ACCEPTED: 'Proposal Accepted',
  WON: 'Won',
  LOST: 'Lost',
  ON_HOLD: 'On Hold',
};

const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: 'bg-gray-100 text-gray-800 border-gray-300',
  QUALIFIED: 'bg-blue-100 text-blue-800 border-blue-300',
  INITIAL_QUOTE_SENT: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  DEPOSIT_PAID: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  SITE_VISIT_SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-300',
  SITE_VISIT_COMPLETE: 'bg-violet-100 text-violet-800 border-violet-300',
  FINAL_PROPOSAL_SENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PROPOSAL_ACCEPTED: 'bg-orange-100 text-orange-800 border-orange-300',
  WON: 'bg-green-100 text-green-800 border-green-300',
  LOST: 'bg-red-100 text-red-800 border-red-300',
  ON_HOLD: 'bg-gray-100 text-gray-600 border-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-gray-100 text-gray-800',
};

export default function DealsListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    filterAndSortDeals();
  }, [deals, searchQuery, selectedStage, selectedStatus, sortBy, sortOrder]);

  const fetchDeals = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/crm/deals', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals || []);
        setMetrics(data.metrics);
      } else {
        throw new Error('Failed to fetch deals');
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDeals = () => {
    let filtered = [...deals];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (deal) =>
          deal.title.toLowerCase().includes(query) ||
          deal.lead?.name.toLowerCase().includes(query) ||
          deal.lead?.email.toLowerCase().includes(query) ||
          deal.lead?.phone.includes(query)
      );
    }

    // Stage filter
    if (selectedStage !== 'all') {
      filtered = filtered.filter((deal) => deal.stage === selectedStage);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((deal) => deal.status === selectedStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Deal];
      let bVal: any = b[sortBy as keyof Deal];

      if (sortBy === 'leadScore' || sortBy === 'value' || sortBy === 'probability') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredDeals(filtered);
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast({
          title: 'Deal Deleted',
          description: 'Deal has been deleted successfully',
        });
        fetchDeals();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Deal ID', 'Customer', 'Email', 'Phone', 'Value', 'Stage', 'Status', 'Score', 'Owner', 'Created'];
    const rows = filteredDeals.map(deal => [
      deal.id,
      deal.lead?.name || '',
      deal.lead?.email || '',
      deal.lead?.phone || '',
      deal.value,
      deal.stage,
      deal.status,
      deal.leadScore,
      deal.owner?.name || '',
      new Date(deal.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading deals...</p>
        </div>
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
              <Link href="/admin/crm/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  CRM Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-primary">Deals Management</h1>
                <p className="text-xs text-gray-500">Track and manage all sales opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/dashboard/leads">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Leads
                </Button>
              </Link>
              <Link href="/admin/dashboard/quotes">
                <Button variant="outline" size="sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Quotes
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDeals}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/admin/crm/pipeline">
                <Button size="sm" className="bg-primary hover:bg-primary-700">
                  <Target className="h-4 w-4 mr-2" />
                  Kanban View
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Cards */}
      {metrics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Deals</span>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{metrics.totalDeals}</p>
              <p className="text-xs text-gray-500 mt-1">Active opportunities</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pipeline Value</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(metrics.totalValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total potential revenue</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Open Deals</span>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {metrics.byStatus.OPEN || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Won Deals</span>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {metrics.byStatus.WON || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Closed successfully</p>
            </Card>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search deals, customers, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stage Filter */}
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Sort By
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('updatedAt')}>
                  Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('createdAt')}>
                  Date Created
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('value')}>
                  Deal Value
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('leadScore')}>
                  Lead Score
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('probability')}>
                  Probability
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            <span className="text-sm text-gray-500">
              Showing {filteredDeals.length} of {deals.length}
            </span>
          </div>
        </Card>
      </div>

      {/* Deals Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer / Deal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No deals found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchQuery || selectedStage !== 'all' || selectedStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Deals will appear here when leads are converted'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{deal.lead?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{deal.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{deal.lead?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{deal.lead?.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {deal.lead ? (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 font-medium text-gray-900">
                              <Zap className="h-4 w-4 text-gold" />
                              {deal.lead.systemSizeKw} kW
                            </div>
                            {deal.lead.batterySizeKwh > 0 && (
                              <div className="flex items-center gap-1 text-gray-600 mt-1">
                                <Battery className="h-3 w-3 text-emerald-600" />
                                {deal.lead.batterySizeKwh} kWh
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-green-600">{formatCurrency(deal.value)}</p>
                          <p className="text-xs text-gray-500">{deal.probability}% probability</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              STAGE_COLORS[deal.stage] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {STAGE_LABELS[deal.stage] || deal.stage}
                          </span>
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                STATUS_COLORS[deal.status] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {deal.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${getScoreColor(deal.leadScore)}`}>
                          {deal.leadScore}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">{deal.owner?.name || 'Unassigned'}</p>
                          <p className="text-xs text-gray-500">{deal.owner?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(deal.updatedAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/crm/deals/${deal.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/crm/deals/${deal.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Deal
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/dashboard/leads`}>
                                  <User className="h-4 w-4 mr-2" />
                                  View Lead
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${deal.lead?.email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={`tel:${deal.lead?.phone}`}>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call Customer
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(deal.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Deal
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
