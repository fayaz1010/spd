
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAdminFromRequest } from "@/lib/auth-admin";

const prisma = new PrismaClient();

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/jobs/[id] - Get a specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      include: {
        lead: true,
        team: true,
        subcontractor: true,
        materialOrders: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/jobs/[id] - Update a job
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = params;

    console.log('PATCH /api/admin/jobs/[id] - Updating job:', id);
    console.log('Update data:', JSON.stringify(body, null, 2));

    // Filter out undefined values and convert dates
    const updateData: any = {};
    
    // Fields that should be Date objects
    const dateFields = ['scheduledDate', 'deliveryDate', 'installationDate', 'actualStartTime', 
                        'actualEndTime', 'assignedAt', 'subConfirmedAt', 'subRejectedAt',
                        'completedAt', 'materialsReadyAt', 'preInstallCheckAt', 'qualityCheckDate',
                        'callbackDate', 'bonusCalculatedAt', 'bonusPaidAt'];
    
    // Fields that should NOT be included (time strings, not dates)
    const timeStringFields = ['scheduledStartTime'];
    
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null || value === '') {
        // Skip undefined, null, or empty string values
        continue;
      }
      
      // Handle date fields
      if (dateFields.includes(key)) {
        if (typeof value === 'string') {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              updateData[key] = date;
            }
          } catch (e) {
            console.warn(`Failed to parse date for ${key}:`, value);
          }
        } else if (value instanceof Date) {
          updateData[key] = value;
        }
      } 
      // Handle time string fields (keep as string)
      else if (timeStringFields.includes(key)) {
        updateData[key] = String(value);
      }
      // Handle numeric fields
      else if (typeof value === 'number') {
        // Skip NaN values
        if (!isNaN(value)) {
          updateData[key] = value;
        }
      }
      // Handle boolean fields
      else if (typeof value === 'boolean') {
        updateData[key] = value;
      }
      // Handle string fields
      else if (typeof value === 'string') {
        updateData[key] = value;
      }
      // Handle other types (arrays, objects, etc.)
      else {
        updateData[key] = value;
      }
    }

    updateData.updatedAt = new Date();

    console.log('Filtered update data:', JSON.stringify(updateData, null, 2));

    // Sync admin updates to wizard JSON for bidirectional consistency
    const currentJob = await prisma.installationJob.findUnique({
      where: { id },
      select: { installationNotes: true },
    });

    let wizardData: any = {};
    try {
      wizardData = currentJob?.installationNotes ? JSON.parse(currentJob.installationNotes) : {};
    } catch (e) {
      console.warn('Failed to parse wizard data:', e);
    }

    // Sync specific admin updates to wizard data
    if (updateData.materialsVerified !== undefined) {
      wizardData.materialsVerified = updateData.materialsVerified;
    }
    if (updateData.materialsDelivered !== undefined) {
      wizardData.materialsDelivered = updateData.materialsDelivered;
    }
    if (updateData.preInstallCheckDone !== undefined) {
      wizardData.safetyCheckDone = updateData.preInstallCheckDone;
    }
    if (updateData.actualStartTime !== undefined) {
      wizardData.arrivalTime = updateData.actualStartTime;
    }
    if (updateData.actualEndTime !== undefined) {
      wizardData.clockOutTime = updateData.actualEndTime;
    }

    // Update wizard JSON if any syncs were made
    if (Object.keys(wizardData).length > 0) {
      updateData.installationNotes = JSON.stringify(wizardData);
    }

    // Update the job with provided fields
    let updatedJob;
    try {
      updatedJob = await prisma.installationJob.update({
        where: { id },
        data: updateData,
        include: {
          lead: true,
          team: {
            include: {
              members: true,
            },
          },
          subcontractor: true,
          materialOrders: {
            include: {
              supplier: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      console.error("Error code:", dbError.code);
      console.error("Error meta:", dbError.meta);
      
      // Provide more specific error messages
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "Unique constraint violation. A record with this value already exists." },
          { status: 400 }
        );
      } else if (dbError.code === 'P2003') {
        return NextResponse.json(
          { error: "Foreign key constraint failed. Referenced record does not exist." },
          { status: 400 }
        );
      } else if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: "Record not found." },
          { status: 404 }
        );
      }
      
      throw dbError; // Re-throw if not a known error
    }

    console.log('Job updated successfully');

    return NextResponse.json({ 
      success: true,
      job: updatedJob 
    });
  } catch (error: any) {
    console.error("Error updating job:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return more detailed error message
    return NextResponse.json(
      { 
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
