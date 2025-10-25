
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  DollarSign, 
  Battery, 
  Sun, 
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Package,
  Target,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuoteLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}

interface Quote {
  id: string;
  sessionId: string | null;
  leadId: string | null;
  lead: QuoteLead | null;
  status: string;
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  panelBrandName: string;
  batteryBrandName: string;
  inverterBrandName: string;
  totalCostBeforeRebates: number;
  totalRebates: number;
  totalCostAfterRebates: number;
  annualSavings: number;
  year25Savings: number;
  paybackYears: number;
  createdAt: string;
  updatedAt: string;
}

interface QuoteSummary {
  totalQuotes: number;
  totalValue: number;
  averageSystemSize: number;
  averageBatterySize: number;
  statusCounts: { [key: string]: number };
}

export default function QuotesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setQuotes(data.quotes || []);
        setFilteredQuotes(data.quotes || []);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredQuotes(quotes);
    } else {
      setFilteredQuotes(quotes.filter(quote => quote.status === selectedStatus));
    }
  }, [selectedStatus, quotes]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const viewQuoteDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading quotes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-primary">All Quotes</h1>
                <p className="text-sm text-gray-600">View and manage all customer quotes</p>
              </div>
            </div>
            <Button className="bg-primary hover:bg-primary-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      {summary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Quotes</span>
                <Package className="h-5 w-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{summary.totalQuotes}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Value</span>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Avg System Size</span>
                <Sun className="h-5 w-5 text-gold" />
              </div>
              <p className="text-3xl font-bold text-gold">
                {(summary.averageSystemSize || 0).toFixed(1)} kW
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm">Avg Battery Size</span>
                <Battery className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {(summary.averageBatterySize || 0).toFixed(1)} kWh
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 ml-4">
              Showing {filteredQuotes.length} of {quotes.length} quotes
            </span>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote ID / Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Investment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-primary">{quote.id.slice(0, 8)}</div>
                          {quote.sessionId && (
                            <div className="text-xs text-gray-500">Session: {quote.sessionId.slice(0, 12)}...</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {quote.lead ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {quote.lead.name}
                            </div>
                            <div className="text-gray-500 text-xs flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {quote.lead.email}
                            </div>
                            <div className="text-gray-500 text-xs flex items-center mt-0.5">
                              <Phone className="h-3 w-3 mr-1" />
                              {quote.lead.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not converted to lead</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 flex items-center">
                            <Sun className="h-4 w-4 mr-1 text-gold" />
                            {quote.systemSizeKw} kW ({quote.panelCount} panels)
                          </div>
                          <div className="text-gray-600 text-xs flex items-center mt-1">
                            <Battery className="h-3 w-3 mr-1 text-emerald-600" />
                            {quote.batterySizeKwh} kWh Battery
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {quote.panelBrandName} • {quote.batteryBrandName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-bold text-green-600">
                            {formatCurrency(quote.totalCostAfterRebates)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Before: {formatCurrency(quote.totalCostBeforeRebates)}
                          </div>
                          <div className="text-xs text-emerald-600">
                            Rebates: {formatCurrency(quote.totalRebates)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(quote.status)}`}>
                          {getStatusIcon(quote.status)}
                          <span className="ml-1">{quote.status || 'draft'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(quote.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewQuoteDetails(quote)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {quote.lead && (
                            <Link href={`/admin/crm/deals?lead=${quote.leadId}`}>
                              <Button variant="ghost" size="sm" title="View in CRM">
                                <Target className="h-4 w-4 text-primary" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quote Details Modal */}
      {showDetails && selectedQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Quote Details</h2>
              <Button variant="ghost" onClick={() => setShowDetails(false)}>
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              {selectedQuote.lead && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                    <User className="h-5 w-5 mr-2" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-semibold">{selectedQuote.lead.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{selectedQuote.lead.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold">{selectedQuote.lead.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{selectedQuote.lead.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* System Configuration */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                  <Package className="h-5 w-5 mr-2" />
                  System Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Solar System</p>
                    <p className="font-semibold text-lg">{selectedQuote.systemSizeKw} kW</p>
                    <p className="text-sm text-gray-500">{selectedQuote.panelCount} x {selectedQuote.panelBrandName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Battery Storage</p>
                    <p className="font-semibold text-lg">{selectedQuote.batterySizeKwh} kWh</p>
                    <p className="text-sm text-gray-500">{selectedQuote.batteryBrandName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Inverter</p>
                    <p className="font-semibold">{selectedQuote.inverterBrandName}</p>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost (Before Rebates)</span>
                    <span className="font-semibold">{formatCurrency(selectedQuote.totalCostBeforeRebates)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Total Rebates</span>
                    <span className="font-semibold">- {formatCurrency(selectedQuote.totalRebates)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg">
                    <span className="font-bold">Final Investment</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedQuote.totalCostAfterRebates)}</span>
                  </div>
                </div>
              </div>

              {/* Savings Projection */}
              {selectedQuote.annualSavings > 0 && (
                <div className="bg-gold-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center text-primary">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Savings Projection
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Annual Savings</p>
                      <p className="font-bold text-xl text-green-600">{formatCurrency(selectedQuote.annualSavings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">25-Year Savings</p>
                      <p className="font-bold text-xl text-green-600">{formatCurrency(selectedQuote.year25Savings)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payback Period</p>
                      <p className="font-bold text-xl text-primary">
                        {(selectedQuote.paybackYears || 0).toFixed(1)} years
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quote Metadata */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">Quote Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Quote ID</p>
                    <p className="font-mono text-xs">{selectedQuote.id}</p>
                  </div>
                  {selectedQuote.sessionId && (
                    <div>
                      <p className="text-gray-600">Session ID</p>
                      <p className="font-mono text-xs">{selectedQuote.sessionId}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Created</p>
                    <p>{formatDate(selectedQuote.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p>{formatDate(selectedQuote.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedQuote.status)}`}>
                      {getStatusIcon(selectedQuote.status)}
                      <span className="ml-1">{selectedQuote.status || 'draft'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              <Button className="bg-primary hover:bg-primary-700">
                Convert to Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
