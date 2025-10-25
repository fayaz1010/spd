
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// POST /api/reschedule/[jobId] - Create reschedule request (customer-facing, token-based)
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if token is for this specific job
      if (decoded.jobId !== params.jobId) {
        return NextResponse.json(
          { error: "Invalid token for this job" },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { requestedDate, reason } = body;

    if (!requestedDate) {
      return NextResponse.json(
        { error: "Requested date is required" },
        { status: 400 }
      );
    }

    // Get current job details
    const job = await prisma.installationJob.findUnique({
      where: { id: params.jobId },
      select: { scheduledDate: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.scheduledDate) {
      return NextResponse.json(
        { error: "Job does not have a scheduled date" },
        { status: 400 }
      );
    }

    // Create reschedule request
    const rescheduleRequest = await prisma.rescheduleRequest.create({
      data: {
        id: `reschedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: params.jobId,
        requestedBy: "Customer",
        originalDate: job.scheduledDate,
        requestedDate: new Date(requestedDate),
        reason: reason || null,
        status: "PENDING",
        updatedAt: new Date(),
      },
    });

    // TODO: Send notification email to admin
    console.log("=== RESCHEDULE REQUEST CREATED ===");
    console.log("Job ID:", params.jobId);
    console.log("Original Date:", job.scheduledDate);
    console.log("Requested Date:", requestedDate);
    console.log("Reason:", reason);
    console.log("==================================");

    return NextResponse.json({
      success: true,
      message: "Reschedule request submitted successfully",
      request: rescheduleRequest,
    });
  } catch (error) {
    console.error("Error creating reschedule request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
