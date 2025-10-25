import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Get Content Strategy by ID
 * GET /api/ai/strategy/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;

    const strategy = await prisma.contentStrategy.findUnique({
      where: { id: strategyId },
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      strategy,
    });
  } catch (error: any) {
    console.error('Strategy fetch error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch strategy',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
