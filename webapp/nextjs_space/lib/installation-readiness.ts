/**
 * Installation Readiness Check System
 * 
 * This module handles the gate system for installation scheduling.
 * Installation can ONLY be scheduled when ALL gates pass:
 * 1. Deposit Paid
 * 2. Synergy Approved
 * 3. Western Power Approved
 * 4. STC Rebate Confirmed
 * 5. Battery Rebates Confirmed (if applicable)
 * 6. Loan Approved (if requested)
 */

import { prisma } from '@/lib/db';
import type { Lead, RegulatoryApplication, RebateTracking, LoanApplication } from '@prisma/client';

type LeadWithRelations = Lead & {
  regulatoryApplication: RegulatoryApplication | null;
  rebateTracking: RebateTracking | null;
  loanApplication: LoanApplication | null;
  InstallationJob?: any;
};

/**
 * Check if a lead can have installation scheduled
 * Returns true only if ALL gates pass
 */
export function canScheduleInstallation(lead: LeadWithRelations): boolean {
  // Gate 1: Deposit Paid
  if (!lead.depositPaid) {
    return false;
  }

  // Gate 2: Synergy Approved
  if (!lead.regulatoryApplication?.synergyApproved) {
    return false;
  }

  // Gate 3: Western Power Approved
  if (!lead.regulatoryApplication?.wpApproved) {
    return false;
  }

  // Gate 4: STC Rebate Confirmed (REQUIRED)
  if (!lead.rebateTracking?.stcConfirmed) {
    return false;
  }

  // Gate 5: Federal Battery Rebate Confirmed (if applicable)
  if (lead.rebateTracking?.federalBatteryAmount && lead.rebateTracking.federalBatteryAmount > 0) {
    if (!lead.rebateTracking.federalBatteryConfirmed) {
      return false;
    }
  }

  // Gate 6: WA State Rebate Confirmed (if applicable)
  if (lead.rebateTracking?.waStateAmount && lead.rebateTracking.waStateAmount > 0) {
    if (!lead.rebateTracking.waStateConfirmed) {
      return false;
    }
  }

  // Gate 7: Loan Approved (if requested)
  if (lead.loanRequested) {
    if (!lead.loanApplication?.approved) {
      return false;
    }
  }

  // All gates passed!
  return true;
}

/**
 * Get the reason why installation is blocked
 */
export function getBlockedReason(lead: LeadWithRelations): string | null {
  if (!lead.depositPaid) {
    return 'Deposit not paid';
  }

  if (!lead.regulatoryApplication?.synergyApproved) {
    return 'Synergy approval pending';
  }

  if (!lead.regulatoryApplication?.wpApproved) {
    return 'Western Power approval pending';
  }

  if (!lead.rebateTracking?.stcConfirmed) {
    return 'STC rebate confirmation pending';
  }

  if (lead.rebateTracking?.federalBatteryAmount && lead.rebateTracking.federalBatteryAmount > 0) {
    if (!lead.rebateTracking.federalBatteryConfirmed) {
      return 'Federal battery rebate confirmation pending';
    }
  }

  if (lead.rebateTracking?.waStateAmount && lead.rebateTracking.waStateAmount > 0) {
    if (!lead.rebateTracking.waStateConfirmed) {
      return 'WA state rebate confirmation pending';
    }
  }

  if (lead.loanRequested && !lead.loanApplication?.approved) {
    return 'Loan approval pending';
  }

  return null; // Not blocked
}

/**
 * Get list of pending approvals for a lead
 */
export function getPendingApprovals(lead: LeadWithRelations): Array<{
  type: string;
  status: 'pending' | 'approved';
  label: string;
}> {
  const approvals = [];

  // Deposit
  approvals.push({
    type: 'deposit',
    status: lead.depositPaid ? 'approved' : 'pending',
    label: 'Deposit Paid'
  });

  // Synergy
  approvals.push({
    type: 'synergy',
    status: lead.regulatoryApplication?.synergyApproved ? 'approved' : 'pending',
    label: 'Synergy Approval'
  });

  // Western Power
  approvals.push({
    type: 'western_power',
    status: lead.regulatoryApplication?.wpApproved ? 'approved' : 'pending',
    label: 'Western Power Approval'
  });

  // STC Rebate
  approvals.push({
    type: 'stc',
    status: lead.rebateTracking?.stcConfirmed ? 'approved' : 'pending',
    label: 'STC Rebate Confirmed'
  });

  // Federal Battery (if applicable)
  if (lead.rebateTracking?.federalBatteryAmount && lead.rebateTracking.federalBatteryAmount > 0) {
    approvals.push({
      type: 'federal_battery',
      status: lead.rebateTracking.federalBatteryConfirmed ? 'approved' : 'pending',
      label: 'Federal Battery Rebate'
    });
  }

  // WA State (if applicable)
  if (lead.rebateTracking?.waStateAmount && lead.rebateTracking.waStateAmount > 0) {
    approvals.push({
      type: 'wa_state',
      status: lead.rebateTracking.waStateConfirmed ? 'approved' : 'pending',
      label: 'WA State Rebate'
    });
  }

  // Loan (if requested)
  if (lead.loanRequested) {
    approvals.push({
      type: 'loan',
      status: lead.loanApplication?.approved ? 'approved' : 'pending',
      label: 'Loan Approval'
    });
  }

  return approvals;
}

