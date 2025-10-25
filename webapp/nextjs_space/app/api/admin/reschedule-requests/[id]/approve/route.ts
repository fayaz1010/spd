
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as any;
  } catch (error) {
    return null;
  }
}

// POST /api/admin/reschedule-requests/[id]/approve - Approve reschedule request
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewNotes } = body;

    // Get the reschedule request
    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!rescheduleRequest) {
      return NextResponse.json(
        { error: "Reschedule request not found" },
        { status: 404 }
      );
    }

    if (rescheduleRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been processed" },
        { status: 400 }
      );
    }

    // Update the reschedule request
    await prisma.rescheduleRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        reviewedBy: decoded.name || decoded.email,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    // Update the job's scheduled date
    await prisma.installationJob.update({
      where: { id: rescheduleRequest.jobId },
      data: {
        scheduledDate: rescheduleRequest.requestedDate,
      },
    });

    // TODO: Send confirmation email to customer
    console.log("=== RESCHEDULE APPROVED ===");
    console.log("Job:", rescheduleRequest.job.jobNumber);
    console.log("New Date:", rescheduleRequest.requestedDate);
    console.log("Customer:", rescheduleRequest.job.lead.email);
    console.log("==========================");

    return NextResponse.json({
      success: true,
      message: "Reschedule request approved successfully",
    });
  } catch (error) {
    console.error("Error approving reschedule request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
