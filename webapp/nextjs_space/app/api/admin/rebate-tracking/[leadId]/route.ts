import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/rebate-tracking/[leadId]
 * Create or update rebate tracking for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.leadId;
    const body = await request.json();

    const {
      stcAmount,
      stcReferenceNumber,
      stcSubmittedAt,
      stcConfirmed,
      stcConfirmedAt,
      federalBatteryAmount,
      federalBatteryReferenceNumber,
      federalBatterySubmittedAt,
      federalBatteryConfirmed,
      federalBatteryConfirmedAt,
      waStateAmount,
      waStateReferenceNumber,
      waStateSubmittedAt,
      waStateConfirmed,
      waStateConfirmedAt,
      changeLog // Audit trail from frontend
    } = body;

    // Check if rebate tracking exists
    const existing = await prisma.rebateTracking.findUnique({
      where: { leadId }
    });

    // Determine if all rebates are confirmed
    const allRebatesConfirmed = stcConfirmed &&
      (federalBatteryAmount > 0 ? federalBatteryConfirmed : true) &&
      (waStateAmount > 0 ? waStateConfirmed : true);

    let rebateTracking;

    // Check if values were modified from quote
    const modifiedFromQuote = changeLog && (
      changeLog.stcModified || 
      changeLog.federalModified || 
      changeLog.waStateModified
    );

    if (existing) {
      // Update existing - append to change log history
      const existingChangeLog = existing.changeLog as any || { history: [] };
      const updatedChangeLog = {
        ...existingChangeLog,
        history: [
          ...(existingChangeLog.history || []),
          ...(changeLog ? [changeLog] : [])
        ],
        lastUpdate: changeLog
      };

      rebateTracking = await prisma.rebateTracking.update({
        where: { leadId },
        data: {
          stcAmount: stcAmount !== undefined ? parseFloat(stcAmount) : existing.stcAmount,
          stcReferenceNumber: stcReferenceNumber || existing.stcReferenceNumber,
          stcSubmittedAt: stcSubmittedAt ? new Date(stcSubmittedAt) : existing.stcSubmittedAt,
          stcConfirmed: stcConfirmed !== undefined ? stcConfirmed : existing.stcConfirmed,
          stcConfirmedAt: stcConfirmedAt ? new Date(stcConfirmedAt) : existing.stcConfirmedAt,
          federalBatteryAmount: federalBatteryAmount !== undefined ? parseFloat(federalBatteryAmount) : existing.federalBatteryAmount,
          federalBatteryReferenceNumber: federalBatteryReferenceNumber || existing.federalBatteryReferenceNumber,
          federalBatterySubmittedAt: federalBatterySubmittedAt ? new Date(federalBatterySubmittedAt) : existing.federalBatterySubmittedAt,
          federalBatteryConfirmed: federalBatteryConfirmed !== undefined ? federalBatteryConfirmed : existing.federalBatteryConfirmed,
          federalBatteryConfirmedAt: federalBatteryConfirmedAt ? new Date(federalBatteryConfirmedAt) : existing.federalBatteryConfirmedAt,
          waStateAmount: waStateAmount !== undefined ? parseFloat(waStateAmount) : existing.waStateAmount,
          waStateReferenceNumber: waStateReferenceNumber || existing.waStateReferenceNumber,
          waStateSubmittedAt: waStateSubmittedAt ? new Date(waStateSubmittedAt) : existing.waStateSubmittedAt,
          waStateConfirmed: waStateConfirmed !== undefined ? waStateConfirmed : existing.waStateConfirmed,
          waStateConfirmedAt: waStateConfirmedAt ? new Date(waStateConfirmedAt) : existing.waStateConfirmedAt,
          allRebatesConfirmed,
          changeLog: updatedChangeLog,
          modifiedFromQuote: modifiedFromQuote || existing.modifiedFromQuote,
          lastModifiedAt: modifiedFromQuote ? new Date() : existing.lastModifiedAt,
          lastModifiedBy: modifiedFromQuote ? 'admin' : existing.lastModifiedBy,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      rebateTracking = await prisma.rebateTracking.create({
        data: {
          leadId,
          stcAmount: parseFloat(stcAmount) || 0,
          stcReferenceNumber: stcReferenceNumber || null,
          stcSubmittedAt: stcSubmittedAt ? new Date(stcSubmittedAt) : null,
          stcConfirmed: stcConfirmed || false,
          stcConfirmedAt: stcConfirmedAt ? new Date(stcConfirmedAt) : null,
          federalBatteryAmount: parseFloat(federalBatteryAmount) || 0,
          federalBatteryReferenceNumber: federalBatteryReferenceNumber || null,
          federalBatterySubmittedAt: federalBatterySubmittedAt ? new Date(federalBatterySubmittedAt) : null,
          federalBatteryConfirmed: federalBatteryConfirmed || false,
          federalBatteryConfirmedAt: federalBatteryConfirmedAt ? new Date(federalBatteryConfirmedAt) : null,
          waStateAmount: parseFloat(waStateAmount) || 0,
          waStateReferenceNumber: waStateReferenceNumber || null,
          waStateSubmittedAt: waStateSubmittedAt ? new Date(waStateSubmittedAt) : null,
          waStateConfirmed: waStateConfirmed || false,
          waStateConfirmedAt: waStateConfirmedAt ? new Date(waStateConfirmedAt) : null,
          allRebatesConfirmed,
          changeLog: changeLog ? { history: [changeLog], lastUpdate: changeLog } : null,
          modifiedFromQuote: modifiedFromQuote || false,
          lastModifiedAt: modifiedFromQuote ? new Date() : null,
          lastModifiedBy: modifiedFromQuote ? 'admin' : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Create activity log
    const confirmedRebates = [];
    if (stcConfirmed) confirmedRebates.push('STC');
    if (federalBatteryConfirmed) confirmedRebates.push('Federal Battery');
    if (waStateConfirmed) confirmedRebates.push('WA State');

    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'status_change',
        description: `Rebate tracking updated: ${confirmedRebates.length > 0 ? confirmedRebates.join(', ') + ' confirmed' : 'Pending confirmation'}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      rebateTracking
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error saving rebate tracking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save rebate tracking',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/rebate-tracking/[leadId]
 * Get rebate tracking for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.leadId;

    const rebateTracking = await prisma.rebateTracking.findUnique({
      where: { leadId }
    });

    if (!rebateTracking) {
      return NextResponse.json({
        success: true,
        rebateTracking: null
      });
    }

    return NextResponse.json({
      success: true,
      rebateTracking
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching rebate tracking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rebate tracking',
        details: error.message
      },
      { status: 500 }
    );
  }
}
