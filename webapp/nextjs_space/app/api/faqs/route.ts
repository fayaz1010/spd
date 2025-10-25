import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Public FAQs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = { isPublished: true };
    if (category) where.category = category;

    const faqs = await prisma.fAQ.findMany({
      where,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        tags: true,
        sortOrder: true,
        helpful: true,
        notHelpful: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { helpful: 'desc' },
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
