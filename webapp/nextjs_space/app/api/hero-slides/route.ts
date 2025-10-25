import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Public hero slides
export async function GET(request: NextRequest) {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch hero slides' }, { status: 500 });
  }
}
