
import { NextRequest, NextResponse } from "next/server";
import { processOverdueJobs } from "@/lib/auto-assignment";

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job every hour
// In production, you can use Vercel Cron or an external service like cron-job.org

export async function GET(request: NextRequest) {
  try {
    // Optional: Add authentication header check for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Process overdue jobs
    const result = await processOverdueJobs();

    // Log results
    console.log("Auto-assignment cron job completed:", {
      timestamp: new Date().toISOString(),
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
    });

    // Return detailed results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
      },
      details: result.results,
    });
  } catch (error) {
    console.error("Auto-assignment cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
