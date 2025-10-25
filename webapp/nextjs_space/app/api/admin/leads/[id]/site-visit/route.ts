import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updateDealStage } from '@/lib/crm-auto-deal';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const siteVisit = await prisma.siteVisitChecklist.findUnique({
      where: { leadId: id },
    });

    return NextResponse.json({ siteVisit });
  } catch (error) {
    console.error('Error fetching site visit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site visit' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    // Upsert site visit checklist
    const siteVisit = await prisma.siteVisitChecklist.upsert({
      where: { leadId: id },
      create: {
        leadId: id,
        ...data,
      },
      update: data,
    });

    // Update lead with meter number and site visit timestamp
    const leadUpdateData: any = {};
    if (data.meterNumber) {
      leadUpdateData.meterNumber = data.meterNumber;
    }
    
    // Update site visit scheduled/completed timestamps
    if (data.visitDate && !data.completedAt) {
      leadUpdateData.siteVisitScheduledDate = new Date(data.visitDate);
    }
    if (data.completedAt) {
      leadUpdateData.siteVisitCompletedAt = new Date(data.completedAt);
    }
    
    if (Object.keys(leadUpdateData).length > 0) {
      await prisma.lead.update({
        where: { id },
        data: leadUpdateData,
      });
    }

    // Auto-update CRM deal stage
    try {
      if (data.visitDate && !data.completedAt) {
        // Site visit scheduled
        await updateDealStage(id, 'SITE_VISIT_SCHEDULED', 'system');
        console.log(`✅ Deal stage updated to SITE_VISIT_SCHEDULED for lead ${id}`);
      } else if (data.completedAt) {
        // Site visit completed
        await updateDealStage(id, 'SITE_VISIT_COMPLETE', 'system');
        console.log(`✅ Deal stage updated to SITE_VISIT_COMPLETE for lead ${id}`);
      }
    } catch (dealError) {
      console.error('Failed to update deal stage:', dealError);
      // Don't fail the request if deal update fails
    }

    return NextResponse.json({ siteVisit });
  } catch (error) {
    console.error('Error saving site visit:', error);
    return NextResponse.json(
      { error: 'Failed to save site visit' },
      { status: 500 }
    );
  }
}
