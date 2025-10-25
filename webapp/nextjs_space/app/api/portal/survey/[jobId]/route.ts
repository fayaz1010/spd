import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Customer Portal - Get survey for job
 * GET /api/portal/survey/[jobId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    // Check if survey already completed
    const existingSurvey = await prisma.customerSurvey.findUnique({
      where: { jobId: params.jobId },
    });

    if (existingSurvey) {
      return NextResponse.json({
        success: true,
        completed: true,
        survey: existingSurvey,
      });
    }

    // Get job details
    const job = await prisma.installationJob.findUnique({
      where: { id: params.jobId },
      include: {
        lead: {
          select: {
            customerName: true,
            email: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      completed: false,
      job: {
        jobNumber: job.jobNumber,
        customerName: job.lead.customerName,
        systemSize: job.systemSize,
        installationDate: job.installationDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching survey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch survey', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Customer Portal - Submit survey
 * POST /api/portal/survey/[jobId]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const body = await request.json();

    // Check if survey already exists
    const existing = await prisma.customerSurvey.findUnique({
      where: { jobId: params.jobId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Survey already completed for this job' },
        { status: 400 }
      );
    }

    // Create survey
    const survey = await prisma.customerSurvey.create({
      data: {
        jobId: params.jobId,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        installationQuality: body.installationQuality,
        installerProfessional: body.installerProfessional,
        siteCleanness: body.siteCleanness,
        timelyCompletion: body.timelyCompletion,
        systemPerformance: body.systemPerformance,
        productQuality: body.productQuality,
        valueForMoney: body.valueForMoney,
        communicationQuality: body.communicationQuality,
        responsiveness: body.responsiveness,
        overallSatisfaction: body.overallSatisfaction,
        whatWentWell: body.whatWentWell,
        whatCouldImprove: body.whatCouldImprove,
        wouldRecommend: body.wouldRecommend,
        recommendationReason: body.recommendationReason,
        allowTestimonialUse: body.allowTestimonialUse,
        allowContactForCase: body.allowContactForCase,
      },
    });

    // Auto-create testimonial if allowed and high rating
    if (body.allowTestimonialUse && body.overallSatisfaction >= 4) {
      const job = await prisma.installationJob.findUnique({
        where: { id: params.jobId },
        include: {
          lead: {
            select: {
              suburb: true,
            },
          },
        },
      });

      await prisma.testimonial.create({
        data: {
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          jobId: params.jobId,
          rating: body.overallSatisfaction,
          title: `Great experience with ${body.customerName}`,
          review: body.whatWentWell || body.recommendationReason || 'Excellent service!',
          location: job?.lead?.suburb,
          systemSize: job?.systemSize,
          installDate: job?.installationDate,
          status: 'PENDING',
          source: 'survey',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for completing the survey!',
      survey: {
        id: survey.id,
        completedAt: survey.completedAt,
      },
    });
  } catch (error: any) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: 'Failed to submit survey', details: error.message },
      { status: 500 }
    );
  }
}
