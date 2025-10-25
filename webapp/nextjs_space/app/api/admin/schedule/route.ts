import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-admin";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/schedule
 * Fetch schedule data for deliveries and installations
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const teamId = searchParams.get("teamId");
    const status = searchParams.get("status");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Date range (from, to) is required" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // End of day

    // Build where clause
    const where: any = {
      OR: [
        {
          scheduledDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          deliveryDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
        {
          installationDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
      ],
    };

    // Filter by team or subcontractor if specified
    if (teamId && teamId !== "all") {
      // Check if it's a subcontractor filter (starts with "sub_")
      if (teamId.startsWith("sub_")) {
        const subcontractorId = teamId.replace("sub_", "");
        where.subcontractorId = subcontractorId;
      } else {
        where.teamId = teamId;
      }
    }

    // Filter by status if specified
    if (status && status !== "all") {
      where.status = status;
    }

    // Fetch jobs
    const jobs = await prisma.installationJob.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subcontractor: {
          select: {
            companyName: true,
          },
        },
        lead: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: "asc" },
        { deliveryDate: "asc" },
        { installationDate: "asc" },
      ],
    });

    // Fetch all teams for filter dropdown
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        color: true,
      },
      orderBy: { name: "asc" },
    });

    // Format jobs
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      status: job.status,
      scheduledDate: job.scheduledDate,
      deliveryDate: job.deliveryDate,
      installationDate: job.installationDate,
      systemSize: job.systemSize,
      teamId: job.teamId,
      teamName: job.team?.name || null,
      teamColor: job.team?.color || null,
      subcontractorName: job.subcontractor?.companyName || null,
      customer: {
        name: job.lead.name || "Unknown",
        email: job.lead.email,
        phone: job.lead.phone || null,
        address: job.lead.address || null,
      },
    }));

    // Separate deliveries and installations
    const deliveries = formattedJobs.filter((job) => job.deliveryDate);
    const installations = formattedJobs.filter(
      (job) => job.installationDate || job.scheduledDate
    );

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      deliveries,
      installations,
      teams,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching schedule data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch schedule data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
