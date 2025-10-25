
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Get query parameters for filters
    const { searchParams } = new URL(request.url);
    const teamIds = searchParams.get("teamIds")?.split(",").filter(Boolean);
    const statuses = searchParams.get("statuses")?.split(",").filter(Boolean);

    // Fetch teams with their zones
    const teamsWhere: any = { isActive: true };
    if (teamIds && teamIds.length > 0) {
      teamsWhere.id = { in: teamIds };
    }

    const teams = await prisma.team.findMany({
      where: teamsWhere,
      select: {
        id: true,
        name: true,
        color: true,
        serviceAreaGeoJSON: true,
        serviceSuburbs: true,
      },
    });

    // Fetch jobs with location data
    const jobsWhere: any = {
      siteLatitude: { not: null },
      siteLongitude: { not: null },
      status: {
        notIn: ["CANCELLED"],
      },
    };

    if (teamIds && teamIds.length > 0) {
      jobsWhere.OR = [
        { teamId: { in: teamIds } },
        { subcontractorId: { not: null } },
      ];
    }

    if (statuses && statuses.length > 0) {
      jobsWhere.status = { in: statuses };
    }

    const jobs = await prisma.installationJob.findMany({
      where: jobsWhere,
      include: {
        team: {
          select: {
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
    });

    // Format response
    return NextResponse.json({
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        color: team.color,
        serviceAreaGeoJSON: team.serviceAreaGeoJSON,
        serviceSuburbs: team.serviceSuburbs,
      })),
      jobs: jobs.map((job) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        status: job.status,
        latitude: job.siteLatitude,
        longitude: job.siteLongitude,
        suburb: job.siteSuburb,
        scheduledDate: job.scheduledDate,
        systemSize: job.systemSize,
        teamId: job.teamId,
        teamName: job.team?.name,
        teamColor: job.team?.color,
        subcontractorId: job.subcontractorId,
        subcontractorName: job.subcontractor?.companyName,
        customer: {
          name: job.lead.name || "Unknown",
          email: job.lead.email,
          phone: job.lead.phone || null,
          address: job.lead.address || null,
        },
      })),
    });
  } catch (error) {
    console.error("Operations map data error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch operations map data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
