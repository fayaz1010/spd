import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';

// GET /api/staff/timesheets - List timesheets for staff
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId') || user.teamMemberId;
    const status = searchParams.get('status');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 });
    }

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const where: any = { staffId };
    if (status) {
      where.status = status;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      orderBy: { weekStartDate: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      timesheets
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timesheets' },
      { status: 500 }
    );
  }
}

// POST /api/staff/timesheets - Create or update timesheet
export async function POST(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { staffId, weekStartDate, ...timesheetData } = body;

    // Verify access
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.teamMemberId !== staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const weekStart = new Date(weekStartDate);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Monday start
    const weekNumber = getWeek(weekStart, { weekStartsOn: 1 });
    const year = getYear(weekStart);

    // Calculate total hours
    const totalHours = 
      (timesheetData.regularHours || 0) +
      (timesheetData.overtimeHours || 0) +
      (timesheetData.doubleTimeHours || 0) +
      (timesheetData.publicHolidayHours || 0);

    const timesheet = await prisma.timesheet.upsert({
      where: {
        staffId_weekStartDate: {
          staffId,
          weekStartDate: weekStart
        }
      },
      create: {
        staffId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        weekNumber,
        year,
        totalHours,
        ...timesheetData
      },
      update: {
        totalHours,
        ...timesheetData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      timesheet
    });
  } catch (error) {
    console.error('Error saving timesheet:', error);
    return NextResponse.json(
      { error: 'Failed to save timesheet' },
      { status: 500 }
    );
  }
}
