import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - List all FAQs (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) where.category = category;

    const faqs = await prisma.fAQ.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, faqs });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create FAQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const faq = await prisma.fAQ.create({
      data: body,
    });

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to create FAQ', details: error.message },
      { status: 500 }
    );
  }
}
