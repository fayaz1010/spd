import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/admin/upload
 * Upload files (receipts, documents, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const type = formData.get('type') as string; // payment-deposit, payment-final, etc.
    const folder = formData.get('folder') as string; // For general uploads (services, packages, etc.)

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').split('.')[0];
    
    let uniqueFileName: string;
    let uploadsDir: string;
    let publicUrl: string;
    
    // Handle different upload types
    if (folder) {
      // General upload (services, packages, etc.)
      const allowedFolders = ['services', 'packages', 'gallery', 'blog', 'uploads', 'products', 'team'];
      if (!allowedFolders.includes(folder)) {
        return NextResponse.json(
          { success: false, error: 'Invalid folder' },
          { status: 400 }
        );
      }
      
      uniqueFileName = `${sanitizedName}_${timestamp}_${randomString}.${fileExtension}`;
      uploadsDir = join(process.cwd(), 'public', folder);
      publicUrl = `/${folder}/${uniqueFileName}`;
    } else {
      // Receipt upload (legacy)
      uniqueFileName = `${leadId}_${type}_${timestamp}.${fileExtension}`;
      uploadsDir = join(process.cwd(), 'public', 'uploads', 'receipts');
      publicUrl = `/uploads/receipts/${uniqueFileName}`;
    }

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, uniqueFileName);
    
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      folder: folder || 'receipts'
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
        details: error.message
      },
      { status: 500 }
    );
  }
}
