import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// GET /api/admin/labor-costs
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();

    // Determine date range
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'week':
        startDate = startOfWeek(date, { weekStartsOn: 1 });
        endDate = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
        break;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3);
        startDate = new Date(date.getFullYear(), quarter * 3, 1);
        endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31);
        break;
      default:
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
    }

    // Fetch timesheets for the period
    const timesheets = await prisma.timesheet.findMany({
      where: {
        weekStartDate: { gte: startDate, lte: endDate },
        status: { in: ['APPROVED', 'PROCESSED', 'PAID'] }
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            hourlyRate: true
          }
        }
      }
    });

    // Calculate labor costs per job (if job assignments exist)
    const jobCosts = new Map<string, {
      jobId: string;
      jobNumber: string;
      staff: Array<{
        id: string;
        name: string;
        hourlyRate: number;
        hoursWorked: number;
        cost: number;
      }>;
      totalHours: number;
      totalCost: number;
    }>();

    // Aggregate timesheet data
    timesheets.forEach(timesheet => {
      const hourlyRate = timesheet.staff.hourlyRate || 0;
      const cost = timesheet.totalHours * hourlyRate;

      // If timesheet has job allocation, group by job
      const jobAllocations = timesheet.jobAllocations as any[];
      if (jobAllocations && Array.isArray(jobAllocations)) {
        jobAllocations.forEach(allocation => {
          const jobId = allocation.jobId || 'unassigned';
          const jobNumber = allocation.jobNumber || 'Unassigned';
          const hours = allocation.hours || 0;
          const jobCost = hours * hourlyRate;

          if (!jobCosts.has(jobId)) {
            jobCosts.set(jobId, {
              jobId,
              jobNumber,
              staff: [],
              totalHours: 0,
              totalCost: 0
            });
          }

          const jobData = jobCosts.get(jobId)!;
          jobData.staff.push({
            id: timesheet.staff.id,
            name: timesheet.staff.name,
            hourlyRate,
            hoursWorked: hours,
            cost: jobCost
          });
          jobData.totalHours += hours;
          jobData.totalCost += jobCost;
        });
      }
    });

    // Calculate summary
    const totalLaborCost = timesheets.reduce((sum, ts) => {
      const rate = ts.staff.hourlyRate || 0;
      return sum + (ts.totalHours * rate);
    }, 0);

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);
    const averageCostPerHour = totalHours > 0 ? totalLaborCost / totalHours : 0;

    const summary = {
      totalJobs: jobCosts.size,
      totalLaborCost,
      totalHours,
      averageCostPerHour,
      staffCount: new Set(timesheets.map(ts => ts.staffId)).size
    };

    // Convert job costs to array
    const jobs = Array.from(jobCosts.values()).map(job => ({
      ...job,
      estimatedCost: job.totalCost * 0.9, // Mock: 90% of actual as estimate
      variance: job.totalCost * 0.1,
      variancePercentage: 10,
      status: 'completed'
    }));

    return NextResponse.json({
      success: true,
      summary,
      jobs,
      period: {
        type: period,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching labor costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labor costs' },
      { status: 500 }
    );
  }
}
