import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/service-bookings/[id] - Get single booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/service-bookings/[id] - Update booking status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const booking = await prisma.serviceBooking.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/service-bookings/[id] - Delete booking
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.serviceBooking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking deleted',
    });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking', details: error.message },
      { status: 500 }
    );
  }
}
