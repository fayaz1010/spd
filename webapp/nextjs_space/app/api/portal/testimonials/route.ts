import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Customer Portal - Submit Testimonial/Review
 * POST /api/portal/testimonials
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get customer from auth token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      jobId,
      rating,
      title,
      review,
      location,
      systemSize,
      images = [],
    } = body;

    // Validation
    if (!customerName || !rating || !review) {
      return NextResponse.json(
        { error: 'Customer name, rating, and review are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Create testimonial with PENDING status
    const testimonial = await prisma.testimonial.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        jobId,
        rating,
        title,
        review,
        location,
        systemSize,
        images,
        status: 'PENDING',
        source: 'portal',
      },
    });

    // TODO: Send notification to admin for moderation

    return NextResponse.json({
      success: true,
      message: 'Thank you for your review! It will be published after moderation.',
      testimonial: {
        id: testimonial.id,
        status: testimonial.status,
        createdAt: testimonial.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error submitting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to submit testimonial', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Customer Portal - Get customer's testimonials
 * GET /api/portal/testimonials
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get customer email from auth token
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('email');

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const testimonials = await prisma.testimonial.findMany({
      where: {
        customerEmail,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        rating: true,
        title: true,
        review: true,
        status: true,
        createdAt: true,
        moderatedAt: true,
        showOnWebsite: true,
      },
    });

    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (error: any) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials', details: error.message },
      { status: 500 }
    );
  }
}
