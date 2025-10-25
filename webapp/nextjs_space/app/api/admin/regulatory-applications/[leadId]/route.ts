import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/regulatory-applications/[leadId]
 * Create or update regulatory applications for a lead
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
      synergyReferenceNumber,
      synergyFilledAt,
      synergyApproved,
      synergyApprovedAt,
      synergyNotes,
      synergyReceiptUrl,
      wpReferenceNumber,
      wpSubmittedAt,
      wpApproved,
      wpApprovedAt,
      wpNotes,
      wpReceiptUrl
    } = body;

    // Check if regulatory application exists
    const existing = await prisma.regulatoryApplication.findUnique({
      where: { leadId }
    });

    let regulatoryApplication;

    if (existing) {
      // Update existing
      regulatoryApplication = await prisma.regulatoryApplication.update({
        where: { leadId },
        data: {
          synergyReferenceNumber: synergyReferenceNumber || existing.synergyReferenceNumber,
          synergyFilledAt: synergyFilledAt ? new Date(synergyFilledAt) : existing.synergyFilledAt,
          synergyApproved: synergyApproved !== undefined ? synergyApproved : existing.synergyApproved,
          synergyApprovedAt: synergyApprovedAt ? new Date(synergyApprovedAt) : existing.synergyApprovedAt,
          synergyNotes: synergyNotes || existing.synergyNotes,
          synergyReceiptUrl: synergyReceiptUrl || existing.synergyReceiptUrl,
          wpReferenceNumber: wpReferenceNumber || existing.wpReferenceNumber,
          wpSubmittedAt: wpSubmittedAt ? new Date(wpSubmittedAt) : existing.wpSubmittedAt,
          wpApproved: wpApproved !== undefined ? wpApproved : existing.wpApproved,
          wpApprovedAt: wpApprovedAt ? new Date(wpApprovedAt) : existing.wpApprovedAt,
          wpNotes: wpNotes || existing.wpNotes,
          wpReceiptUrl: wpReceiptUrl || existing.wpReceiptUrl,
          allApprovalsReceived: (synergyApproved !== undefined ? synergyApproved : existing.synergyApproved) && 
                                 (wpApproved !== undefined ? wpApproved : existing.wpApproved),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new
      regulatoryApplication = await prisma.regulatoryApplication.create({
        data: {
          leadId,
          synergyReferenceNumber: synergyReferenceNumber || null,
          synergyFilledAt: synergyFilledAt ? new Date(synergyFilledAt) : null,
          synergyApproved: synergyApproved || false,
          synergyApprovedAt: synergyApprovedAt ? new Date(synergyApprovedAt) : null,
          synergyNotes: synergyNotes || null,
          synergyReceiptUrl: synergyReceiptUrl || null,
          wpReferenceNumber: wpReferenceNumber || null,
          wpSubmittedAt: wpSubmittedAt ? new Date(wpSubmittedAt) : null,
          wpApproved: wpApproved || false,
          wpApprovedAt: wpApprovedAt ? new Date(wpApprovedAt) : null,
          wpNotes: wpNotes || null,
          wpReceiptUrl: wpReceiptUrl || null,
          allApprovalsReceived: (synergyApproved || false) && (wpApproved || false),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'status_change',
        description: `Regulatory applications updated: Synergy ${synergyApproved ? 'Approved' : 'Pending'}, WP ${wpApproved ? 'Approved' : 'Pending'}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      regulatoryApplication
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error saving regulatory applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save regulatory applications',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/regulatory-applications/[leadId]
 * Get regulatory applications for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.leadId;

    const regulatoryApplication = await prisma.regulatoryApplication.findUnique({
      where: { leadId }
    });

    if (!regulatoryApplication) {
      return NextResponse.json({
        success: true,
        regulatoryApplication: null
      });
    }

    return NextResponse.json({
      success: true,
      regulatoryApplication
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching regulatory applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch regulatory applications',
        details: error.message
      },
      { status: 500 }
    );
  }
}
