'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Zap, 
  Battery,
  ExternalLink,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Users,
  Target,
  Briefcase,
  TrendingUp,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import the actual card components we built this morning
import { LeadStatusTimeline } from '@/components/admin/lead-status-timeline';
import { InstallationReadinessWidget } from '@/components/admin/InstallationReadinessWidget';
import { RegulatoryApplicationsCard } from '@/components/admin/RegulatoryApplicationsCard';
import { RebateTrackingCard } from '@/components/admin/RebateTrackingCard';
import { LoanApplicationCard } from '@/components/admin/LoanApplicationCard';
import { PaymentConfirmationCard } from '@/components/admin/PaymentConfirmationCard';
import { PropertyTechnicalDetailsCard } from '@/components/admin/PropertyTechnicalDetailsCard';
import { MaterialOrderCard } from '@/components/admin/MaterialOrderCard';
import { CompliancePhotoUploadCard } from '@/components/admin/CompliancePhotoUploadCard';
import { SerialNumberTrackingCard } from '@/components/admin/SerialNumberTrackingCard';
import { ComplianceChecklistCard } from '@/components/admin/ComplianceChecklistCard';
import { ComplianceDocumentsCard } from '@/components/admin/ComplianceDocumentsCard';
import { DocumentGenerationCard } from '@/components/admin/DocumentGenerationCard';
import { GeneratedDocumentsList } from '@/components/admin/GeneratedDocumentsList';
import { ElectricianAssignmentCard } from '@/components/admin/ElectricianAssignmentCard';
import { SubmissionValidation } from '@/components/admin/SubmissionValidation';
import { SiteVisitCard } from '@/components/admin/SiteVisitCard';
import { LeadQualificationCard } from '@/components/admin/LeadQualificationCard';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  suburb: string | null;
  propertyType: string;
  systemSizeKw: number;
  numPanels: number;
  batterySizeKwh: number;
  quoteReference: string;
  status: string;
  depositPaid: boolean;
  depositPaidAt: string | null;
  depositAmount: number | null;
  finalPaid: boolean;
  finalPaidAt: string | null;
  finalAmount: number | null;
  createdAt: string;
  notes: string | null;
  quarterlyBill: number | null;
  householdSize: number;
  loanRequested: boolean;
  householdIncome: number | null;
  numberOfDependents: number | null;
  employmentStatus: string | null;
  proposalSentAt: string | null;
  finalProposalSentAt: string | null;
  siteVisitCompletedAt: string | null;
  surveyCompletedAt: string | null;
  surveyRequestedAt: string | null;
  contactAttempts: number;
  firstContactedAt: string | null;
  lastContactedAt: string | null;
  confirmedAt: string | null;
  leadSource: string;
  leadSourceDetails: string | null;
  pipelineStatus?: string;
  handoffAt?: string | null;
  handoffBy?: string | null;
  handoffAcknowledged?: boolean;
  handoffAcknowledgedAt?: string | null;
  handoffAcknowledgedBy?: string | null;
  CustomerQuote: any;
  siteVisit: any;
  regulatoryApplication: any;
  rebateTracking: any;
  loanApplication: any;
  InstallationJob: any;
  readyForInstallation: boolean;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(Date.now());
  const [siteVisit, setSiteVisit] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHandoffAlert, setShowHandoffAlert] = useState(true);

  const fetchLead = () => {
    if (!leadId) return;

    fetch(`/api/admin/leads/${leadId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Lead not found');
        return res.json();
      })
      .then(data => {
        console.log('Lead data:', data.lead);
        console.log('CustomerQuote status:', data.lead.CustomerQuote?.status);
        console.log('CustomerQuote signedAt:', data.lead.CustomerQuote?.signedAt);
        console.log('Has rebateTracking:', !!data.lead.rebateTracking);
        console.log('WA State Confirmed:', data.lead.rebateTracking?.waStateConfirmed);
        console.log('Has regulatoryApplication:', !!data.lead.regulatoryApplication);
        console.log('Synergy Approved:', data.lead.regulatoryApplication?.synergyApproved);
        console.log('WP Approved:', data.lead.regulatoryApplication?.wpApproved);
        setLead(data.lead);
        setRenderKey(Date.now()); // Force re-render with fresh data
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lead:', err);
        toast.error('Failed to load lead details');
        setLoading(false);
      });
  };

  const fetchSiteVisit = () => {
    if (!leadId) return;

    fetch(`/api/admin/leads/${leadId}/site-visit`)
      .then(res => res.json())
      .then(data => {
        setSiteVisit(data.siteVisit);
      })
      .catch(err => {
        console.error('Error fetching site visit:', err);
      });
  };

  useEffect(() => {
    fetchLead();
    fetchSiteVisit();
    
    // Force re-fetch on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLead();
        fetchSiteVisit();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [leadId]);
  
  // Auto-transition effect - runs when lead data changes
  useEffect(() => {
    const handleAutoTransition = async () => {
      if (!lead) return;
      
      const isWon = lead.CustomerQuote?.status === 'ACCEPTED' && lead.depositPaid;
      const pipelineStatus = lead.pipelineStatus || 'SALES';
      
      if (isWon && pipelineStatus === 'SALES') {
        try {
          const token = localStorage.getItem('admin_token');
          const response = await fetch(`/api/admin/leads/${leadId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              pipelineStatus: 'OPERATIONS',
              handoffAt: new Date().toISOString(),
              handoffBy: 'system',
            }),
          });
          
          if (response.ok) {
            fetchLead();
          }
        } catch (error) {
          console.error('Failed to transition pipeline:', error);
        }
      }
    };
    
    handleAutoTransition();
  }, [lead, leadId]);

  useEffect(() => {
    if (lead) {
      console.log('Lead loaded:', {
        name: lead.name,
        hasCustomerQuote: !!lead.CustomerQuote,
        quoteId: lead.CustomerQuote?.id,
        depositPaid: lead.depositPaid
      });
    }
  }, [lead]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Clock className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Lead not found</p>
          <Link href="/admin/leads">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leads
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const hasBattery = lead.batterySizeKwh > 0;
  
  // Pipeline Status Logic
  const isWon = lead.CustomerQuote?.status === 'ACCEPTED' && lead.depositPaid;
  const pipelineStatus = lead.pipelineStatus || 'SALES';
  const isOperationsPipeline = pipelineStatus === 'OPERATIONS' || pipelineStatus === 'COMPLETE';
  
  const pipelineConfig = {
    SALES: {
      color: 'blue',
      bgColor: 'bg-blue-600',
      lightBg: 'bg-blue-50',
      border: 'border-blue-500',
      label: 'Sales Pipeline',
      stages: 'Stages 1-8',
      icon: Target,
      description: 'Lead qualification and deal closing',
    },
    OPERATIONS: {
      color: 'green',
      bgColor: 'bg-green-600',
      lightBg: 'bg-green-50',
      border: 'border-green-500',
      label: 'Operations Pipeline',
      stages: 'Stages 9-31',
      icon: Briefcase,
      description: 'Regulatory approvals and installation',
    },
    COMPLETE: {
      color: 'purple',
      bgColor: 'bg-purple-600',
      lightBg: 'bg-purple-50',
      border: 'border-purple-500',
      label: 'Complete',
      stages: 'All Stages Done',
      icon: CheckCircle,
      description: 'Customer journey complete',
    },
  };
  
  const config = pipelineConfig[pipelineStatus as keyof typeof pipelineConfig] || pipelineConfig.SALES;
  
  // Acknowledge handoff
  const acknowledgeHandoff = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          handoffAcknowledged: true,
          handoffAcknowledgedAt: new Date().toISOString(),
          handoffAcknowledgedBy: 'admin', // TODO: Get actual admin ID
        }),
      });
      
      if (response.ok) {
        toast.success('Handoff acknowledged');
        setShowHandoffAlert(false);
        fetchLead();
      }
    } catch (error) {
      toast.error('Failed to acknowledge handoff');
    }
  };

  return (
    <div key={renderKey} className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.quoteReference}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lead.deal && (
            <Link href={`/admin/crm/deals/${lead.deal.id}`}>
              <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                <Target className="w-4 h-4 mr-2" />
                View in CRM
              </Button>
            </Link>
          )}
          {lead.CustomerQuote?.id ? (
            <>
              <Button
                variant="outline"
                className="bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/admin/quotes/${lead.CustomerQuote.id}/debug`);
                    const data = await response.json();
                    console.log('Quote Debug Data:', data);
                    alert('Check browser console (F12) for quote data');
                  } catch (error) {
                    toast.error('Error fetching debug data');
                  }
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Debug Data
              </Button>
              
              <Button
                variant="outline"
                className="bg-purple-50 border-purple-200 hover:bg-purple-100"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/admin/quotes/${lead.CustomerQuote.id}/recalculate`, {
                      method: 'POST',
                    });
                    if (response.ok) {
                      toast.success('Quote data recalculated successfully');
                      fetchLead(); // Refresh data
                    } else {
                      toast.error('Failed to recalculate quote');
                    }
                  } catch (error) {
                    toast.error('Error recalculating quote');
                  }
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Recalculate Data
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="bg-red-50 border-red-200"
              onClick={() => {
                console.log('Full Lead Object:', lead);
                alert('No CustomerQuote found. Check console for details.');
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Debug: No Quote Found
            </Button>
          )}
          
          {lead.CustomerQuote && lead.CustomerQuote.id ? (
            lead.depositPaid ? (
              <Link href={`/proposal/${lead.CustomerQuote.id}`} target="_blank">
                <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Customer Proposal
                </Button>
              </Link>
            ) : (
              <Button 
                variant="outline" 
                disabled 
                className="bg-orange-50 border-orange-200 cursor-not-allowed"
                title="Deposit payment required to view proposal"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Awaiting Deposit
              </Button>
            )
          ) : (
            <Button 
              variant="outline" 
              disabled 
              className="bg-gray-50 border-gray-200 cursor-not-allowed"
              title="No quote generated yet"
            >
              <FileText className="w-4 h-4 mr-2" />
              No Proposal Yet
            </Button>
          )}
          <div className="flex items-center gap-3">
            <Badge className={`${config.bgColor} text-white text-lg px-4 py-2 flex items-center gap-2`}>
              <config.icon className="w-5 h-5" />
              {config.label}
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {lead.status.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-sm">{lead.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{lead.suburb || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Info */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">System Details</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Solar System</p>
              <p className="text-2xl font-bold">{lead.systemSizeKw}kW</p>
              <p className="text-sm text-muted-foreground">{lead.numPanels} panels</p>
            </div>
          </div>

          {hasBattery && (
            <div className="flex items-center gap-3">
              <Battery className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Battery Storage</p>
                <p className="text-2xl font-bold">{lead.batterySizeKwh}kWh</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Deposit Status</p>
              <p className="text-lg font-bold">
                {lead.depositPaid ? (
                  <span className="text-green-600">Paid</span>
                ) : (
                  <span className="text-red-600">Pending</span>
                )}
              </p>
              {lead.depositAmount && (
                <p className="text-sm text-muted-foreground">
                  ${lead.depositAmount.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Handoff Alert - Show when moved to Operations */}
      {isOperationsPipeline && !lead.handoffAcknowledged && showHandoffAlert && (
        <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-500">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-lg font-bold flex items-center justify-between">
            <span>🎉 Deal Won - Moved to Operations Pipeline!</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHandoffAlert(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">
              This customer has been successfully handed off from Sales to Operations team.
              All regulatory approvals and installation stages are now accessible.
            </p>
            {lead.handoffAt && (
              <p className="text-xs text-muted-foreground">
                Handoff completed on {new Date(lead.handoffAt).toLocaleString()}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Button onClick={acknowledgeHandoff} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Acknowledge Handoff
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Pipeline Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${pipelineStatus === 'SALES' ? 'bg-blue-600 animate-pulse' : 'bg-blue-400'}`}></div>
            <span className={`text-sm font-medium ${pipelineStatus === 'SALES' ? 'text-blue-600' : 'text-gray-400'}`}>
              Sales (1-8)
            </span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                pipelineStatus === 'SALES' ? 'bg-blue-600 w-1/2' : 
                pipelineStatus === 'OPERATIONS' ? 'bg-green-600 w-3/4' : 
                'bg-purple-600 w-full'
              }`}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${pipelineStatus === 'OPERATIONS' ? 'bg-green-600 animate-pulse' : pipelineStatus === 'COMPLETE' ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-medium ${pipelineStatus === 'OPERATIONS' ? 'text-green-600' : pipelineStatus === 'COMPLETE' ? 'text-gray-400' : 'text-gray-300'}`}>
              Operations (9-31)
            </span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                pipelineStatus === 'COMPLETE' ? 'bg-purple-600 w-full' : 'bg-gray-300 w-0'
              }`}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${pipelineStatus === 'COMPLETE' ? 'bg-purple-600 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className={`text-sm font-medium ${pipelineStatus === 'COMPLETE' ? 'text-purple-600' : 'text-gray-300'}`}>
              Complete
            </span>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          {config.description}
        </p>
      </Card>

      {/* Tabs - 25 Stage Workflow */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="lead-qualify">
            <div className="flex items-center gap-2">
              Lead & Qualify (1-5)
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5">SALES</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger value="site-proposal">
            <div className="flex items-center gap-2">
              Site & Proposal (6-8)
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5">SALES</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            disabled={!isWon}
            className={!isWon ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <div className="flex items-center gap-2">
              Approvals (9-20)
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">OPS</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="installation" 
            disabled={!isWon}
            className={!isWon ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <div className="flex items-center gap-2">
              Installation (21-25)
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">OPS</Badge>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="completion" 
            disabled={!isWon}
            className={!isWon ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <div className="flex items-center gap-2">
              Completion (26-31)
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">OPS</Badge>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Lead Status Timeline - 25 Stages */}
          {lead && lead.rebateTracking && lead.regulatoryApplication && (
            <LeadStatusTimeline 
              key={`timeline-${lead.id}-${lead.rebateTracking?.waStateConfirmedAt || 'none'}-${lead.rebateTracking?.stcConfirmed || 'none'}`}
              lead={lead}
              onStageClick={(tab) => setActiveTab(tab)}
            />
          )}
          
          {lead && (!lead.rebateTracking || !lead.regulatoryApplication) && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">Loading timeline data...</p>
            </Card>
          )}

          {/* Installation Readiness Widget */}
          <InstallationReadinessWidget leadId={leadId} />

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Full Address</p>
                <p className="font-medium">{lead.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium">{lead.propertyType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Household Size</p>
                <p className="font-medium">{lead.householdSize} people</p>
              </div>
              {lead.quarterlyBill && (
                <div>
                  <p className="text-sm text-muted-foreground">Quarterly Bill</p>
                  <p className="font-medium">${lead.quarterlyBill}</p>
                </div>
              )}
            </div>
          </Card>

          {lead.notes && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-muted-foreground">{lead.notes}</p>
            </Card>
          )}
        </TabsContent>

        {/* STAGE 1-5: Lead & Qualify Tab */}
        <TabsContent value="lead-qualify" className="space-y-4">
          {/* STAGES 1-4: Lead Qualification */}
          <LeadQualificationCard leadId={leadId} lead={lead} onUpdate={fetchLead} />

          {/* STAGE 5: Deposit Payment */}
          <PaymentConfirmationCard leadId={leadId} lead={lead} onUpdate={fetchLead} />
        </TabsContent>

        {/* STAGE 6-8: Site Visit & Proposal Tab */}
        <TabsContent value="site-proposal" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Stages 6-8: Site Visit & Final Proposal</h2>
          </Card>

          {/* STAGE 6: Site Visit */}
          <SiteVisitCard 
            leadId={leadId}
            lead={lead}
            siteVisit={siteVisit}
            onUpdate={() => {
              fetchLead();
              fetchSiteVisit();
            }}
          />

          {/* Property & Technical Details */}
          <PropertyTechnicalDetailsCard 
            leadId={leadId}
            lead={lead}
            onUpdate={fetchLead}
          />

          {/* STAGE 7: Final Proposal Sent */}
          <Card className={`p-6 border-2 ${lead.finalProposalSentAt ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">7</div>
                <div>
                  <h3 className="text-xl font-semibold">Proposal Sent</h3>
                  <p className="text-sm text-muted-foreground">Final proposal after site visit</p>
                </div>
              </div>
              {lead.finalProposalSentAt ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Sent
                </Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </div>

            {/* Site Visit Requirement */}
            {!lead.siteVisit?.completedAt && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Complete site visit first before sending final proposal
                </p>
              </div>
            )}
            
            {lead.finalProposalSentAt && (
              <div className="mb-4 p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">Sent on: {new Date(lead.finalProposalSentAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500 mt-1">To: {lead.email}</p>
              </div>
            )}

            {lead.CustomerQuote && (
              <div className="space-y-2">
                {/* Preview Proposal Button */}
                <Link href={`/proposal/${lead.CustomerQuote.id}`} target="_blank">
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Proposal
                  </Button>
                </Link>

                {/* Send Proposal Button */}
                {!lead.finalProposalSentAt && lead.siteVisit?.completedAt && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      if (!confirm(`Send final proposal to ${lead.name} (${lead.email})?`)) return;
                      
                      try {
                        const token = localStorage.getItem('admin_token');
                        
                        // Send email
                        const emailResponse = await fetch('/api/admin/send-proposal-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            leadId: lead.id,
                            quoteId: lead.CustomerQuote.id,
                            customerEmail: lead.email,
                            customerName: lead.name
                          })
                        });

                        if (!emailResponse.ok) throw new Error('Failed to send email');

                        // Mark as sent
                        const updateResponse = await fetch(`/api/admin/leads/${lead.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            finalProposalSentAt: new Date().toISOString()
                          })
                        });

                        if (!updateResponse.ok) throw new Error('Failed to update lead');

                        alert('Proposal sent successfully!');
                        fetchLead();
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to send proposal. Please try again.');
                      }
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Proposal to Customer
                  </Button>
                )}

                {lead.finalProposalSentAt && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={async () => {
                      if (!confirm(`Resend proposal to ${lead.name} (${lead.email})?`)) return;
                      
                      try {
                        const token = localStorage.getItem('admin_token');
                        const response = await fetch('/api/admin/send-proposal-email', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            leadId: lead.id,
                            quoteId: lead.CustomerQuote.id,
                            customerEmail: lead.email,
                            customerName: lead.name
                          })
                        });

                        if (!response.ok) throw new Error('Failed to resend');
                        alert('Proposal resent successfully!');
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Failed to resend proposal');
                      }
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Proposal
                  </Button>
                )}

                <p className="text-xs text-gray-500 text-center">
                  Customer will receive email with link to view and sign proposal
                </p>
              </div>
            )}
          </Card>

          {/* STAGE 8: Proposal Accepted */}
          <Card className={`p-6 border-2 ${lead.CustomerQuote?.status === 'ACCEPTED' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">8</div>
                <div>
                  <h3 className="text-xl font-semibold">Proposal Accepted</h3>
                  <p className="text-sm text-muted-foreground">Customer signs and accepts</p>
                  {/* DEBUG */}
                  <p className="text-xs text-red-600 mt-1">
                    DEBUG: Status = "{lead.CustomerQuote?.status}" | SignedAt = {lead.CustomerQuote?.signedAt ? 'YES' : 'NO'}
                  </p>
                </div>
              </div>
              {lead.CustomerQuote?.status === 'ACCEPTED' ? (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accepted
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Clock className="w-4 h-4 mr-1" />
                  Awaiting Signature
                </Badge>
              )}
            </div>

            {lead.CustomerQuote?.status === 'ACCEPTED' ? (
              <div className="space-y-3">
                {lead.CustomerQuote.signedAt && (
                  <div className="p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm font-semibold text-green-800">
                      ✓ Signed on: {new Date(lead.CustomerQuote.signedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {lead.CustomerQuote.customerSignature && (
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 mb-2">Customer Signature:</p>
                    {typeof window !== 'undefined' && (
                      <img 
                        src={lead.CustomerQuote.customerSignature} 
                        alt="Customer Signature" 
                        className="max-w-xs h-20 border border-gray-300 rounded"
                      />
                    )}
                  </div>
                )}

                <Link href={`/proposal/${lead.CustomerQuote.id}`} target="_blank">
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View Signed Proposal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Waiting for customer to review and sign the proposal
                  </p>
                </div>
                
                {lead.CustomerQuote && (
                  <Link href={`/proposal/${lead.CustomerQuote.id}`} target="_blank">
                    <Button className="w-full" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Check Proposal Status
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* STAGE 9-20: Regulatory & Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Stages 9-20: Regulatory Approvals & Rebates</h2>
            <p className="text-muted-foreground mb-4">
              All approvals must be received before materials can be ordered (Gate 4)
            </p>
          </Card>
          {/* STAGES 9-12: Regulatory Applications (Synergy & Western Power) */}
          <RegulatoryApplicationsCard leadId={leadId} lead={lead} />

          {/* STAGES 13-18: Rebate Tracking (STC, Federal Battery, WA State) */}
          <RebateTrackingCard leadId={leadId} lead={lead} />

          {/* STAGES 19-20: Loan Application (if battery) */}
          {hasBattery && <LoanApplicationCard leadId={leadId} lead={lead} />}
        </TabsContent>

        {/* STAGE 21-25: Installation Tab */}
        <TabsContent value="installation" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Stages 21-25: Materials & Installation</h2>
          </Card>

          {/* STAGE 21-22: Materials Ordering & Confirmation */}
          <MaterialOrderCard leadId={leadId} lead={lead} />

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 23: Team Assigned</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Installation team or subcontractor assigned to job
            </p>
            <div className="space-y-3 mb-3">
              {lead.InstallationJob?.team && (
                <div>
                  <Badge className="bg-blue-100 text-blue-800 mb-2">✓ Team Assigned</Badge>
                  <p className="text-sm"><strong>Team:</strong> {lead.InstallationJob.team.name}</p>
                </div>
              )}
              {lead.InstallationJob?.subcontractor && (
                <div>
                  <Badge className="bg-purple-100 text-purple-800 mb-2">✓ Subcontractor Assigned</Badge>
                  <p className="text-sm"><strong>Installer:</strong> {lead.InstallationJob.subcontractor.companyName}</p>
                  <p className="text-sm text-muted-foreground">Contact: {lead.InstallationJob.subcontractor.contactName}</p>
                </div>
              )}
              {!lead.InstallationJob?.team && !lead.InstallationJob?.subcontractor && (
                <p className="text-sm text-muted-foreground">No installer assigned yet</p>
              )}
            </div>
            {lead.InstallationJob && (
              <Link href={`/admin/jobs/${lead.InstallationJob.id}`}>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  {lead.InstallationJob.teamId || lead.InstallationJob.subcontractorId ? 'View Assignment' : 'Assign Team'}
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 24: Installation Scheduled</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Installation date and time confirmed with customer
            </p>
            {lead.InstallationJob?.scheduledDate && (
              <div className="mb-3 space-y-2">
                <Badge className="bg-green-100 text-green-800 mb-2">✓ Scheduled</Badge>
                <p className="text-sm"><strong>Date:</strong> {new Date(lead.InstallationJob.scheduledDate).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                {lead.InstallationJob.scheduledStartTime && (
                  <p className="text-sm"><strong>Time:</strong> {lead.InstallationJob.scheduledStartTime}</p>
                )}
                {lead.InstallationJob.estimatedDuration && (
                  <p className="text-sm"><strong>Duration:</strong> ~{lead.InstallationJob.estimatedDuration} hours</p>
                )}
                {(lead.InstallationJob.team || lead.InstallationJob.subcontractor) && (
                  <p className="text-sm"><strong>Installer:</strong> {lead.InstallationJob.team?.name || lead.InstallationJob.subcontractor?.companyName}</p>
                )}
              </div>
            )}
            {lead.InstallationJob && (
              <Link href={`/admin/schedule?jobId=${lead.InstallationJob.id}`}>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  {lead.InstallationJob.scheduledDate ? 'View Schedule' : 'Schedule Installation'}
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 25: Installation Completed</h3>
            <p className="text-sm text-muted-foreground mb-4">
              System installed and operational
            </p>
            {lead.InstallationJob?.completedAt && (
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2">✓ Completed</Badge>
                <p className="text-sm">Completed: {new Date(lead.InstallationJob.completedAt).toLocaleString()}</p>
              </div>
            )}
          </Card>

          {lead.InstallationJob ? (
            <>
              {/* Compliance Photo Upload */}
              <CompliancePhotoUploadCard jobId={lead.InstallationJob.id} />

              {/* Equipment Serial Numbers */}
              <SerialNumberTrackingCard jobId={lead.InstallationJob.id} lead={lead} />

              {/* Compliance Checklist */}
              <ComplianceChecklistCard jobId={lead.InstallationJob.id} />

              {/* Electrician Assignment */}
              <ElectricianAssignmentCard 
                jobId={lead.InstallationJob.id}
                electricianId={lead.InstallationJob.leadElectricianId}
              />

              {/* Document Generation */}
              <DocumentGenerationCard jobId={lead.InstallationJob.id} />

              {/* Generated Documents List */}
              <GeneratedDocumentsList jobId={lead.InstallationJob.id} />
            </>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Installation Details</h3>
              <p className="text-muted-foreground mb-4">
                Installation job will be created once deposit is paid and all approvals are complete.
              </p>
              {lead.depositPaid && lead.readyForInstallation && (
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/admin/jobs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId: lead.id }),
                      });
                      if (response.ok) {
                        window.location.reload();
                      } else {
                        const error = await response.json();
                        alert(`Error: ${error.error}`);
                      }
                    } catch (error) {
                      alert('Failed to create installation job');
                    }
                  }}
                >
                  Create Installation Job
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* STAGE 26-31: Completion Tab */}
        <TabsContent value="completion" className="space-y-4">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Stages 26-31: Post-Installation & Completion</h2>
          </Card>

          {/* STAGE 26: Documentation Submitted */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 26: Documentation Submitted</h3>
            <p className="text-sm text-muted-foreground mb-4">
              All compliance documents submitted for rebate claims and grid connection
            </p>
          </Card>
          {lead.InstallationJob && (
            <>
              <ComplianceDocumentsCard jobId={lead.InstallationJob.id} />
              
              {/* Pre-Submission Validation */}
              <SubmissionValidation 
                jobId={lead.InstallationJob.id}
                onSubmit={() => {
                  toast.success('Submitted to GreenDeal for STC processing');
                  fetchLead();
                }}
              />
            </>
          )}

          {/* STAGE 27: Final Invoice Raised */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 27: Final Invoice Raised</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Final invoice sent to customer (after rebates confirmed)
            </p>
            {lead.finalAmount && (
              <div>
                <p className="text-sm">Amount: ${lead.finalAmount.toLocaleString()}</p>
              </div>
            )}
          </Card>

          {/* STAGE 28: Final Invoice Paid */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 28: Final Invoice Paid</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Customer has paid final balance
            </p>
            {lead.finalPaid ? (
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2">✓ Paid</Badge>
                {lead.finalPaidAt && (
                  <p className="text-sm">Paid: {new Date(lead.finalPaidAt).toLocaleString()}</p>
                )}
              </div>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment</Badge>
            )}
          </Card>

          {/* STAGE 29: Handover Complete */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 29: Customer Handover</h3>
            <p className="text-sm text-muted-foreground mb-4">
              System handover and customer training completed
            </p>
            <Button variant="outline">
              Mark Handover Complete
            </Button>
          </Card>

          {/* STAGE 30: Customer Survey */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 30: Customer Survey</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Satisfaction survey sent and completed
            </p>
            {lead.surveyCompletedAt ? (
              <div>
                <Badge className="bg-green-100 text-green-800 mb-2">✓ Completed</Badge>
                <p className="text-sm">Completed: {new Date(lead.surveyCompletedAt).toLocaleString()}</p>
              </div>
            ) : lead.surveyRequestedAt ? (
              <Badge className="bg-yellow-100 text-yellow-800">Survey Sent</Badge>
            ) : (
              <Button variant="outline">
                Send Survey
              </Button>
            )}
          </Card>

          {/* STAGE 31: Maintenance */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Stage 31: Ongoing Maintenance</h3>
            <p className="text-sm text-muted-foreground mb-4">
              System in maintenance mode - periodic check-ins and support
            </p>
            <Badge className="bg-blue-100 text-blue-800">Active Customer</Badge>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
