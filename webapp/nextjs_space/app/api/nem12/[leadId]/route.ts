import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    // Get all NEM12 uploads for this lead
    const uploads = await prisma.nEM12Upload.findMany({
      where: { leadId },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        uploadedAt: true,
        status: true,
        nmi: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        averageDaily: true,
        peakDemand: true,
        qualityScore: true,
      },
    });

    return NextResponse.json({
      success: true,
      uploads,
    });
  } catch (error) {
    console.error('NEM12 fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NEM12 data' },
      { status: 500 }
    );
  }
}
