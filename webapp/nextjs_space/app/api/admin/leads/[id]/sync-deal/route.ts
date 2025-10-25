import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { syncDealStageFromLead, updateLeadScore } from '@/lib/crm/deal-automation';

/**
 * API Route: Sync Deal from Lead Updates
 * Automatically updates deal stage and score when lead changes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    
    const { id: leadId } = params;

    // Sync deal stage based on lead status
    await syncDealStageFromLead(leadId);

    // Recalculate and update lead score
    const newScore = await updateLeadScore(leadId);

    return NextResponse.json({
      success: true,
      message: 'Deal synced successfully',
      leadScore: newScore,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error syncing deal:', error);
    return NextResponse.json(
      { error: 'Failed to sync deal', details: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
