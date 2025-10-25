import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Public case studies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const where: any = { isPublished: true };
    if (category) where.category = category;
    if (featured) where.featured = featured === 'true';

    const caseStudies = await prisma.caseStudy.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        customerName: true,
        location: true,
        systemSize: true,
        panelCount: true,
        batterySize: true,
        description: true,
        featuredImage: true,
        installDate: true,
        category: true,
        tags: true,
        featured: true,
      },
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { installDate: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, caseStudies });
  } catch (error: any) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case studies', details: error.message },
      { status: 500 }
    );
  }
}
