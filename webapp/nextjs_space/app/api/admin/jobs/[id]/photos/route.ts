import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/admin/jobs/[id]/photos
 * Get all compliance photos for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;

    const photos = await prisma.compliancePhoto.findMany({
      where: { jobId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      photos
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
 * POST /api/admin/jobs/[id]/photos
 * Upload compliance photo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const jobId = params.id;
    const formData = await request.formData();
    
    const photo = formData.get('photo') as File;
    const category = formData.get('category') as string;
    const subcategory = formData.get('subcategory') as string | null;
    const description = formData.get('description') as string | null;
    const metadataStr = formData.get('metadata') as string | null;
    
    // Parse metadata JSON if provided
    let metadata = null;
    let gpsLatitude = null;
    let gpsLongitude = null;
    
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
        gpsLatitude = metadata.latitude;
        gpsLongitude = metadata.longitude;
      } catch (error) {
        console.error('Failed to parse metadata:', error);
      }
    } else {
      // Fallback to individual fields
      const gpsLat = formData.get('gpsLatitude') as string | null;
      const gpsLon = formData.get('gpsLongitude') as string | null;
      gpsLatitude = gpsLat ? parseFloat(gpsLat) : null;
      gpsLongitude = gpsLon ? parseFloat(gpsLon) : null;
    }

    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'compliance', jobId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${category}_${timestamp}_${photo.name}`;
    const filepath = join(uploadDir, filename);

    // Save file
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create database record
    const photoUrl = `/uploads/compliance/${jobId}/${filename}`;
    
    const compliancePhoto = await prisma.compliancePhoto.create({
      data: {
        jobId,
        category,
        subcategory,
        photoUrl,
        description,
        gpsLatitude,
        gpsLongitude,
        metadata: metadata ? JSON.stringify(metadata) : null,
        uploadedBy: 'admin',
        timestamp: new Date()
      }
    });

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId: (await prisma.installationJob.findUnique({ 
          where: { id: jobId },
          select: { leadId: true }
        }))!.leadId,
        type: 'compliance',
        description: `Compliance photo uploaded: ${category}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      photo: compliancePhoto
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error uploading photo:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload photo',
        details: error.message
      },
      { status: 500 }
    );
  }
}
