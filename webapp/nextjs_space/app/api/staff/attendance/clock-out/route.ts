import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// POST /api/staff/attendance/clock-out
export async function POST(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { staffId, latitude, longitude, address } = await req.json();

    // Verify user can clock out for this staff member
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendanceRecord.findUnique({
      where: {
        staffId_date: { staffId, date: today }
      }
    });

    if (!attendance || !attendance.clockIn) {
      return NextResponse.json(
        { error: 'Not clocked in' },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { 
          error: 'Already clocked out',
          attendance
        },
        { status: 400 }
      );
    }

    const clockOut = new Date();
    
    // Calculate hours
    const totalMinutes = Math.floor(
      (clockOut.getTime() - attendance.clockIn.getTime()) / (1000 * 60)
    ) - attendance.totalBreakTime;
    
    const totalHours = totalMinutes / 60;
    
    // Simple calculation - regular hours up to 8, then overtime
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(totalHours - 8, 0);

    const updated = await prisma.attendanceRecord.update({
      where: { id: attendance.id },
      data: {
        clockOut,
        clockOutLatitude: latitude,
        clockOutLongitude: longitude,
        clockOutAddress: address,
        clockOutDevice: 'mobile',
        regularHours,
        overtimeHours,
        totalHours
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Clocked out successfully',
      attendance: updated,
      summary: {
        totalHours: totalHours.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  }
}
