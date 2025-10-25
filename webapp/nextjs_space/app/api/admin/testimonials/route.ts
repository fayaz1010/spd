import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Admin - Get all testimonials with filters
 * GET /api/admin/testimonials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const rating = searchParams.get('rating');

    const where: any = {};
    if (status) where.status = status;
    if (featured) where.featured = featured === 'true';
    if (rating) where.rating = parseInt(rating);

    const testimonials = await prisma.testimonial.findMany({
      where,
      include: {
        job: {
          select: {
            jobNumber: true,
            systemSize: true,
            lead: {
              select: {
                customerName: true,
                suburb: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    // Count by status
    const statusCounts = await prisma.testimonial.groupBy({
      by: ['status'],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      testimonials,
      statusCounts,
    });
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Admin - Create testimonial manually
 * POST /api/admin/testimonials
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const testimonial = await prisma.testimonial.create({
      data: {
        ...body,
        source: body.source || 'manual',
        status: body.status || 'APPROVED',
      },
    });

    return NextResponse.json({
      success: true,
      testimonial,
    });
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial', details: error.message },
      { status: 500 }
    );
  }
}
