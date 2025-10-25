import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/loan-application/[leadId]
 * Create or update loan application for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.leadId;
    const body = await request.json();

    const {
      applicationReferenceNumber,
      submittedAt,
      approved,
      approvedAt,
      receiptUrl
    } = body;

    // Check if loan application exists
    const existing = await prisma.loanApplication.findUnique({
      where: { leadId }
    });

    let loanApplication;

    if (existing) {
      // Update existing
      loanApplication = await prisma.loanApplication.update({
        where: { leadId },
        data: {
          applicationReferenceNumber: applicationReferenceNumber || existing.applicationReferenceNumber,
          submittedAt: submittedAt ? new Date(submittedAt) : existing.submittedAt,
          approved: approved !== undefined ? approved : existing.approved,
          approvedAt: approvedAt ? new Date(approvedAt) : existing.approvedAt,
          receiptUrl: receiptUrl || existing.receiptUrl,
          updatedAt: new Date()
        }
      });
    } else {
      // Get loan details from lead
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }

      // Create new
      loanApplication = await prisma.loanApplication.create({
        data: {
          leadId,
          loanAmount: lead.loanAmount || 0,
          loanTerm: lead.loanTerm || 5,
          monthlyPayment: lead.loanMonthlyPayment || 0,
          householdIncome: lead.householdIncome || 0,
          numberOfDependents: lead.numberOfDependents || 0,
          employmentStatus: lead.employmentStatus || null,
          pensionCardHolder: lead.pensionCardHolder || false,
          healthCareCardHolder: lead.healthCareCardHolder || false,
          applicationReferenceNumber: applicationReferenceNumber || null,
          submittedAt: submittedAt ? new Date(submittedAt) : null,
          approved: approved || false,
          approvedAt: approvedAt ? new Date(approvedAt) : null,
          receiptUrl: receiptUrl || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'status_change',
        description: `Loan application updated: ${approved ? 'Approved' : 'Pending'}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      loanApplication
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error saving loan application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save loan application',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/loan-application/[leadId]
 * Get loan application for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.leadId;

    const loanApplication = await prisma.loanApplication.findUnique({
      where: { leadId }
    });

    if (!loanApplication) {
      return NextResponse.json({
        success: true,
        loanApplication: null
      });
    }

    return NextResponse.json({
      success: true,
      loanApplication
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error fetching loan application:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch loan application',
        details: error.message
      },
      { status: 500 }
    );
  }
}
