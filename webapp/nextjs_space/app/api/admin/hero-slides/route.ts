import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all hero slides
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slides = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return NextResponse.json({ error: 'Failed to fetch hero slides' }, { status: 500 });
  }
}

// POST - Create new hero slide
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const slide = await prisma.heroSlide.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        ctaText: data.ctaText,
        ctaLink: data.ctaLink,
        iconName: data.iconName || 'Zap',
        imageUrl: data.imageUrl,
        gradient: data.gradient || 'from-primary/20 to-emerald/20',
        stats: data.stats || [],
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json({ slide }, { status: 201 });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    return NextResponse.json({ error: 'Failed to create hero slide' }, { status: 500 });
  }
}
