import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * POST /api/upload
 * General-purpose file upload API
 * Supports multiple folders: packages, gallery, blog, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads'; // Default folder

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate folder (security: prevent directory traversal)
    const allowedFolders = ['packages', 'gallery', 'blog', 'uploads', 'products', 'team', 'services'];
    if (!allowedFolders.includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder' },
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
    const uniqueFileName = `${sanitizedName}_${timestamp}_${randomString}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', folder);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, uniqueFileName);
    
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/${folder}/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueFileName,
      folder: folder
    });
  } catch (error: any) {
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
