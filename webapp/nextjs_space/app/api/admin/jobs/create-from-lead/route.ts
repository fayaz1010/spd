import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { createInstallationJobFromLead, checkInstallationReadiness } from '@/lib/installation-readiness';

/**
 * POST /api/admin/jobs/create-from-lead
 * Create an installation job from a lead
 * Called when deposit is paid
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Create the job
    const job = await createInstallationJobFromLead(leadId);

    // Check readiness (updates lead and job status)
    const readiness = await checkInstallationReadiness(leadId);

    return NextResponse.json({
      success: true,
      job,
      readiness: {
        ready: readiness.ready,
        reason: readiness.reason
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error creating installation job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create installation job',
        details: error.message
      },
      { status: 500 }
    );
  }
}
