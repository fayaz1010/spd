'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Phone, Mail, MapPin, Filter, Tag, Car, Waves, TrendingUp, Briefcase, Leaf, Home, CreditCard, CheckCircle, XCircle, DollarSign, Target, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { getSegmentMessaging } from '@/lib/marketing-segments';

export default function LeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin');
      return;
    }

    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/leads', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setLeads(data.leads || []);
      setFilteredLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSegment === 'all') {
      setFilteredLeads(leads);
    } else {
      setFilteredLeads(leads.filter(lead => lead.marketingSegment === selectedSegment));
    }
  }, [selectedSegment, leads]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSegmentIcon = (segment: string): React.ComponentType<{ className?: string }> => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      pool_owner: Waves,
      ev_owner: Car,
      high_consumption: TrendingUp,
      business: Briefcase,
      eco_enthusiast: Leaf,
      standard: Home,
    };
    return icons[segment] || Home;
  };

  const getSegmentColor = (segment: string) => {
    const colors: { [key: string]: string } = {
      pool_owner: 'bg-blue-500',
      ev_owner: 'bg-green-500',
      high_consumption: 'bg-red-500',
      business: 'bg-purple-500',
      eco_enthusiast: 'bg-emerald-500',
      standard: 'bg-gray-500',
    };
    return colors[segment] || 'bg-gray-500';
  };

  const segmentCounts = leads.reduce((acc, lead) => {
    const segment = lead.marketingSegment || 'standard';
    acc[segment] = (acc[segment] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard">
              <Button variant="ghost" className="mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-primary">Leads & Quotes</h1>
              <p className="text-xs text-gray-500">Manage customer inquiries</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="bg-gradient-primary rounded-full h-16 w-16 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Customer Leads</h2>
            <p className="text-gray-600 mb-4">
              Total leads: {leads.length} | Showing: {filteredLeads.length}
            </p>
          </div>

          {/* Marketing Segment Filters */}
          <div className="mb-6 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filter by Marketing Segment</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSegment('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedSegment === 'all'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Leads ({leads.length})
              </button>
              {Object.entries(segmentCounts).map(([segment, count]) => {
                const Icon = getSegmentIcon(segment);
                const segmentLabel = segment.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                const segmentText = `${segmentLabel} (${count})`;
                return (
                  <button
                    key={segment}
                    onClick={() => setSelectedSegment(segment)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedSegment === segment
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {segmentText}
                  </button>
                );
              })}
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No leads yet</p>
              <p className="text-sm text-gray-400">Leads will appear here when customers submit the calculator form</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No leads in this segment</p>
              <button
                onClick={() => setSelectedSegment('all')}
                className="text-coral hover:text-coral-600 font-medium"
              >
                Show all leads
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-coral transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-primary">{lead.name}</h3>
                        {lead.marketingSegment && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getSegmentColor(lead.marketingSegment)}`}>
                            {lead.marketingSegment.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Quote: {lead.quoteReference}</p>
                      
                      {/* Advanced Profile Badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.hasEv && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {lead.evCount > 1 ? `${lead.evCount} EVs` : 'EV Owner'}
                          </span>
                        )}
                        {lead.poolType && lead.poolType !== 'none' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                            <Waves className="h-3 w-3" />
                            Pool{lead.poolType === 'heated' ? ' (Heated)' : ''}
                          </span>
                        )}
                        {lead.homeOfficeCount && lead.homeOfficeCount > 0 && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {lead.homeOfficeCount} Home Office{lead.homeOfficeCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {lead.hasElectricHotWater && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            Electric Hot Water
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'new' ? 'bg-gold text-white' :
                        lead.status === 'contacted' ? 'bg-blue-500 text-white' :
                        lead.status === 'won' ? 'bg-emerald text-white' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {lead.status}
                      </span>
                      
                      {/* Payment Status Badge */}
                      {lead.paymentStatus && (
                        <div className="flex items-center justify-end gap-1">
                          {lead.paymentStatus === 'paid' ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-emerald" />
                              <span className="text-xs font-semibold text-emerald">
                                {lead.depositPaid ? 'Deposit Paid' : 'Paid'}
                              </span>
                            </>
                          ) : lead.paymentStatus === 'failed' ? (
                            <>
                              <XCircle className="h-3 w-3 text-red-500" />
                              <span className="text-xs font-semibold text-red-500">Failed</span>
                            </>
                          ) : lead.paymentStatus === 'refunded' ? (
                            <>
                              <DollarSign className="h-3 w-3 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-500">Refunded</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-400">Pending</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">{formatDate(lead.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{lead.address}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">System Size</p>
                      <p className="font-semibold text-coral">{lead.systemSizeKw}kW</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Battery</p>
                      <p className="font-semibold text-coral">
                        {lead.batterySizeKwh > 0 ? `${lead.batterySizeKwh}kWh` : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quarterly Bill</p>
                      <p className="font-semibold text-gray-900">${lead.quarterlyBill}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Property</p>
                      <p className="font-semibold text-gray-900">{lead.propertyType}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    <Link href={`/admin/leads/${lead.id}`} className="flex-1">
                      <Button className="w-full" variant="outline">
                        View Full Details →
                      </Button>
                    </Link>
                    <Link href={`/admin/crm/deals?lead=${lead.id}`} className="flex-1">
                      <Button className="w-full bg-primary hover:bg-primary-700 text-white">
                        <Target className="h-4 w-4 mr-2" />
                        View in CRM
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
