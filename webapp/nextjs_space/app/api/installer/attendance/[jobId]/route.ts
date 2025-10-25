import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/installer/attendance/[jobId]
 * Get time entries for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;

    const entries = await prisma.timeEntry.findMany({
      where: { jobId },
      orderBy: { timestamp: 'asc' }
    });

    // Determine current status
    let currentStatus = 'clocked_out';
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry.type === 'clock_in') {
        currentStatus = 'clocked_in';
      } else if (lastEntry.type === 'break_start') {
        currentStatus = 'on_break';
      } else if (lastEntry.type === 'break_end') {
        currentStatus = 'clocked_in';
      }
    }

    return NextResponse.json({
      success: true,
      entries: entries.map(entry => ({
        id: entry.id,
        type: entry.type,
        timestamp: entry.timestamp,
        gpsLatitude: entry.gpsLatitude,
        gpsLongitude: entry.gpsLongitude,
        selfieUrl: entry.selfieUrl
      })),
      currentStatus
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch attendance',
        details: error.message
      },
      { status: 500 }
    );
  }
}