/**
 * Check and update installation readiness for a lead
 * This should be called whenever any approval status changes
 */
export async function checkInstallationReadiness(leadId: string): Promise<{
  ready: boolean;
  reason: string | null;
  statusChanged: boolean;
}> {
  // Fetch lead with all relations
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      regulatoryApplication: true,
      rebateTracking: true,
      loanApplication: true,
      InstallationJob: true
    }
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  // Check if ready
  const isReady = canScheduleInstallation(lead);
  const blockedReason = isReady ? null : getBlockedReason(lead);
  const statusChanged = lead.readyForInstallation !== isReady;

  // Update lead readiness
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      readyForInstallation: isReady,
      readyForInstallationAt: isReady ? new Date() : null,
      installationBlockedReason: blockedReason
    }
  });

  // Update installation job if exists
  if (lead.InstallationJob) {
    const newJobStatus = isReady ? 'READY_TO_SCHEDULE' : 'BLOCKED_APPROVALS';
    
    await prisma.installationJob.update({
      where: { leadId },
      data: {
        status: newJobStatus,
        installationNotes: blockedReason || null,
        updatedAt: new Date()
      }
    });

    // If status changed to ready, create activity
    if (isReady && statusChanged) {
      await prisma.leadActivity.create({
        data: {
          leadId,
          type: 'status_change',
          description: 'All approvals received - Installation ready to schedule',
          createdBy: 'system',
          createdAt: new Date()
        }
      });

      // Auto-create material order (hybrid approach)
      try {
        const { autoCreateMaterialOrder } = await import('./material-order-automation');
        await autoCreateMaterialOrder(lead.InstallationJob.id);
      } catch (error) {
        console.error('Failed to auto-create material order:', error);
        // Don't fail the readiness check if material order creation fails
      }
    }
  }

  return {
    ready: isReady,
    reason: blockedReason,
    statusChanged
  };
}

/**
 * Create installation job when deposit is paid
 * Job will be created with BLOCKED_APPROVALS status initially
 */
export async function createInstallationJobFromLead(leadId: string): Promise<any> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      regulatoryApplication: true,
      rebateTracking: true,
      loanApplication: true,
      InstallationJob: true,
      CustomerQuote: true
    }
  });

  if (!lead) {
    throw new Error('Lead not found');
  }

  // Check if job already exists
  if (lead.InstallationJob) {
    return lead.InstallationJob;
  }

  // Determine initial status
  const isReady = canScheduleInstallation(lead);
  const initialStatus = isReady ? 'READY_TO_SCHEDULE' : 'BLOCKED_APPROVALS';
  const blockedReason = isReady ? null : getBlockedReason(lead);

  // Generate job number
  const timestamp = Date.now();
  const jobNumber = `JOB-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;

  // Get inverter model from quote if available
  let inverterModel = 'TBD';
  if (lead.CustomerQuote) {
    inverterModel = lead.CustomerQuote.inverterBrandName || 'TBD';
  }

  // Create installation job
  const job = await prisma.installationJob.create({
    data: {
      id: `job_${timestamp}`,
      leadId: lead.id,
      jobNumber,
      status: initialStatus,
      systemSize: lead.systemSizeKw,
      panelCount: lead.numPanels,
      batteryCapacity: lead.batterySizeKwh || 0,
      inverterModel,
      schedulingDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      installationNotes: blockedReason,
      siteLatitude: lead.latitude || undefined,
      siteLongitude: lead.longitude || undefined,
      siteSuburb: lead.suburb || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  // Create activity
  await prisma.leadActivity.create({
    data: {
      leadId,
      type: 'status_change',
      description: `Installation job created: ${jobNumber}`,
      createdBy: 'system',
      createdAt: new Date()
    }
  });

  return job;
}
