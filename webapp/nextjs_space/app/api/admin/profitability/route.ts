import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

// GET /api/admin/profitability
export async function GET(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();

    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    // ========================================
    // 1. Calculate Labor Costs (from Phase 2)
    // ========================================
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
            role: true,
            hourlyRate: true
          }
        }
      }
    });

    const totalLaborCost = timesheets.reduce((sum, ts) => {
      const rate = ts.staff.hourlyRate || 0;
      return sum + (ts.totalHours * rate);
    }, 0);

    const totalHours = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);

    // ========================================
    // 2. Calculate Staff Profitability
    // ========================================
    const staffProfitability = new Map<string, {
      id: string;
      name: string;
      role: string;
      jobsCompleted: number;
      hoursWorked: number;
      laborCost: number;
      revenueGenerated: number;
    }>();

    timesheets.forEach(ts => {
      const staffId = ts.staffId;
      const rate = ts.staff.hourlyRate || 0;
      const cost = ts.totalHours * rate;

      if (!staffProfitability.has(staffId)) {
        staffProfitability.set(staffId, {
          id: staffId,
          name: ts.staff.name,
          role: ts.staff.role || 'Staff',
          jobsCompleted: 0,
          hoursWorked: 0,
          laborCost: 0,
          revenueGenerated: 0
        });
      }

      const staffData = staffProfitability.get(staffId)!;
      staffData.hoursWorked += ts.totalHours;
      staffData.laborCost += cost;
      
      // Estimate revenue (would come from job system)
      // Using 10x labor cost as revenue estimate
      staffData.revenueGenerated += cost * 10;
    });

    const staffData = Array.from(staffProfitability.values()).map(staff => ({
      ...staff,
      profitContribution: staff.revenueGenerated - staff.laborCost,
      profitMargin: staff.revenueGenerated > 0 
        ? ((staff.revenueGenerated - staff.laborCost) / staff.revenueGenerated) * 100 
        : 0,
      efficiency: 90 // Mock efficiency score
    }));

    // ========================================
    // 3. Calculate Overall Profitability
    // ========================================
    const totalRevenue = totalLaborCost * 10; // Mock: 10x labor cost
    const totalMaterialCost = totalRevenue * 0.45; // Mock: 45% of revenue
    const totalOverhead = totalRevenue * 0.10; // Mock: 10% of revenue
    const grossProfit = totalRevenue - totalLaborCost - totalMaterialCost;
    const netProfit = grossProfit - totalOverhead;

    const currentPeriod = {
      period: date.toISOString(),
      totalRevenue,
      totalLaborCost,
      totalMaterialCost,
      totalOverhead,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netProfit,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      jobCount: timesheets.length,
      averageJobValue: timesheets.length > 0 ? totalRevenue / timesheets.length : 0,
      averageLaborCost: timesheets.length > 0 ? totalLaborCost / timesheets.length : 0,
      averageProfit: timesheets.length > 0 ? netProfit / timesheets.length : 0
    };

    // ========================================
    // 4. Job Type Profitability (Mock Data)
    // ========================================
    const jobTypeData = [
      {
        type: 'Residential Solar',
        jobCount: Math.floor(timesheets.length * 0.6),
        totalRevenue: totalRevenue * 0.6,
        totalCost: (totalLaborCost + totalMaterialCost) * 0.6,
        profit: 0,
        margin: 0,
        averageJobValue: 0
      },
      {
        type: 'Commercial Solar',
        jobCount: Math.floor(timesheets.length * 0.25),
        totalRevenue: totalRevenue * 0.25,
        totalCost: (totalLaborCost + totalMaterialCost) * 0.25,
        profit: 0,
        margin: 0,
        averageJobValue: 0
      },
      {
        type: 'Battery Installation',
        jobCount: Math.floor(timesheets.length * 0.15),
        totalRevenue: totalRevenue * 0.15,
        totalCost: (totalLaborCost + totalMaterialCost) * 0.15,
        profit: 0,
        margin: 0,
        averageJobValue: 0
      }
    ].map(jt => ({
      ...jt,
      profit: jt.totalRevenue - jt.totalCost,
      margin: jt.totalRevenue > 0 ? ((jt.totalRevenue - jt.totalCost) / jt.totalRevenue) * 100 : 0,
      averageJobValue: jt.jobCount > 0 ? jt.totalRevenue / jt.jobCount : 0
    }));

    return NextResponse.json({
      success: true,
      currentPeriod,
      staffData,
      jobTypeData,
      period: {
        type: period,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error fetching profitability data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profitability data' },
      { status: 500 }
    );
  }
}
