import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all case studies (admin)
export async function GET(request: NextRequest) {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      orderBy: [
        { featured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
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

// POST - Create case study
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate slug from title
    const slug = body.slug || body.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Convert installDate string to DateTime if provided
    const data: any = {
      ...body,
      slug,
    };
    
    if (body.installDate) {
      // Convert "YYYY-MM-DD" to ISO DateTime
      data.installDate = new Date(body.installDate).toISOString();
    }

    const caseStudy = await prisma.caseStudy.create({
      data,
    });

    return NextResponse.json({ success: true, caseStudy });
  } catch (error: any) {
    console.error('Error creating case study:', error);
    return NextResponse.json(
      { error: 'Failed to create case study', details: error.message },
      { status: 500 }
    );
  }
}
