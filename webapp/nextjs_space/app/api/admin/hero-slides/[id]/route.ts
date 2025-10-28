import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAdminFromRequest } from '@/lib/auth-admin';

const prisma = new PrismaClient();

// GET - Get single hero slide
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id: params.id }
    });

    if (!slide) {
      return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({ slide });
  } catch (error) {
    console.error('Error fetching hero slide:', error);
    return NextResponse.json({ error: 'Failed to fetch hero slide' }, { status: 500 });
  }
}

// PUT - Update hero slide
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const slide = await prisma.heroSlide.update({
      where: { id: params.id },
      data: {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        ctaText: data.ctaText,
        ctaLink: data.ctaLink,
        iconName: data.iconName,
        imageUrl: data.imageUrl,
        gradient: data.gradient,
        stats: data.stats,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }
    });

    return NextResponse.json({ slide });
  } catch (error) {
    console.error('Error updating hero slide:', error);
    return NextResponse.json({ error: 'Failed to update hero slide' }, { status: 500 });
  }
}

// DELETE - Delete hero slide
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.heroSlide.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    return NextResponse.json({ error: 'Failed to delete hero slide' }, { status: 500 });
  }
}
