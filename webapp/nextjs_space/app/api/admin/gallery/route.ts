import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET - List all gallery images
export async function GET(request: NextRequest) {
  try {
    // TODO: Add auth check when auth system is ready

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    const where: any = {};
    if (category) where.category = category;
    if (featured) where.featured = featured === 'true';

    const images = await prisma.galleryImage.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

// POST - Create new gallery image
export async function POST(request: NextRequest) {
  try {
    // TODO: Add auth check when auth system is ready

    const data = await request.json();

    const image = await prisma.galleryImage.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category || 'installation',
        tags: data.tags || [],
        location: data.location,
        systemSize: data.systemSize,
        featured: data.featured || false,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery image:', error);
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}
