import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { deleteFile } from '@/lib/file-storage';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get photo to find file path
    const photo = await prisma.jobPhoto.findUnique({
      where: { id },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from database
    await prisma.jobPhoto.delete({
      where: { id },
    });

    // Delete file from VPS storage
    // Extract relative path from URL: /api/files/jobs/JOB-001/photos/...
    const urlPath = photo.url.replace('/api/files/', '');
    deleteFile(urlPath);

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const photo = await prisma.jobPhoto.findUnique({
      where: { id },
      include: {
        uploadedByUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        filename: photo.filename,
        category: photo.category,
        description: photo.description,
        uploadedBy: photo.uploadedByUser.name,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}
