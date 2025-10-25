import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/db';

/**
 * POST /api/installer/attendance/record
 * Record time entry with optional selfie
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let jobId, type, latitude, longitude, selfieUrl = null;

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (with selfie)
      const formData = await request.formData();
      jobId = formData.get('jobId') as string;
      type = formData.get('type') as string;
      latitude = parseFloat(formData.get('latitude') as string);
      longitude = parseFloat(formData.get('longitude') as string);
      const selfie = formData.get('selfie') as File;

      if (selfie) {
        // Save selfie
        const uploadsDir = join(process.cwd(), 'public', 'uploads', 'attendance', jobId);
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }

        const timestamp = Date.now();
        const filename = `${type}-${timestamp}.jpg`;
        const filepath = join(uploadsDir, filename);

        const bytes = await selfie.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        selfieUrl = `/uploads/attendance/${jobId}/${filename}`;
      }
    } else {
      // Handle JSON (without selfie)
      const body = await request.json();
      jobId = body.jobId;
      type = body.type;
      latitude = body.latitude;
      longitude = body.longitude;
    }

    if (!jobId || !type || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create time entry
    const entry = await prisma.timeEntry.create({
      data: {
        jobId,
        type,
        timestamp: new Date(),
        gpsLatitude: latitude,
        gpsLongitude: longitude,
        selfieUrl,
        createdAt: new Date()
      }
    });

    // Determine new status
    let currentStatus = 'clocked_out';
    if (type === 'clock_in') {
      currentStatus = 'clocked_in';
    } else if (type === 'break_start') {
      currentStatus = 'on_break';
    } else if (type === 'break_end') {
      currentStatus = 'clocked_in';
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'other' as any,
        description: `Time entry: ${type}`,
        metadata: JSON.stringify({ jobId, type }),
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        type: entry.type,
        timestamp: entry.timestamp,
        gpsLatitude: entry.gpsLatitude,
        gpsLongitude: entry.gpsLongitude,
        selfieUrl: entry.selfieUrl
      },
      currentStatus
    });
  } catch (error: any) {
    console.error('Error recording time:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record time',
        details: error.message
      },
      { status: 500 }
    );
  }
}
