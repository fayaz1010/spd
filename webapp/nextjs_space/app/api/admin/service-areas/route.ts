import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/service-areas - Get all service areas
 */
export async function GET(request: NextRequest) {
  try {
    const areas = await prisma.serviceArea.findMany({
      orderBy: [
        { region: 'asc' },
        { suburb: 'asc' },
      ],
    });

    return NextResponse.json(areas);
  } catch (error: any) {
    console.error('Error fetching service areas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service areas', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-areas - Create service area
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const area = await prisma.serviceArea.create({
      data: body,
    });

    return NextResponse.json({
      success: true,
      area,
    });
  } catch (error: any) {
    console.error('Error creating service area:', error);
    return NextResponse.json(
      { error: 'Failed to create service area', details: error.message },
      { status: 500 }
    );
  }
}
