import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();

    const checklist = await prisma.siteVisitChecklist.create({
      data: {
        leadId: body.leadId,
        roofCondition: body.roofCondition,
        roofType: body.roofType,
        roofAccess: body.roofAccess,
        roofPitch: body.roofPitch,
        switchboardLocation: body.switchboardLocation,
        switchboardCondition: body.switchboardCondition,
        meterBoxLocation: body.meterBoxLocation,
        threePhasePower: body.threePhasePower || false,
        shadingIssues: body.shadingIssues || false,
        shadingDescription: body.shadingDescription,
        asbestosPresent: body.asbestosPresent || false,
        scaffoldingRequired: body.scaffoldingRequired || false,
        strataProperty: body.strataProperty || false,
        heritageProperty: body.heritageProperty || false,
        specialRequirements: body.specialRequirements,
        accessNotes: body.accessNotes,
        photos: body.photos || [],
        completedBy: body.completedBy,
        completedAt: body.completedAt,
      },
    });

    // Update lead
    if (body.completedAt) {
      await prisma.lead.update({
        where: { id: body.leadId },
        data: {
          siteVisitCompletedAt: body.completedAt,
        },
      });
    }

    return NextResponse.json({ success: true, checklist }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating site visit checklist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
