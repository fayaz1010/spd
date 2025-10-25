import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Save wizard progress for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const body = await request.json();
    const { stage, data } = body;

    // Update job with wizard data
    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Store wizard data in installationNotes as JSON for now
    // In production, you'd have dedicated fields in the schema
    const wizardData = {
      currentStage: stage,
      lastUpdated: new Date(),
      updatedBy: decoded.teamMemberId || decoded.subcontractorId || decoded.electricianId,
      ...data,
    };

    // Update job status based on stage
    let newStatus = job.status;
    if (stage === 2 && job.status === 'SCHEDULED') {
      newStatus = 'IN_PROGRESS';
    } else if (stage === 7) {
      newStatus = 'COMPLETED';
    }

    // Get installer ID for timesheet
    const installerId = decoded.teamMemberId || decoded.subcontractorId || decoded.electricianId;

    // Stage 2: Clock In - Create timesheet entry
    if (stage === 2 && data.arrivalTime && installerId) {
      try {
        await prisma.installerTimesheet.create({
          data: {
            jobId: params.id,
            installerId: installerId,
            clockInTime: new Date(data.arrivalTime),
            clockInGPS: null, // TODO: Add GPS from mobile device
            notes: 'Clocked in via wizard',
          },
        });
      } catch (error) {
        console.error('Error creating timesheet entry:', error);
        // Don't fail the whole request if timesheet creation fails
      }
    }

    // Stage 7: Clock Out - Update timesheet entry
    if (stage === 7 && data.clockOutTime && installerId) {
      try {
        // Find the most recent timesheet entry for this job and installer
        const timesheet = await prisma.installerTimesheet.findFirst({
          where: {
            jobId: params.id,
            installerId: installerId,
            clockOutTime: null, // Not yet clocked out
          },
          orderBy: { clockInTime: 'desc' },
        });

        if (timesheet) {
          const clockIn = new Date(timesheet.clockInTime);
          const clockOut = new Date(data.clockOutTime);
          const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

          await prisma.installerTimesheet.update({
            where: { id: timesheet.id },
            data: {
              clockOutTime: clockOut,
              clockOutGPS: null, // TODO: Add GPS from mobile device
              totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimals
              notes: timesheet.notes + ' | Clocked out via wizard',
            },
          });
        }
      } catch (error) {
        console.error('Error updating timesheet entry:', error);
        // Don't fail the whole request if timesheet update fails
      }
    }

    // Build update data object with structured fields
    const updateData: any = {
      status: newStatus,
      installationNotes: JSON.stringify(wizardData),
      updatedAt: new Date(),
    };

    // Stage 1: Pre-Check - Sync materials and safety checks
    if (stage === 1) {
      if (data.materialsVerified !== undefined) {
        updateData.materialsVerified = data.materialsVerified;
      }
      if (data.safetyCheckDone !== undefined) {
        updateData.preInstallCheckDone = data.safetyCheckDone;
        updateData.preInstallCheckAt = new Date();
        updateData.preInstallCheckBy = installerId;
      }
    }

    // Stage 2: Arrival - Sync clock in time
    if (stage === 2 && data.arrivalTime) {
      updateData.actualStartTime = new Date(data.arrivalTime);
    }

    // Stage 7: Complete - Sync clock out and completion
    if (stage === 7) {
      if (data.clockOutTime) {
        updateData.actualEndTime = new Date(data.clockOutTime);
      }
      updateData.completedAt = new Date();
      
      // Calculate actual hours if we have both times
      if (job.actualStartTime && data.clockOutTime) {
        const startTime = new Date(job.actualStartTime);
        const endTime = new Date(data.clockOutTime);
        const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        updateData.actualHours = Math.round(hours * 100) / 100;
      }
    }

    await prisma.installationJob.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      stage,
      status: newStatus,
    });
  } catch (error) {
    console.error('Wizard save error:', error);
    return NextResponse.json(
      { error: 'Failed to save wizard progress' },
      { status: 500 }
    );
  }
}

/**
 * Get wizard progress for a job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      select: {
        installationNotes: true,
        status: true,
        materialsVerified: true,
        materialsDelivered: true,
        preInstallCheckDone: true,
        preInstallCheckAt: true,
        preInstallCheckBy: true,
        actualStartTime: true,
        actualEndTime: true,
        actualHours: true,
        completedAt: true,
        scheduledDate: true,
        scheduledStartTime: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let wizardData: any = {};
    try {
      wizardData = job.installationNotes ? JSON.parse(job.installationNotes) : {};
    } catch (e) {
      // installationNotes might not be JSON
      wizardData = {};
    }

    // Sync database fields back to wizard data (database is source of truth)
    // Only sync if database has data and wizard doesn't
    if (job.materialsVerified && !wizardData.materialsVerified) {
      wizardData.materialsVerified = true;
    }
    
    if (job.preInstallCheckDone && !wizardData.safetyCheckDone) {
      wizardData.safetyCheckDone = true;
    }
    
    if (job.actualStartTime && !wizardData.arrivalTime) {
      wizardData.arrivalTime = job.actualStartTime;
    }
    
    if (job.actualEndTime && !wizardData.clockOutTime) {
      wizardData.clockOutTime = job.actualEndTime;
    }

    return NextResponse.json({
      wizardData,
      status: job.status,
      jobDetails: {
        materialsVerified: job.materialsVerified,
        materialsDelivered: job.materialsDelivered,
        preInstallCheckDone: job.preInstallCheckDone,
        preInstallCheckAt: job.preInstallCheckAt,
        preInstallCheckBy: job.preInstallCheckBy,
        scheduledDate: job.scheduledDate,
        scheduledStartTime: job.scheduledStartTime,
        actualStartTime: job.actualStartTime,
        actualEndTime: job.actualEndTime,
        actualHours: job.actualHours,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('Wizard get error:', error);
    return NextResponse.json(
      { error: 'Failed to get wizard progress' },
      { status: 500 }
    );
  }
}
