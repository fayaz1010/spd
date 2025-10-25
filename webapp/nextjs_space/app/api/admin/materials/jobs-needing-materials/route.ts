
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const dynamic = 'force-dynamic';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// GET /api/admin/materials/jobs-needing-materials
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all jobs that are scheduled but don't have material orders
    const jobs = await prisma.installationJob.findMany({
      where: {
        status: {
          in: ["PENDING_SCHEDULE", "SCHEDULED"],
        },
        materialOrders: {
          none: {},
        },
      },
      include: {
        lead: {
          select: {
            name: true,
            email: true,
            address: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs needing materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
