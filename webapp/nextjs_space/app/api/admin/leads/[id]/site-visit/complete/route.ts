import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Mark site visit as complete (create if doesn't exist)
    const siteVisit = await prisma.siteVisitChecklist.upsert({
      where: { leadId: id },
      update: {
        completedAt: new Date(),
        completedBy: 'admin', // TODO: Get from auth token
      },
      create: {
        leadId: id,
        completedAt: new Date(),
        completedBy: 'admin', // TODO: Get from auth token
      },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id },
      data: {
        siteVisitCompletedAt: new Date(),
      },
    });

    return NextResponse.json({ siteVisit });
  } catch (error) {
    console.error('Error completing site visit:', error);
    return NextResponse.json(
      { error: 'Failed to complete site visit' },
      { status: 500 }
    );
  }
}
