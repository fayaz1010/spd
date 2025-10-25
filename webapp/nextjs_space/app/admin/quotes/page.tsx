
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Send, 
  RefreshCw,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/calculations';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';

interface Quote {
  id: string;
  quoteReference: string;
  status: string;
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh: number;
  panelBrandName: string;
  batteryBrandName: string;
  inverterBrandName: string;
  panelSystemCost: number;
  batteryCost: number;
  inverterCost: number;
  totalCostBeforeRebates: number;
  totalRebates: number;
  totalCostAfterRebates: number;
  annualSavings: number;
  paybackYears: number;
  depositAmount: number;
  monthlyPayment: number;
  createdAt: string;
  updatedAt: string;
  validUntil?: string;
  lead?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: string;
    depositPaid: boolean;
  };
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, [statusFilter, searchTerm]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/quotes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to fetch quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setDetailDialogOpen(true);
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Quote status updated to ${newStatus}`);
        fetchQuotes();
        if (selectedQuote && selectedQuote.id === quoteId) {
          setSelectedQuote(data.quote);
        }
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update quote status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      draft: { label: 'Draft', variant: 'secondary', icon: FileText },
      sent: { label: 'Sent', variant: 'default', icon: Send },
      viewed: { label: 'Viewed', variant: 'default', icon: Eye },
      accepted: { label: 'Accepted', variant: 'default', icon: CheckCircle },
      paid: { label: 'Paid', variant: 'default', icon: DollarSign },
      expired: { label: 'Expired', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isQuoteExpired = (validUntil?: string) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
        <p className="text-gray-600">
          Manage customer quotes, track status, and convert to orders
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by quote reference, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchQuotes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quote Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Investment
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
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading quotes...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No quotes found
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.quoteReference || 'N/A'}
                          </div>
                          {isQuoteExpired(quote.validUntil) && (
                            <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertCircle className="h-3 w-3" />
                              Expired
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {quote.lead?.name || 'No customer linked'}
                        </div>
                        <div className="text-gray-500">{quote.lead?.email || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatNumber(quote.systemSizeKw)}kW + {formatNumber(quote.batterySizeKwh)}kWh
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(quote.totalCostAfterRebates)}
                      </div>
                      <div className="text-xs text-emerald">
                        Saves {formatCurrency(quote.annualSavings)}/yr
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        onClick={() => handleViewQuote(quote)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
            <DialogDescription>
              {selectedQuote?.quoteReference || 'N/A'}
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedQuote.lead?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedQuote.lead?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedQuote.lead?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{selectedQuote.lead?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* System Configuration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">System Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">System Size</p>
                    <p className="font-medium">{formatNumber(selectedQuote.systemSizeKw)}kW ({selectedQuote.panelCount} panels)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Battery Capacity</p>
                    <p className="font-medium">{formatNumber(selectedQuote.batterySizeKwh)}kWh</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Panel Brand</p>
                    <p className="font-medium">{selectedQuote.panelBrandName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Battery Brand</p>
                    <p className="font-medium">{selectedQuote.batteryBrandName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inverter Brand</p>
                    <p className="font-medium">{selectedQuote.inverterBrandName}</p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Cost Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panel System</span>
                    <span className="font-medium">{formatCurrency(selectedQuote.panelSystemCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Battery System</span>
                    <span className="font-medium">{formatCurrency(selectedQuote.batteryCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inverter</span>
                    <span className="font-medium">{formatCurrency(selectedQuote.inverterCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedQuote.totalCostBeforeRebates)}</span>
                  </div>
                  <div className="flex justify-between text-emerald">
                    <span>Total Rebates</span>
                    <span className="font-medium">-{formatCurrency(selectedQuote.totalRebates)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-lg">
                    <span className="font-bold">Final Investment</span>
                    <span className="font-bold text-primary">{formatCurrency(selectedQuote.totalCostAfterRebates)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Payment Options</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deposit (10%)</p>
                    <p className="font-medium">{formatCurrency(selectedQuote.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment (24 months)</p>
                    <p className="font-medium">{formatCurrency(selectedQuote.monthlyPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Savings & ROI */}
              <div className="bg-emerald/5 rounded-lg p-4 border border-emerald/20">
                <h3 className="font-semibold text-lg mb-3 text-emerald">Financial Returns</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Annual Savings</p>
                    <p className="font-medium text-emerald">{formatCurrency(selectedQuote.annualSavings)}/year</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payback Period</p>
                    <p className="font-medium">{formatNumber(selectedQuote.paybackYears)} years</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Update Quote Status</h3>
                <div className="flex items-center gap-4">
                  <Select
                    value={selectedQuote.status}
                    onValueChange={(value) => handleUpdateStatus(selectedQuote.id, value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-500">
                    Current: {getStatusBadge(selectedQuote.status)}
                  </div>
                </div>
              </div>

              {/* Quote Metadata */}
              <div className="text-sm text-gray-500 border-t pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>Created: {new Date(selectedQuote.createdAt).toLocaleString()}</div>
                  <div>Updated: {new Date(selectedQuote.updatedAt).toLocaleString()}</div>
                  {selectedQuote.validUntil && (
                    <div className={isQuoteExpired(selectedQuote.validUntil) ? 'text-red-600' : ''}>
                      Valid Until: {new Date(selectedQuote.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
