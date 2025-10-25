import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// Type-safe Prisma client with extended models
const db = prisma as any;

// POST /api/admin/payroll/generate
export async function POST(req: Request) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payPeriodStart, payPeriodEnd, payDate } = await req.json();

    const periodStart = new Date(payPeriodStart);
    const periodEnd = new Date(payPeriodEnd);
    const paymentDate = new Date(payDate);

    // Get all approved timesheets for the period
    const timesheets = await db.timesheet?.findMany({
      where: {
        weekStartDate: {
          gte: periodStart,
          lte: periodEnd
        },
        status: 'APPROVED',
        payrollProcessed: false
      },
      include: {
        staff: true
      }
    });

    if (timesheets.length === 0) {
      return NextResponse.json(
        { error: 'No approved timesheets found for this period' },
        { status: 400 }
      );
    }

    // Create payroll batch
    const batchNumber = `PAY-${format(paymentDate, 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`;

    const batch = await db.payrollBatch?.create({
      data: {
        batchNumber,
        payPeriodStart: periodStart,
        payPeriodEnd: periodEnd,
        payDate: paymentDate,
        totalStaff: 0,
        totalHours: 0,
        totalGrossPay: 0,
        totalNetPay: 0,
        totalTax: 0,
        totalSuper: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        status: 'DRAFT',
        processedBy: user.userId
      }
    });

    // Group timesheets by staff
    const staffTimesheets = timesheets.reduce((acc: any, ts: any) => {
      if (!acc[ts.staffId]) {
        acc[ts.staffId] = [];
      }
      acc[ts.staffId].push(ts);
      return acc;
    }, {} as any);

    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTax = 0;
    let totalSuper = 0;
    let totalHours = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;

    // Generate payslips
    for (const [staffId, staffTSs] of Object.entries(staffTimesheets)) {
      const staff = (staffTSs as any)[0].staff;
      
      // Calculate totals
      const regularHours = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.regularHours, 0);
      const overtimeHours = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.overtimeHours, 0);
      const doubleTimeHours = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.doubleTimeHours, 0);
      const publicHolidayHours = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.publicHolidayHours, 0);
      
      const travelAllowance = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.travelAllowance, 0);
      const toolAllowance = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.toolAllowance, 0);
      const mealAllowance = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.mealAllowance, 0);
      const otherAllowances = (staffTSs as any).reduce((sum: any, ts: any) => sum + ts.otherAllowances, 0);

      // Calculate pay
      const regularRate = staff.hourlyRate || 35;
      const overtimeRate = regularRate * 1.5;
      const doubleTimeRate = regularRate * 2.0;
      const publicHolidayRate = regularRate * 2.5;

      const regularPay = regularHours * regularRate;
      const overtimePay = overtimeHours * overtimeRate;
      const doubleTimePay = doubleTimeHours * doubleTimeRate;
      const publicHolidayPay = publicHolidayHours * publicHolidayRate;

      const totalAllowancesStaff = travelAllowance + toolAllowance + mealAllowance + otherAllowances;
      
      const grossPay = regularPay + overtimePay + doubleTimePay + publicHolidayPay + totalAllowancesStaff;

      // Calculate tax (simplified - use ATO tables in production)
      const taxWithheld = calculateTax(grossPay, 'fortnightly');

      // Calculate superannuation
      const ordinaryTimeEarnings = regularPay + overtimePay + doubleTimePay + publicHolidayPay;
      const superannuation = ordinaryTimeEarnings * (staff.superannuationRate || 11) / 100;

      const netPay = grossPay - taxWithheld;

      // Get leave balances
      const leaveBalance = await db.leaveBalance?.findUnique({
        where: { staffId }
      });

      // Create payslip
      const payslipNumber = `PS-${batchNumber}-${staffId.slice(-6)}`;

      await db.payslip?.create({
        data: {
          staffId,
          payslipNumber,
          payPeriodStart: periodStart,
          payPeriodEnd: periodEnd,
          payDate: paymentDate,
          
          regularHours,
          regularRate,
          regularPay,
          
          overtimeHours,
          overtimeRate,
          overtimePay,
          
          doubleTimeHours,
          doubleTimeRate,
          doubleTimePay,
          
          publicHolidayHours,
          publicHolidayRate,
          publicHolidayPay,
          
          travelAllowance,
          toolAllowance,
          mealAllowance,
          otherAllowances,
          totalAllowances: totalAllowancesStaff,
          
          grossPay,
          
          taxWithheld,
          superannuation,
          superRate: staff.superannuationRate || 11,
          totalDeductions: taxWithheld,
          
          netPay,
          
          annualLeaveBalance: leaveBalance?.annualLeaveBalance,
          sickLeaveBalance: leaveBalance?.sickLeaveBalance,
          rdoBalance: leaveBalance?.rdoBalance,
          
          payrollBatchId: batch.id,
          paymentStatus: 'PENDING'
        }
      });

      // Update timesheet status
      await db.timesheet?.updateMany({
        where: {
          id: { in: (staffTSs as any).map((ts: any) => ts.id) }
        },
        data: {
          payrollProcessed: true,
          payrollBatchId: batch.id,
          status: 'PROCESSED'
        }
      });

      totalGrossPay += grossPay;
      totalNetPay += netPay;
      totalTax += taxWithheld;
      totalSuper += superannuation;
      totalHours += regularHours + overtimeHours + doubleTimeHours + publicHolidayHours;
      totalAllowances += totalAllowancesStaff;
      totalDeductions += taxWithheld;
    }

    // Update batch totals
    await db.payrollBatch?.update({
      where: { id: batch.id },
      data: {
        totalStaff: Object.keys(staffTimesheets).length,
        totalHours,
        totalGrossPay,
        totalNetPay,
        totalTax,
        totalSuper,
        totalAllowances,
        totalDeductions
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payroll batch generated successfully',
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        totalStaff: Object.keys(staffTimesheets).length,
        totalGrossPay,
        totalNetPay
      }
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to generate payroll' },
      { status: 500 }
    );
  }
}

// Simplified tax calculation - use ATO tax tables in production
function calculateTax(grossPay: number, frequency: 'weekly' | 'fortnightly' | 'monthly'): number {
  // Convert to annual
  let annualIncome = grossPay;
  if (frequency === 'weekly') annualIncome *= 52;
  if (frequency === 'fortnightly') annualIncome *= 26;
  if (frequency === 'monthly') annualIncome *= 12;
  
  // 2024-25 tax rates (simplified)
  let annualTax = 0;
  
  if (annualIncome <= 18200) {
    annualTax = 0;
  } else if (annualIncome <= 45000) {
    annualTax = (annualIncome - 18200) * 0.19;
  } else if (annualIncome <= 120000) {
    annualTax = 5092 + (annualIncome - 45000) * 0.325;
  } else if (annualIncome <= 180000) {
    annualTax = 29467 + (annualIncome - 120000) * 0.37;
  } else {
    annualTax = 51667 + (annualIncome - 180000) * 0.45;
  }
  
  // Convert back to pay period
  if (frequency === 'weekly') return annualTax / 52;
  if (frequency === 'fortnightly') return annualTax / 26;
  if (frequency === 'monthly') return annualTax / 12;
  
  return annualTax;
}
