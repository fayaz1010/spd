import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { saveFile } from '@/lib/file-storage';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const jobId = formData.get('jobId') as string;
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';
    
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get all uploaded files
    const files = formData.getAll('photos') as File[];
    
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No photos provided' },
        { status: 400 }
      );
    }

    // Get current user (in production, get from session/auth)
    const uploadedBy = 'admin-user-id'; // TODO: Get from session

    const uploadedPhotos = await Promise.all(
      files.map(async (file: File) => {
        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to VPS storage
        const fileMetadata = await saveFile({
          jobId,
          fileName: file.name,
          buffer,
          category: 'photos',
          subcategory: category, // before, during, after
        });

        // Save metadata to database
        return prisma.jobPhoto.create({
          data: {
            jobId,
            url: fileMetadata.fileUrl,
            filename: file.name,
            filesize: file.size,
            mimeType: file.type,
            category: category.toUpperCase() as any,
            description: description || null,
            uploadedBy,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) uploaded successfully`,
      photos: uploadedPhotos.map(p => ({
        id: p.id,
        filename: p.filename,
        url: p.url,
        category: p.category,
        uploadedAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve photos for a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const category = searchParams.get('category');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const where: any = { jobId };
    if (category) {
      where.category = category.toUpperCase();
    }

    const photos = await prisma.jobPhoto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      photos,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}
