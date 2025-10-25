/**
 * Network Approval Tracking API
 * Manages grid connection applications and approvals
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const db = prisma as any;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      networkProvider,
      applicationNumber,
      applicationDate,
      systemSize,
      exportLimit,
      status,
      approvalDate,
      notes,
    } = body;

    if (!jobId || !networkProvider) {
      return NextResponse.json(
        { success: false, error: 'Job ID and network provider are required' },
        { status: 400 }
      );
    }

    // Create network approval record
    const approval = await db.networkApproval?.create({
      data: {
        jobId,
        networkProvider,
        applicationNumber: applicationNumber || null,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        systemSize: systemSize ? parseFloat(systemSize) : null,
        exportLimit: exportLimit ? parseFloat(exportLimit) : null,
        status: status || 'PENDING',
        approvalDate: approvalDate ? new Date(approvalDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      approval,
    });
  } catch (error) {
    console.error('Network approval error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create network approval' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const approval = await db.networkApproval?.findFirst({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      approval,
    });
  } catch (error) {
    console.error('Error fetching network approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch network approval' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, approvalDate, applicationNumber, exportLimit, notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Approval ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (approvalDate) updateData.approvalDate = new Date(approvalDate);
    if (applicationNumber) updateData.applicationNumber = applicationNumber;
    if (exportLimit) updateData.exportLimit = parseFloat(exportLimit);
    if (notes !== undefined) updateData.notes = notes;

    const approval = await db.networkApproval?.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      approval,
    });
  } catch (error) {
    console.error('Error updating network approval:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update network approval' },
      { status: 500 }
    );
  }
}
