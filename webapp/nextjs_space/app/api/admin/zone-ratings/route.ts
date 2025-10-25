import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use singleton pattern for Prisma client
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/admin/zone-ratings
 * Get all postcode zone ratings
 */
export async function GET() {
  try {
    console.log('Fetching zone ratings...');
    const zoneRatings = await prisma.postcodeZoneRating.findMany({
      orderBy: [
        { state: 'asc' },
        { postcodeStart: 'asc' },
      ],
    });

    console.log(`Found ${zoneRatings.length} zone ratings`);
    return NextResponse.json({
      success: true,
      zoneRatings,
    });
  } catch (error) {
    console.error('Error fetching zone ratings:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch zone ratings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/zone-ratings
 * Create a new zone rating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postcodeStart, postcodeEnd, zone, zoneRating, state, description } = body;

    // Validation
    if (!postcodeStart || !postcodeEnd || !zone || !zoneRating) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (postcodeStart > postcodeEnd) {
      return NextResponse.json(
        { success: false, error: 'Postcode start must be less than or equal to postcode end' },
        { status: 400 }
      );
    }

    // Check for overlapping ranges
    const overlapping = await prisma.postcodeZoneRating.findFirst({
      where: {
        OR: [
          {
            AND: [
              { postcodeStart: { lte: postcodeStart } },
              { postcodeEnd: { gte: postcodeStart } },
            ],
          },
          {
            AND: [
              { postcodeStart: { lte: postcodeEnd } },
              { postcodeEnd: { gte: postcodeEnd } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: `Postcode range overlaps with existing range: ${overlapping.postcodeStart}-${overlapping.postcodeEnd}`,
        },
        { status: 400 }
      );
    }

    const zoneRatingRecord = await prisma.postcodeZoneRating.create({
      data: {
        postcodeStart,
        postcodeEnd,
        zone,
        zoneRating,
        state,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      zoneRating: zoneRatingRecord,
    });
  } catch (error) {
    console.error('Error creating zone rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create zone rating' },
      { status: 500 }
    );
  }
}
