import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// POST /api/staff/attendance/clock-in
export async function POST(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { staffId, latitude, longitude, jobId, address } = await req.json();

    // Verify user can clock in for this staff member
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      }
    });

    if (existing && existing.clockIn) {
      return NextResponse.json(
        { 
          error: 'Already clocked in today',
          attendance: existing
        },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendanceRecord.upsert({
      where: {
        staffId_date: { staffId, date: today }
      },
      create: {
        staffId,
        date: today,
        clockIn: new Date(),
        clockInLatitude: latitude,
        clockInLongitude: longitude,
        clockInAddress: address,
        clockInDevice: 'mobile',
        jobId,
        status: 'PRESENT'
      },
      update: {
        clockIn: new Date(),
        clockInLatitude: latitude,
        clockInLongitude: longitude,
        clockInAddress: address,
        jobId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Clocked in successfully',
      attendance
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json(
      { error: 'Failed to clock in' },
      { status: 500 }
    );
  }
}
