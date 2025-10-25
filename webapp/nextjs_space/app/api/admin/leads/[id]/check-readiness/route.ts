import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { checkInstallationReadiness, getPendingApprovals } from '@/lib/installation-readiness';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/leads/[id]/check-readiness
 * Check and update installation readiness for a lead
 * Should be called whenever any approval status changes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;

    // Check readiness
    const result = await checkInstallationReadiness(leadId);

    // Get pending approvals
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        regulatoryApplication: true,
        rebateTracking: true,
        loanApplication: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const pendingApprovals = getPendingApprovals(lead);

    return NextResponse.json({
      success: true,
      readiness: {
        ready: result.ready,
        reason: result.reason,
        statusChanged: result.statusChanged
      },
      approvals: pendingApprovals
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error checking readiness:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check readiness',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/leads/[id]/check-readiness
 * Get current readiness status without updating
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;

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
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const pendingApprovals = getPendingApprovals(lead);

    return NextResponse.json({
      success: true,
      readiness: {
        ready: lead.readyForInstallation,
        reason: lead.installationBlockedReason,
        readySince: lead.readyForInstallationAt
      },
      approvals: pendingApprovals,
      job: lead.InstallationJob ? {
        id: lead.InstallationJob.id,
        jobNumber: lead.InstallationJob.jobNumber,
        status: lead.InstallationJob.status
      } : null
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error getting readiness:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get readiness',
        details: error.message
      },
      { status: 500 }
    );
  }
}
