import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { calculateComplianceScore } from '@/lib/compliance-scoring';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// Type-safe Prisma client
const db = prisma as any;

// GET /api/admin/staff/[id]/performance
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get performance reviews
    const reviews = await db.performanceReview?.findMany({
      where: { staffId: params.id },
      orderBy: { reviewDate: 'desc' }
    });

    // Get latest KPIs (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const kpis = await db.staffKPI?.findMany({
      where: {
        staffId: params.id,
        month: { gte: sixMonthsAgo }
      },
      orderBy: { month: 'desc' }
    });

    // Get current month KPI or calculate it
    const currentMonth = startOfMonth(new Date());
    let currentKPI = await db.staffKPI?.findUnique({
      where: {
        staffId_month: {
          staffId: params.id,
          month: currentMonth
        }
      }
    });

    if (!currentKPI) {
      // Calculate current month KPI from existing data
      currentKPI = await calculateCurrentMonthKPI(params.id, currentMonth) as any;
    }

    // Get compliance score from certifications (Phase 1 integration)
    const certifications = await db.staffCertification?.findUnique({
      where: { staffId: params.id }
    });

    const complianceScore = certifications ? calculateComplianceScore(certifications) : 0;

    return NextResponse.json({
      success: true,
      reviews,
      kpis,
      currentKPI,
      complianceScore,
      summary: {
        totalReviews: reviews.length,
        averageRating: reviews.length > 0
          ? reviews.reduce((sum: any, r: any) => sum + (r.overallRating || 0), 0) / reviews.length
          : 0,
        lastReviewDate: reviews[0]?.reviewDate || null,
        nextReviewDue: calculateNextReviewDate(reviews)
      }
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/staff/[id]/performance
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyJWT(req);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get compliance score from certifications (Phase 1 integration)
    const certifications = await db.staffCertification?.findUnique({
      where: { staffId: params.id }
    });

    const complianceScore = certifications ? calculateComplianceScoreLocal(certifications).overall : 0;

    // Calculate overall rating from individual ratings
    const ratings = [
      body.technicalSkills,
      body.safetyCompliance,
      body.qualityOfWork,
      body.productivity,
      body.customerService,
      body.teamwork,
      body.communication,
      body.reliability
    ].filter(r => r !== null && r !== undefined);

    const overallRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : null;

    const review = await db.performanceReview?.create({
      data: {
        staffId: params.id,
        reviewType: body.reviewType,
        reviewPeriodStart: new Date(body.reviewPeriodStart),
        reviewPeriodEnd: new Date(body.reviewPeriodEnd),
        reviewedBy: user.userId,
        reviewDate: new Date(),
        
        technicalSkills: body.technicalSkills,
        safetyCompliance: body.safetyCompliance,
        qualityOfWork: body.qualityOfWork,
        productivity: body.productivity,
        customerService: body.customerService,
        teamwork: body.teamwork,
        communication: body.communication,
        reliability: body.reliability,
        
        overallRating,
        complianceScore, // From Phase 1
        
        jobsCompleted: body.jobsCompleted,
        averageJobTime: body.averageJobTime,
        customerRating: body.customerRating,
        safetyIncidents: body.safetyIncidents,
        
        strengths: body.strengths,
        areasForImprovement: body.areasForImprovement,
        goals: body.goals,
        trainingNeeds: body.trainingNeeds,
        
        salaryIncrease: body.salaryIncrease,
        newSalary: body.newSalary,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
        
        status: 'DRAFT'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Performance review created successfully',
      review
    });
  } catch (error) {
    console.error('Error creating performance review:', error);
    return NextResponse.json(
      { error: 'Failed to create performance review' },
      { status: 500 }
    );
  }
}

// Helper function to calculate current month KPI from existing data
async function calculateCurrentMonthKPI(staffId: string, month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Get attendance data (Phase 1)
  const attendance = await db.attendanceRecord?.findMany({
    where: {
      staffId,
      date: { gte: monthStart, lte: monthEnd }
    }
  });

  const daysWorked = attendance.filter((a: any) => a.status === 'PRESENT').length;
  const daysAbsent = attendance.filter((a: any) => a.status === 'ABSENT').length;
  const lateArrivals = attendance.filter((a: any) => a.status === 'LATE').length;

  // Get timesheet data (Phase 2)
  const timesheets = await db.timesheet?.findMany({
    where: {
      staffId,
      weekStartDate: { gte: monthStart, lte: monthEnd }
    }
  });

  const hoursWorked = timesheets.reduce((sum: any, ts: any) => sum + ts.totalHours, 0);

  // Get payroll data (Phase 2)
  const payslips = await db.payslip?.findMany({
    where: {
      staffId,
      payDate: { gte: monthStart, lte: monthEnd }
    }
  });

  const laborCost = payslips.reduce((sum: any, ps: any) => sum + ps.grossPay, 0);

  // Get compliance score (Phase 1)
  const certifications = await db.staffCertification?.findUnique({
    where: { staffId }
  });

  const complianceScore = certifications ? calculateComplianceScore(certifications) : 0;

  return {
    staffId,
    month: monthStart,
    daysWorked,
    daysAbsent,
    lateArrivals,
    hoursWorked,
    laborCost,
    complianceScore,
    jobsCompleted: 0, // Would come from job system
    jobsPerHour: 0,
    customerRating: 0,
    reworkRequired: 0,
    safetyIncidents: 0,
    safetyTraining: 0,
    revenueGenerated: 0,
    profitability: 0
  };
}

// Helper function to calculate compliance score - returns full object like imported version
function calculateComplianceScoreLocal(cert: any): any {
  const result = calculateComplianceScore(cert);
  return typeof result === 'number' ? { overall: result } : result;
}

function calculateNextReviewDate(reviews: any[]): Date | null {
  if (reviews.length === 0) return null;
  
  const lastReview = reviews[0];
  const nextReview = new Date(lastReview.reviewDate);
  
  switch (lastReview.reviewType) {
    case 'PROBATION':
      nextReview.setMonth(nextReview.getMonth() + 3);
      break;
    case 'QUARTERLY':
      nextReview.setMonth(nextReview.getMonth() + 3);
      break;
    case 'ANNUAL':
      nextReview.setFullYear(nextReview.getFullYear() + 1);
      break;
    default:
      return null;
  }
  
  return nextReview;
}
