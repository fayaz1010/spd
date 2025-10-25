'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingUp,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Zap,
  Battery,
  FileText,
  Eye,
  Clock,
  Package,
  Download,
  CheckCircle,
  Wrench,
  Sun,
  PiggyBank
} from 'lucide-react';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { QuickActions } from '@/components/crm/QuickActions';
import { useToast } from '@/hooks/use-toast';

export default function DealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeal();
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/crm/deals/${dealId}`);
      if (response.ok) {
        const data = await response.json();
        setDeal(data.deal);
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deal details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const response = await fetch(`/api/crm/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Deal Deleted',
          description: 'Deal has been deleted successfully',
        });
        router.push('/admin/crm/pipeline');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete deal',
        variant: 'destructive',
      });
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      NEW_LEAD: 'bg-gray-100 text-gray-800',
      CONTACTED: 'bg-blue-100 text-blue-800',
      QUOTE_SENT: 'bg-purple-100 text-purple-800',
      FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      WON: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-gray-100 text-gray-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading deal details...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Deal not found</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deal.title}</h1>
            <p className="text-gray-600">{deal.lead.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/admin/leads/${deal.leadId}`}>
            <Button variant="outline" size="sm" className="bg-green-50 border-green-200 hover:bg-green-100">
              <User className="h-4 w-4 mr-2" />
              View Customer Details
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Deal Value</p>
              <p className="text-2xl font-bold">${(deal.value / 1000).toFixed(1)}k</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Probability</p>
              <p className="text-2xl font-bold">{deal.probability}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-3 ${deal.leadScore >= 80 ? 'bg-green-100' : deal.leadScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-6 w-6 ${getScoreColor(deal.leadScore)}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Lead Score</p>
              <p className="text-2xl font-bold">{deal.leadScore}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Badge className={getStageColor(deal.stage)}>
              {deal.stage.replace(/_/g, ' ')}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="quote">Quote Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Customer Info */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{deal.lead.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{deal.lead.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{deal.lead.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{deal.lead.address}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* System Info */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">System Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">System Size</p>
                      <p className="font-medium">{deal.lead.systemSizeKw}kW</p>
                    </div>
                  </div>

                  {deal.lead.batterySizeKwh > 0 && (
                    <div className="flex items-center gap-3">
                      <Battery className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Battery</p>
                        <p className="font-medium">{deal.lead.batterySizeKwh}kWh</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Deal Info */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Deal Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner</span>
                    <span className="font-medium">{deal.owner.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {deal.expectedCloseDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Close</span>
                      <span className="font-medium">
                        {new Date(deal.expectedCloseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Count</span>
                    <span className="font-medium">{deal.contactCount}</span>
                  </div>
                </div>
              </Card>

              {/* Installation Job Status */}
              {deal.lead.InstallationJob && (
                <Card className="p-6 bg-green-50 border-green-200">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Installation Job
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Job Number</p>
                      <p className="font-medium">{deal.lead.InstallationJob.jobNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className="bg-green-600 text-white">
                        {deal.lead.InstallationJob.status}
                      </Badge>
                    </div>
                    {deal.lead.InstallationJob.scheduledDate && (
                      <div>
                        <p className="text-sm text-gray-600">Scheduled Date</p>
                        <p className="font-medium">
                          {new Date(deal.lead.InstallationJob.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Quote Details Tab */}
            <TabsContent value="quote" className="space-y-6">
              {deal.lead.CustomerQuote ? (
                <>
                  {/* System Configuration */}
                  <Card className="p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      System Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Solar System</p>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          <Sun className="h-5 w-5 text-gold" />
                          {deal.lead.CustomerQuote.systemSizeKw} kW
                        </p>
                        <p className="text-sm text-gray-500">
                          {deal.lead.CustomerQuote.panelCount} x {deal.lead.CustomerQuote.panelBrandName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {deal.lead.CustomerQuote.panelWattage}W panels
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Battery Storage</p>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          <Battery className="h-5 w-5 text-emerald-600" />
                          {deal.lead.CustomerQuote.batterySizeKwh} kWh
                        </p>
                        <p className="text-sm text-gray-500">
                          {deal.lead.CustomerQuote.batteryBrandName}
                        </p>
                        {deal.lead.CustomerQuote.batteryUsableKwh && (
                          <p className="text-xs text-gray-400 mt-1">
                            {deal.lead.CustomerQuote.batteryUsableKwh} kWh usable
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Inverter</p>
                        <p className="font-semibold">
                          {deal.lead.CustomerQuote.inverterBrandName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {deal.lead.CustomerQuote.inverterSizeKw} kW
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Financial Breakdown */}
                  <Card className="p-6 bg-green-50 border-green-200">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Financial Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Equipment Cost</span>
                        <span className="font-semibold">
                          ${deal.lead.CustomerQuote.equipmentCost?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Installation Cost</span>
                        <span className="font-semibold">
                          ${deal.lead.CustomerQuote.installationCost?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600 font-medium">Total Before Rebates</span>
                        <span className="font-bold text-lg">
                          ${deal.lead.CustomerQuote.totalCostBeforeRebates?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>STC Rebate</span>
                        <span className="font-semibold">
                          - ${deal.lead.CustomerQuote.stcRebate?.toLocaleString() || 0}
                        </span>
                      </div>
                      {deal.lead.CustomerQuote.stateRebate > 0 && (
                        <div className="flex justify-between items-center text-emerald-600">
                          <span>State Rebate</span>
                          <span className="font-semibold">
                            - ${deal.lead.CustomerQuote.stateRebate?.toLocaleString() || 0}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-green-300">
                        <span className="font-bold text-lg">Final Investment</span>
                        <span className="font-bold text-2xl text-green-600">
                          ${deal.lead.CustomerQuote.totalCostAfterRebates?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* ROI & Savings */}
                  {deal.lead.CustomerQuote.annualSavings > 0 && (
                    <Card className="p-6 bg-gold-50 border-gold-200">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-gold" />
                        Return on Investment
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Annual Savings</p>
                          <p className="font-bold text-2xl text-green-600">
                            ${deal.lead.CustomerQuote.annualSavings?.toLocaleString() || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">per year</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">Payback Period</p>
                          <p className="font-bold text-2xl text-primary">
                            {deal.lead.CustomerQuote.paybackYears?.toFixed(1) || 0}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">years</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-1">25-Year Savings</p>
                          <p className="font-bold text-2xl text-green-600">
                            ${(deal.lead.CustomerQuote.year25Savings / 1000)?.toFixed(0) || 0}k
                          </p>
                          <p className="text-xs text-gray-500 mt-1">total return</p>
                        </div>
                      </div>
                      {deal.lead.CustomerQuote.year1Savings && (
                        <div className="mt-4 pt-4 border-t border-gold-300">
                          <p className="text-sm text-gray-600 mb-2">Year 1 Breakdown</p>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bill Savings</span>
                              <span className="font-semibold">
                                ${deal.lead.CustomerQuote.year1Savings?.toLocaleString() || 0}
                              </span>
                            </div>
                            {deal.lead.CustomerQuote.year1FeedInRevenue > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Feed-in Revenue</span>
                                <span className="font-semibold">
                                  ${deal.lead.CustomerQuote.year1FeedInRevenue?.toLocaleString() || 0}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Quote Metadata */}
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">Quote Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Quote Reference</p>
                        <p className="font-mono font-medium">{deal.lead.CustomerQuote.quoteReference}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <Badge className={deal.lead.CustomerQuote.status === 'accepted' ? 'bg-green-600' : 'bg-gray-400'}>
                          {deal.lead.CustomerQuote.status || 'draft'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-600">Created</p>
                        <p className="font-medium">
                          {new Date(deal.lead.CustomerQuote.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Updated</p>
                        <p className="font-medium">
                          {new Date(deal.lead.CustomerQuote.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" asChild>
                        <a href={`/admin/dashboard/quotes?id=${deal.lead.CustomerQuote.id}`} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          View Full Quote
                        </a>
                      </Button>
                    </div>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No quote data available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Quote information will appear here once generated
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <ActivityTimeline 
                activities={deal.activities || []} 
                onAddActivity={fetchDeal}
              />
            </TabsContent>

            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Proposal Analytics</h3>
                {deal.proposals && deal.proposals.length > 0 ? (
                  <div className="space-y-4">
                    {deal.proposals.map((proposal: any) => (
                      <div key={proposal.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-medium">
                              {proposal.quote.quoteReference}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${proposal.quote.totalCostAfterRebates?.toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={proposal.converted ? 'default' : 'secondary'}>
                            {proposal.converted ? 'Converted' : 'Pending'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Views</p>
                            <p className="font-medium flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {proposal.viewCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time Spent</p>
                            <p className="font-medium flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.floor(proposal.totalTimeSpent / 60)}m
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Device</p>
                            <p className="font-medium">{proposal.deviceType || 'Unknown'}</p>
                          </div>
                        </div>

                        {proposal.firstViewedAt && (
                          <p className="text-xs text-gray-500 mt-3">
                            First viewed: {new Date(proposal.firstViewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No proposals yet</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <QuickActions
            dealId={deal.id}
            customerEmail={deal.lead.email}
            customerPhone={deal.lead.phone}
            customerName={deal.lead.name}
            onActivityAdded={fetchDeal}
          />
        </div>
      </div>
    </div>
  );
}
