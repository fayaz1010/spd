import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Admin - Update/Moderate testimonial
 * PUT /api/admin/testimonials/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...updateData } = body;

    // Handle moderation actions
    if (action === 'approve') {
      const testimonial = await prisma.testimonial.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          showOnWebsite: true,
          moderatedAt: new Date(),
          moderatedBy: body.moderatedBy || 'admin',
        },
      });

      // TODO: Send email to customer

      return NextResponse.json({
        success: true,
        message: 'Testimonial approved',
        testimonial,
      });
    }

    if (action === 'reject') {
      const testimonial = await prisma.testimonial.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          showOnWebsite: false,
          moderatedAt: new Date(),
          moderatedBy: body.moderatedBy || 'admin',
          moderatorNotes: body.moderatorNotes,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Testimonial rejected',
        testimonial,
      });
    }

    // Regular update
    const testimonial = await prisma.testimonial.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      testimonial,
    });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Admin - Delete testimonial
 * DELETE /api/admin/testimonials/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.testimonial.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted',
    });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial', details: error.message },
      { status: 500 }
    );
  }
}
