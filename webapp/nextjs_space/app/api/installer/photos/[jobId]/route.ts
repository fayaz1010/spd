import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/installer/photos/[jobId]
 * Get all photos for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // TODO: Add installer authentication
    // const installer = requireInstaller(request);

    const jobId = params.jobId;

    const photos = await prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPhotos = photos.map((photo: any) => ({
      id: photo.id,
      category: photo.category,
      filename: photo.filename,
      url: photo.url,
      uploadedAt: photo.createdAt,
      metadata: {
        gps: photo.gpsLatitude && photo.gpsLongitude
          ? { lat: photo.gpsLatitude, lng: photo.gpsLongitude }
          : null,
        timestamp: photo.createdAt
      }
    }));

    return NextResponse.json({
      success: true,
      photos: formattedPhotos
    });
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch photos',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/installer/photos/[jobId]
 * Delete a photo (actually uses photoId in this route)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // TODO: Add installer authentication
    // const installer = requireInstaller(request);

    // Note: In URL structure, this is actually photoId
    const photoId = params.jobId;

    await prisma.jobPhoto.delete({
      where: { id: photoId }
    });

    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete photo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
