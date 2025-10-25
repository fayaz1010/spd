
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { autoAssignJob } from "@/lib/auto-assignment";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key-here';

    try {
      jwt.verify(token, secret);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const jobId = params.id;

    // Attempt auto-assignment
    const result = await autoAssignJob(jobId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        assignedTeam: result.assignedTeam,
        scheduledDate: result.scheduledDate,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Auto-assign job error:", error);
    return NextResponse.json(
      {
        error: "Failed to auto-assign job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
