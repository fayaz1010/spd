import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get single gallery image
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const image = await prisma.galleryImage.findUnique({
      where: { id: params.id }
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching gallery image:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery image' }, { status: 500 });
  }
}

// PUT - Update gallery image
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const image = await prisma.galleryImage.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        tags: data.tags,
        location: data.location,
        systemSize: data.systemSize,
        featured: data.featured,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      }
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error updating gallery image:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

// DELETE - Delete gallery image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.galleryImage.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}
