import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

// POST /api/admin/staff/[id]/kpi/calculate
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month } = await req.json();
    const targetMonth = month ? new Date(month) : new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    // ========================================
    // PHASE 1: Attendance & Compliance Data
    // ========================================
    
    const attendance = await prisma.attendanceRecord.findMany({
      where: {
        staffId: params.id,
        date: { gte: monthStart, lte: monthEnd }
      }
    });

    const daysWorked = attendance.filter(a => a.status === 'PRESENT').length;
    const daysAbsent = attendance.filter(a => a.status === 'ABSENT').length;
    const lateArrivals = attendance.filter(a => a.status === 'LATE').length;

    const certifications = await prisma.staffCertification.findUnique({
      where: { staffId: params.id }
    });

    const complianceScore = certifications ? calculateComplianceScore(certifications) : 0;

    // ========================================
    // PHASE 2: Timesheet & Payroll Data
    // ========================================
    
    const timesheets = await prisma.timesheet.findMany({
      where: {
        staffId: params.id,
        weekStartDate: { gte: monthStart, lte: monthEnd }
      }
    });

    const hoursWorked = timesheets.reduce((sum, ts) => sum + ts.totalHours, 0);

    const payslips = await prisma.payslip.findMany({
      where: {
        staffId: params.id,
        payDate: { gte: monthStart, lte: monthEnd }
      }
    });

    const laborCost = payslips.reduce((sum, ps) => sum + ps.grossPay, 0);

    // ========================================
    // PHASE 3: Training Data
    // ========================================
    
    const trainingCompleted = await prisma.trainingRecord.count({
      where: {
        staffId: params.id,
        completionDate: { gte: monthStart, lte: monthEnd },
        status: 'COMPLETED'
      }
    });

    // ========================================
    // Calculate Derived Metrics
    // ========================================
    
    const jobsPerHour = hoursWorked > 0 ? 0 : 0; // Would come from job system
    const profitability = laborCost > 0 ? 0 : 0; // Would need revenue data

    // ========================================
    // Create or Update KPI Record
    // ========================================
    
    const kpi = await prisma.staffKPI.upsert({
      where: {
        staffId_month: {
          staffId: params.id,
          month: monthStart
        }
      },
      create: {
        staffId: params.id,
        month: monthStart,
        
        // From Phase 1
        daysWorked,
        daysAbsent,
        lateArrivals,
        complianceScore,
        
        // From Phase 2
        hoursWorked,
        laborCost,
        
        // From Phase 3
        safetyTraining: trainingCompleted,
        
        // Calculated
        jobsPerHour,
        profitability,
        
        // Placeholders (would come from job system)
        jobsCompleted: 0,
        customerRating: 0,
        reworkRequired: 0,
        safetyIncidents: 0,
        revenueGenerated: 0
      },
      update: {
        daysWorked,
        daysAbsent,
        lateArrivals,
        complianceScore,
        hoursWorked,
        laborCost,
        safetyTraining: trainingCompleted,
        jobsPerHour,
        profitability,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'KPI calculated successfully',
      kpi,
      breakdown: {
        phase1: {
          daysWorked,
          daysAbsent,
          lateArrivals,
          complianceScore
        },
        phase2: {
          hoursWorked,
          laborCost
        },
        phase3: {
          trainingCompleted
        }
      }
    });
  } catch (error) {
    console.error('Error calculating KPI:', error);
    return NextResponse.json(
      { error: 'Failed to calculate KPI' },
      { status: 500 }
    );
  }
}

function calculateComplianceScore(cert: any): number {
  const today = new Date();
  let score = 0;

  if (cert.cecAccreditationNumber && cert.cecExpiryDate) {
    const days = Math.floor((new Date(cert.cecExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 90) score += 30;
    else if (days > 30) score += 20;
    else if (days > 0) score += 10;
  }

  if (cert.electricalLicenseNumber && cert.licenseExpiryDate) {
    const days = Math.floor((new Date(cert.licenseExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 90) score += 30;
    else if (days > 30) score += 20;
    else if (days > 0) score += 10;
  }

  if (cert.whiteCardNumber) score += 10;
  if (cert.workingAtHeights && cert.workingAtHeightsExpiry && new Date(cert.workingAtHeightsExpiry) > today) score += 5;
  if (cert.firstAidCert && cert.firstAidExpiry && new Date(cert.firstAidExpiry) > today) score += 5;

  if (cert.batteryInstallCert && cert.batteryInstallExpiry && new Date(cert.batteryInstallExpiry) > today) score += 10;
  if (cert.evChargerCert && cert.evChargerExpiry && new Date(cert.evChargerExpiry) > today) score += 5;
  if (cert.solarDesignCert && cert.solarDesignExpiry && new Date(cert.solarDesignExpiry) > today) score += 5;

  return score;
}
