'use client';

import { 
  CheckCircle, 
  Circle, 
  Phone, 
  FileText, 
  CheckSquare, 
  Home, 
  DollarSign, 
  Shield, 
  Package, 
  Award, 
  Banknote, 
  Calendar, 
  Wrench, 
  Receipt, 
  MessageSquare 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadStatusTimelineProps {
  lead: any;
  onStageClick?: (tab: string) => void;
}

// 25-stage customer journey with tab mapping
const STAGES = [
  // Lead & Qualify (1-5)
  { id: 1, label: 'Lead', icon: Phone, description: 'Initial contact', tab: 'lead-qualify' },
  { id: 2, label: 'Qualify', icon: FileText, description: 'Proposals sent', tab: 'lead-qualify' },
  { id: 3, label: 'Contact', icon: Phone, description: 'Follow-up', tab: 'lead-qualify' },
  { id: 4, label: 'Confirmed', icon: CheckSquare, description: 'Quote accepted', tab: 'lead-qualify' },
  { id: 5, label: 'Deposit', icon: DollarSign, description: 'Deposit invoice', tab: 'lead-qualify' },
  // Site & Proposal (6-8)
  { id: 6, label: 'Site Visit', icon: Home, description: 'Technical assessment', tab: 'site-proposal' },
  { id: 7, label: 'Proposal Sent', icon: FileText, description: 'Final proposal', tab: 'site-proposal' },
  { id: 8, label: 'Accepted', icon: CheckSquare, description: 'Customer signs', tab: 'site-proposal' },
  // Approvals (9-20)
  { id: 9, label: 'Synergy Sent', icon: Shield, description: 'DES application', tab: 'approvals' },
  { id: 10, label: 'Synergy OK', icon: Shield, description: 'Approved', tab: 'approvals' },
  { id: 11, label: 'WP Sent', icon: Shield, description: 'WP application', tab: 'approvals' },
  { id: 12, label: 'WP OK', icon: Shield, description: 'Approved', tab: 'approvals' },
  { id: 13, label: 'STC Sent', icon: Award, description: 'Federal solar', tab: 'approvals' },
  { id: 14, label: 'STC OK', icon: Award, description: 'Confirmed', tab: 'approvals' },
  { id: 15, label: 'Fed Battery Sent', icon: Award, description: 'Federal battery', tab: 'approvals' },
  { id: 16, label: 'Fed Battery OK', icon: Award, description: 'Confirmed', tab: 'approvals' },
  { id: 17, label: 'State Sent', icon: Banknote, description: 'WA rebate', tab: 'approvals' },
  { id: 18, label: 'State OK', icon: Banknote, description: 'Confirmed', tab: 'approvals' },
  { id: 19, label: 'Loan Sent', icon: Banknote, description: 'Plenti loan', tab: 'approvals' },
  { id: 20, label: 'Loan OK', icon: Banknote, description: 'Approved', tab: 'approvals' },
  // Installation (21-25)
  { id: 21, label: 'Materials Ordered', icon: Package, description: 'PO sent', tab: 'installation' },
  { id: 22, label: 'Materials OK', icon: Package, description: 'Confirmed', tab: 'installation' },
  { id: 23, label: 'Team Assigned', icon: Wrench, description: 'Installer ready', tab: 'installation' },
  { id: 24, label: 'Scheduled', icon: Calendar, description: 'Installation date', tab: 'installation' },
  { id: 25, label: 'Installed', icon: Wrench, description: 'Job complete', tab: 'installation' },
  // Completion (26-31)
  { id: 26, label: 'Docs Submitted', icon: FileText, description: 'Compliance', tab: 'completion' },
  { id: 27, label: 'Invoice Raised', icon: Receipt, description: 'Final invoice', tab: 'completion' },
  { id: 28, label: 'Invoice Paid', icon: DollarSign, description: 'Payment received', tab: 'completion' },
  { id: 29, label: 'Handover', icon: CheckCircle, description: 'Customer training', tab: 'completion' },
  { id: 30, label: 'Survey', icon: MessageSquare, description: 'Feedback', tab: 'completion' },
  { id: 31, label: 'Maintenance', icon: Wrench, description: 'Active customer', tab: 'completion' },
];

/**
 * Calculate current stage based on existing lead data (1-31)
 * Finds the highest completed stage
 */
function calculateCurrentStage(lead: any): number {
  let highestStage = 1; // Default to stage 1
  
  // Check each stage and track the highest completed one
  if (lead.proposalSentAt || lead.CustomerQuote) highestStage = Math.max(highestStage, 2);
  if (lead.firstContactedAt || lead.contactAttempts > 0) highestStage = Math.max(highestStage, 3);
  if (lead.confirmedAt || lead.status === 'won') highestStage = Math.max(highestStage, 4);
  if (lead.depositPaid) highestStage = Math.max(highestStage, 5);
  if (lead.siteVisit?.completedAt) highestStage = Math.max(highestStage, 6);
  if (lead.finalProposalSentAt) highestStage = Math.max(highestStage, 7);
  if (lead.CustomerQuote?.status === 'ACCEPTED') highestStage = Math.max(highestStage, 8);
  
  // Regulatory
  if (lead.regulatoryApplication?.synergyFilledAt) highestStage = Math.max(highestStage, 9);
  if (lead.regulatoryApplication?.synergyApproved) highestStage = Math.max(highestStage, 10);
  if (lead.regulatoryApplication?.wpSubmittedAt) highestStage = Math.max(highestStage, 11);
  if (lead.regulatoryApplication?.wpApproved) highestStage = Math.max(highestStage, 12);
  
  // Rebates
  if (lead.rebateTracking?.stcSubmittedAt) highestStage = Math.max(highestStage, 13);
  if (lead.rebateTracking?.stcConfirmed) highestStage = Math.max(highestStage, 14);
  if (lead.rebateTracking?.federalBatterySubmittedAt) highestStage = Math.max(highestStage, 15);
  if (lead.rebateTracking?.federalBatteryConfirmed) highestStage = Math.max(highestStage, 16);
  if (lead.rebateTracking?.waStateSubmittedAt) highestStage = Math.max(highestStage, 17);
  if (lead.rebateTracking?.waStateConfirmed) highestStage = Math.max(highestStage, 18);
  
  // Loan
  if (lead.loanApplication?.submittedAt) highestStage = Math.max(highestStage, 19);
  if (lead.loanApplication?.approved) highestStage = Math.max(highestStage, 20);
  
  // Materials
  const materialsOrdered = lead.InstallationJob?.materialOrders?.some(
    (order: any) => order.status !== 'DRAFT'
  );
  const materialsConfirmed = lead.InstallationJob?.materialOrders?.some(
    (order: any) => order.status === 'CONFIRMED' || order.status === 'DELIVERED'
  );
  if (materialsOrdered) highestStage = Math.max(highestStage, 21);
  if (materialsConfirmed) highestStage = Math.max(highestStage, 22);
  
  // Installation
  if (lead.InstallationJob?.teamId || lead.InstallationJob?.subcontractorId) highestStage = Math.max(highestStage, 23);
  if (lead.InstallationJob?.scheduledDate) highestStage = Math.max(highestStage, 24);
  if (lead.InstallationJob?.completedAt) highestStage = Math.max(highestStage, 25);
  
  // Completion
  if (lead.finalPaid || lead.finalPaidAt) highestStage = Math.max(highestStage, 28);
  if (lead.surveyRequestedAt) highestStage = Math.max(highestStage, 29);
  if (lead.surveyCompletedAt) highestStage = Math.max(highestStage, 30);
  
  // Return next stage to work on
  return highestStage + 1;
}

/**
 * Get next action based on current stage
 */
function getNextAction(currentStage: number, lead: any): string {
  switch (currentStage) {
    case 1:
      return 'Contact customer and send proposal';
    case 2:
      return 'Follow up on proposal and close deal';
    case 3:
      return 'Schedule site visit';
    case 4:
      return 'Generate and send deposit invoice';
    case 5:
      return 'Lodge Synergy & Western Power applications';
    case 6:
      return 'Issue purchase order to supplier';
    case 7:
      return 'Lodge STC application via GreenDeal';
    case 8:
      return 'Submit WA State Rebate/Loan application';
    case 9:
      return 'Schedule installation date';
    case 10:
      return 'Complete installation';
    case 11:
      return 'Send final invoice';
    case 12:
      return 'Send customer survey';
    case 13:
      return 'Job complete!';
    default:
      return 'Continue with next step';
  }
}

export function LeadStatusTimeline({ lead, onStageClick }: LeadStatusTimelineProps) {
  const currentStage = calculateCurrentStage(lead);
  const progress = (currentStage / 31) * 100;
  const nextAction = getNextAction(currentStage, lead);
  
  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('=== Timeline Debug ===');
    console.log('Current Stage:', currentStage);
    console.log('Rebate Tracking:', {
      stcConfirmed: lead?.rebateTracking?.stcConfirmed,
      stcApplicationSubmitted: lead?.rebateTracking?.stcApplicationSubmitted,
      waStateConfirmed: lead?.rebateTracking?.waStateConfirmed,
      waStateApplied: lead?.rebateTracking?.waStateApplied,
      federalBatteryConfirmed: lead?.rebateTracking?.federalBatteryConfirmed,
      allRebatesConfirmed: lead?.rebateTracking?.allRebatesConfirmed,
    });
    console.log('Regulatory:', {
      synergyApproved: lead?.regulatoryApplication?.synergyApproved,
      wpApproved: lead?.regulatoryApplication?.wpApproved,
      allApprovalsReceived: lead?.regulatoryApplication?.allApprovalsReceived,
    });
    console.log('Installation Job:', {
      status: lead?.InstallationJob?.status,
      scheduledDate: lead?.InstallationJob?.scheduledDate,
      materialOrdersCount: lead?.InstallationJob?.materialOrders?.length,
    });
    console.log('==================');
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Customer Journey Progress</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {currentStage}/31
          </span>
        </div>
      </div>

      {/* Current Stage & Next Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            {STAGES[currentStage - 1] && (() => {
              const CurrentIcon = STAGES[currentStage - 1].icon;
              return <CurrentIcon className="w-5 h-5" />;
            })()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Current Stage: {STAGES[currentStage - 1]?.label}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Next Action: {nextAction}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {STAGES.map((stage) => {
          const isCompleted = stage.id < currentStage;
          const isCurrent = stage.id === currentStage;
          const isPending = stage.id > currentStage;
          
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              onClick={() => onStageClick?.(stage.tab)}
              className={`
                relative p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md
                ${isCompleted ? 'bg-green-50 border-green-500 hover:bg-green-100' : ''}
                ${isCurrent ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200 hover:bg-blue-100' : ''}
                ${isPending ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : ''}
              `}
            >
              {/* Stage Icon */}
              <div className="flex items-center gap-2 mb-2">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
                <Icon
                  className={`w-4 h-4 ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                />
              </div>

              {/* Stage Info */}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isCompleted
                      ? 'text-green-900'
                      : isCurrent
                      ? 'text-blue-900'
                      : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isCompleted
                      ? 'text-green-700'
                      : isCurrent
                      ? 'text-blue-700'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.description}
                </p>
              </div>

              {/* Stage Number Badge */}
              <div className="absolute top-2 right-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isCompleted
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                >
                  {stage.id}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-4 border-t">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span>Current Stage</span>
        </div>
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-gray-400" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
