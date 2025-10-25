import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * List All Content Strategies
 * GET /api/ai/strategy/list
 */
export async function GET(request: NextRequest) {
  try {
    const strategies = await prisma.contentStrategy.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      strategies,
    });
  } catch (error: any) {
    console.error('Strategy list error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch strategies',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
