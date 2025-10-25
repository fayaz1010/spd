import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * DELETE /api/admin/jobs/[id]/documents/[docId]
 * Delete compliance document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    requireAdmin(request);

    const { id: jobId, docId } = params;

    // Get document details
    const document = await prisma.complianceDocument.findUnique({
      where: { id: docId }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filepath = join(process.cwd(), 'public', document.documentUrl);
      await unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continue even if file deletion fails
    }

    // Delete from database
    await prisma.complianceDocument.delete({
      where: { id: docId }
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error deleting document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete document',
        details: error.message
      },
      { status: 500 }
    );
  }
}
