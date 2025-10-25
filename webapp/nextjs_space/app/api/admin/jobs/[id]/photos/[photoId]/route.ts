import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * DELETE /api/admin/jobs/[id]/photos/[photoId]
 * Delete compliance photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  try {
    requireAdmin(request);

    const { id: jobId, photoId } = params;

    // Get photo details
    const photo = await prisma.compliancePhoto.findUnique({
      where: { id: photoId }
    });

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', photo.photoUrl);
      await unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.compliancePhoto.delete({
      where: { id: photoId }
    });

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
