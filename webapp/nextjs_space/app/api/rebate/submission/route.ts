/**
 * Rebate Submission API
 * Manages STC rebate submissions and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateSTCs, validateSTCEligibility } from '@/lib/stc-calculator';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, action } = body;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Calculate STCs
    if (action === 'calculate') {
      const { systemSize, installationDate, postcode, state } = body;

      if (!systemSize || !installationDate || !postcode || !state) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields for STC calculation' },
          { status: 400 }
        );
      }

      const stcResult = calculateSTCs({
        systemSize: parseFloat(systemSize),
        installationDate: new Date(installationDate),
        postcode,
        state,
      });

      return NextResponse.json({
        success: true,
        stcResult,
      });
    }

    // Validate eligibility
    if (action === 'validate') {
      // In production, fetch actual job data from database
      const eligibility = validateSTCEligibility({
        systemSize: body.systemSize || 0,
        panelsValidated: body.panelsValidated || false,
        inverterValidated: body.inverterValidated || false,
        electricalCertificate: body.electricalCertificate || false,
        complianceStatement: body.complianceStatement || false,
        customerDeclaration: body.customerDeclaration || false,
        installationPhotos: body.installationPhotos || false,
      });

      return NextResponse.json({
        success: true,
        eligibility,
      });
    }

    // Create submission
    if (action === 'submit') {
      const {
        stcCount,
        stcValue,
        systemSize,
        installationDate,
        postcode,
        state,
        zone,
      } = body;

      if (!stcCount || !systemSize) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields for submission' },
          { status: 400 }
        );
      }

      // Create rebate submission record
      const submission = await (prisma as any).rebateSubmission?.create({
        data: {
          jobId,
          stcCount: parseInt(stcCount),
          stcValue: parseFloat(stcValue),
          systemSize: parseFloat(systemSize),
          installationDate: new Date(installationDate),
          postcode,
          state,
          zone: parseInt(zone),
          status: 'PENDING',
          submittedAt: new Date(),
          submittedBy: 'admin', // TODO: Get from auth
        } as any,
      });

      return NextResponse.json({
        success: true,
        submission,
      });
    }

    // Update submission status
    if (action === 'update-status') {
      const { submissionId, status, notes, approvalDate, paymentDate, paymentAmount } = body;

      if (!submissionId || !status) {
        return NextResponse.json(
          { success: false, error: 'Submission ID and status are required' },
          { status: 400 }
        );
      }

      const updateData: any = { status };
      if (notes) updateData.notes = notes;
      if (approvalDate) updateData.approvalDate = new Date(approvalDate);
      if (paymentDate) updateData.paymentDate = new Date(paymentDate);
      if (paymentAmount) updateData.paymentAmount = parseFloat(paymentAmount);

      const submission = await prisma.rebateSubmission.update({
        where: { id: submissionId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        submission,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Rebate submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process rebate submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const submissionId = searchParams.get('submissionId');

    if (submissionId) {
      // Get specific submission
      const submission = await prisma.rebateSubmission.findUnique({
        where: { id: submissionId },
      });

      return NextResponse.json({
        success: true,
        submission,
      });
    }

    if (jobId) {
      // Get submissions for a job
      const submissions = await prisma.rebateSubmission.findMany({
        where: { jobId },
        orderBy: { submittedAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        submissions,
      });
    }

    // Get all submissions
    const submissions = await prisma.rebateSubmission.findMany({
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
