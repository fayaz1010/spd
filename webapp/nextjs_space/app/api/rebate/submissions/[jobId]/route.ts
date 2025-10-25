import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const rebates = await prisma.rebateSubmission.findMany({
      where: { jobId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      rebates,
    });
  } catch (error) {
    console.error('Error fetching rebates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rebates' },
      { status: 500 }
    );
  }
}
