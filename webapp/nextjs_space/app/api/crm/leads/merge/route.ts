import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { primaryLeadId, duplicateLeadIds } = await request.json();

    if (!primaryLeadId || !duplicateLeadIds || duplicateLeadIds.length === 0) {
      return NextResponse.json(
        { error: 'Primary lead and duplicate leads required' },
        { status: 400 }
      );
    }

    // Get primary lead
    const primaryLead = await prisma.lead.findUnique({
      where: { id: primaryLeadId },
    });

    if (!primaryLead) {
      return NextResponse.json({ error: 'Primary lead not found' }, { status: 404 });
    }

    // Merge process
    for (const duplicateId of duplicateLeadIds) {
      // Transfer activities
      await prisma.activity.updateMany({
        where: { leadId: duplicateId },
        data: { leadId: primaryLeadId },
      });

      // Transfer communications
      await prisma.communication.updateMany({
        where: { leadId: duplicateId },
        data: { leadId: primaryLeadId },
      });

      // Transfer quotes
      await prisma.customerQuote.updateMany({
        where: { leadId: duplicateId },
        data: { leadId: primaryLeadId },
      });

      // Transfer jobs
      await prisma.installationJob.updateMany({
        where: { leadId: duplicateId },
        data: { leadId: primaryLeadId },
      });

      // Mark duplicate as merged
      await prisma.lead.update({
        where: { id: duplicateId },
        data: {
          status: 'MERGED',
          mergedIntoLeadId: primaryLeadId,
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          leadId: primaryLeadId,
          type: 'NOTE_ADDED',
          description: `Merged duplicate lead (ID: ${duplicateId})`,
          performedBy: admin.email,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${duplicateLeadIds.length} duplicate(s) into primary lead`,
      primaryLeadId,
    });
  } catch (error) {
    console.error('Merge leads error:', error);
    return NextResponse.json(
      { error: 'Failed to merge leads' },
      { status: 500 }
    );
  }
}
