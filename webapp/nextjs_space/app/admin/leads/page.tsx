
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  Battery,
  Zap,
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyType: string;
  quarterlyBill: number;
  householdSize: number;
  systemSizeKw: number;
  numPanels: number;
  batterySizeKwh: number;
  quoteReference: string;
  status: string;
  depositPaid: boolean;
  depositAmount: number | null;
  createdAt: string;
  notes: string | null;
  CustomerQuote?: any;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'New Lead', color: 'bg-blue-500', icon: Clock },
  contacted: { label: 'Contacted', color: 'bg-yellow-500', icon: Phone },
  quoted: { label: 'Quoted', color: 'bg-purple-500', icon: FileText },
  won: { label: 'Won', color: 'bg-green-500', icon: CheckCircle },
  lost: { label: 'Lost', color: 'bg-red-500', icon: XCircle },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Get status from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      
      // Get status from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const statusParam = urlParams.get('status');
      
      // Build API URL with query parameters
      const apiUrl = statusParam 
        ? `/api/admin/leads?status=${statusParam}` 
        : '/api/admin/leads';
      
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Filter is done on client side for simplicity
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchQuery === '' || 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || statusFilter === 'converted' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const newLeads = filteredLeads.filter(lead => lead.status === 'new');
  const contactedLeads = filteredLeads.filter(lead => lead.status === 'contacted');
  const quotedLeads = filteredLeads.filter(lead => lead.status === 'quoted');
  const wonLeads = filteredLeads.filter(lead => lead.status === 'won');
  const lostLeads = filteredLeads.filter(lead => lead.status === 'lost');
  
  const isConverted = statusFilter === 'converted';
  const pageTitle = isConverted ? 'Converted Leads' : 'All Leads';
  const pageDescription = isConverted 
    ? 'Leads that have been converted to installation jobs' 
    : 'Manage and track all customer leads';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
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
                <h1 className="text-2xl font-bold text-primary">{pageTitle}</h1>
                <p className="text-sm text-gray-600">{pageDescription}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/jobs">
                <Button variant="outline">
                  View Jobs
                </Button>
              </Link>
              {isConverted && (
                <Link href="/admin/leads">
                  <Button variant="outline">
                    View All Leads
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{newLeads.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{contactedLeads.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Quoted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{quotedLeads.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Won</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{wonLeads.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Lost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{lostLeads.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-2 col-span-2">
                <Input
                  placeholder="Search by name, email, phone, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="all">
              All ({filteredLeads.length})
            </TabsTrigger>
            <TabsTrigger value="new">
              New ({newLeads.length})
            </TabsTrigger>
            <TabsTrigger value="contacted">
              Contacted ({contactedLeads.length})
            </TabsTrigger>
            <TabsTrigger value="quoted">
              Quoted ({quotedLeads.length})
            </TabsTrigger>
            <TabsTrigger value="won">
              Won ({wonLeads.length})
            </TabsTrigger>
            <TabsTrigger value="lost">
              Lost ({lostLeads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <LeadsList leads={filteredLeads} loading={loading} />
          </TabsContent>

          <TabsContent value="new">
            <LeadsList leads={newLeads} loading={loading} />
          </TabsContent>

          <TabsContent value="contacted">
            <LeadsList leads={contactedLeads} loading={loading} />
          </TabsContent>

          <TabsContent value="quoted">
            <LeadsList leads={quotedLeads} loading={loading} />
          </TabsContent>

          <TabsContent value="won">
            <LeadsList leads={wonLeads} loading={loading} />
          </TabsContent>

          <TabsContent value="lost">
            <LeadsList leads={lostLeads} loading={loading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function LeadsList({ leads, loading }: { leads: Lead[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No leads found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const statusInfo = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
        const StatusIcon = statusInfo.icon;

        return (
          <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                      <Badge className={`${statusInfo.color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      {lead.depositPaid && (
                        <Badge className="bg-green-600 text-white">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Deposit Paid
                        </Badge>
                      )}
                    </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{lead.address}</span>
                      </div>
                    </div>

                    {/* System Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4" />
                        <span>{lead.systemSizeKw} kW System ({lead.numPanels} panels)</span>
                      </div>
                      {lead.batterySizeKwh > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Battery className="w-4 h-4" />
                          <span>{lead.batterySizeKwh} kWh Battery</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${lead.quarterlyBill}/quarter</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>Quote: {lead.quoteReference}</span>
                    <span>•</span>
                    <span>{lead.householdSize} people</span>
                    <span>•</span>
                    <span>{lead.propertyType}</span>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>Notes:</strong> {lead.notes}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {lead.CustomerQuote && (
                    <div className="pt-3 border-t">
                      <Link 
                        href={`/proposal/${lead.CustomerQuote.id}`} 
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Customer Proposal
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        );
      })}
    </div>
  );
}
