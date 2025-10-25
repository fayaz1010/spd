import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Public - Get approved testimonials
 * GET /api/testimonials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');
    const rating = searchParams.get('rating');

    const where: any = {
      status: 'APPROVED',
      showOnWebsite: true,
    };

    if (featured) where.featured = featured === 'true';
    if (rating) where.rating = { gte: parseInt(rating) };

    const testimonials = await prisma.testimonial.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        rating: true,
        title: true,
        review: true,
        location: true,
        systemSize: true,
        installDate: true,
        images: true,
        featured: true,
        createdAt: true,
      },
      orderBy: [
        { featured: 'desc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit ? parseInt(limit) : undefined,
    });

    // Calculate average rating
    const avgRating = await prisma.testimonial.aggregate({
      where: {
        status: 'APPROVED',
        showOnWebsite: true,
      },
      _avg: {
        rating: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      testimonials,
      stats: {
        averageRating: avgRating._avg.rating || 0,
        totalCount: avgRating._count,
      },
    });
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials', details: error.message },
      { status: 500 }
    );
  }
}
