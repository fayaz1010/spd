/**
 * File serving API
 * Serves files from VPS storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '@/lib/file-storage';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get file path from URL
    const filePath = params.path.join('/');
    
    // Security: Prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Get file from storage
    const fileBuffer = getFile(filePath);
    
    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Determine content type from extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = getContentType(ext);

    // Check if download is requested
    const download = request.nextUrl.searchParams.get('download');
    const fileName = path.basename(filePath);

    // Return file
    return new NextResponse(Buffer.from(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': download 
          ? `attachment; filename="${fileName}"`
          : `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
  };

  return contentTypes[ext] || 'application/octet-stream';
}
