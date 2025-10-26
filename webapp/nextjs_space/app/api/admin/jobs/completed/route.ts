import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Get completed jobs for case study selection
 * GET /api/admin/jobs/completed
 */
export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.installationJob.findMany({
      where: {
        status: {
          in: ['COMPLETED', 'DOCUMENTATION_SUBMITTED'],
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
            suburb: true,
            state: true,
            postcode: true,
          },
        },
        quote: {
          select: {
            systemSizeKw: true,
            panelCount: true,
            batterySizeKwh: true,
            panelBrand: true,
            panelModel: true,
            inverterBrand: true,
            inverterModel: true,
            batteryBrand: true,
            batteryModel: true,
            totalCost: true,
            estimatedAnnualSavings: true,
            paybackPeriod: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 50, // Last 50 completed jobs
    });

    // Format for case study selection
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      jobNumber: job.jobNumber,
      customerName: job.customer?.name || 'Unknown',
      location: job.customer?.suburb || job.customer?.address || '',
      systemSize: job.quote?.systemSizeKw || 0,
      panelCount: job.quote?.panelCount || 0,
      batterySize: job.quote?.batterySizeKwh || null,
      panelBrand: job.quote?.panelBrand || '',
      panelModel: job.quote?.panelModel || '',
      inverterBrand: job.quote?.inverterBrand || '',
      inverterModel: job.quote?.inverterModel || '',
      batteryBrand: job.quote?.batteryBrand || '',
      batteryModel: job.quote?.batteryModel || '',
      totalCost: job.quote?.totalCost || 0,
      annualSavings: job.quote?.estimatedAnnualSavings || 0,
      paybackPeriod: job.quote?.paybackPeriod || 0,
      installDate: job.completedAt?.toISOString().split('T')[0] || job.createdAt.toISOString().split('T')[0],
      category: job.jobType === 'COMMERCIAL' ? 'commercial' : 'residential',
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error('Error fetching completed jobs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch completed jobs' },
      { status: 500 }
    );
  }
}
