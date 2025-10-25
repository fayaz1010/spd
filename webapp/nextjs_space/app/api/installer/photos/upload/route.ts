import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/db';

/**
 * POST /api/installer/photos/upload
 * Upload installation photo with GPS metadata
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add installer authentication
    // const installer = requireInstaller(request);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jobId = formData.get('jobId') as string;
    const category = formData.get('category') as string;
    const gpsData = formData.get('gps') as string;

    if (!file || !jobId || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'installation-photos', jobId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${category}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Parse GPS data
    let gpsMetadata = null;
    if (gpsData) {
      try {
        gpsMetadata = JSON.parse(gpsData);
      } catch (e) {
        console.error('Failed to parse GPS data');
      }
    }

    // Map category string to PhotoCategory enum
    const categoryMap: Record<string, string> = {
      'equipment_serials': 'EQUIPMENT_SERIALS',
      'installation_progress': 'INSTALLATION_PROGRESS',
      'safety_compliance': 'SAFETY_COMPLIANCE',
      'final_documentation': 'FINAL_DOCUMENTATION'
    };

    // Save to database
    const photo = await prisma.jobPhoto.create({
      data: {
        jobId,
        category: (categoryMap[category] || 'GENERAL') as any,
        filename,
        url: `/uploads/installation-photos/${jobId}/${filename}`,
        gpsLatitude: gpsMetadata?.lat || null,
        gpsLongitude: gpsMetadata?.lng || null,
        createdAt: new Date()
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'other' as any,
        description: `Photo uploaded: ${category}`,
        metadata: JSON.stringify({ jobId, category }),
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        category,
        filename: photo.filename,
        url: photo.url,
        uploadedAt: photo.createdAt,
        metadata: {
          gps: gpsMetadata
        }
      }
    });
  } catch (error: any) {
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
