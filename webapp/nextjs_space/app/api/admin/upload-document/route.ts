import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/admin/upload-document
 * Upload document (submission receipts, approvals, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const type = formData.get('type') as string; // synergy, wp, stc, etc.

    if (!file || !leadId || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'documents', leadId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${type}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    const url = `/uploads/documents/${leadId}/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error uploading document:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload document',
        details: error.message
      },
      { status: 500 }
    );
  }
}
