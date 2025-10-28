import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/service-bookings - Get all service bookings
 */
export async function GET(request: NextRequest) {
  try {
    const bookings = await prisma.serviceBooking.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error('Error fetching service bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service bookings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/service-bookings - Create service booking manually
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const booking = await prisma.serviceBooking.create({
      data: {
        ...body,
        bookingNumber: `SB-${Date.now()}`,
        status: body.status || 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error('Error creating service booking:', error);
    return NextResponse.json(
      { error: 'Failed to create service booking', details: error.message },
      { status: 500 }
    );
  }
}
