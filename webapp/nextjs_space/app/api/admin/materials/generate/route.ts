import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { autoGenerateOrders } from "@/lib/order-generator";

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

// POST /api/admin/materials/generate - Auto-generate material orders for a job
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId" },
        { status: 400 }
      );
    }

    // Verify job exists
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        lead: {
          select: {
            name: true,
            depositPaid: true,
          },
        },
        materialOrders: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if orders already exist
    if (job.materialOrders.length > 0) {
      return NextResponse.json(
        {
          error: "Material orders already exist for this job",
          existingOrders: job.materialOrders.length,
        },
        { status: 400 }
      );
    }

    // Check if deposit is paid (optional warning, not blocking)
    if (!job.lead.depositPaid) {
      console.warn(`⚠️ Generating orders for job ${job.jobNumber} without deposit paid`);
    }

    // Generate orders
    console.log(`🔄 Generating material orders for Job ${job.jobNumber}...`);
    const orderResult = await autoGenerateOrders(jobId);

    if (orderResult.success) {
      console.log(`✅ Material orders generated successfully`);
      console.log(`   • Total Orders: ${orderResult.summary.totalOrders}`);
      console.log(`   • Total Cost: $${orderResult.summary.totalCost.toFixed(2)}`);

      return NextResponse.json({
        success: true,
        message: `Successfully created ${orderResult.summary.totalOrders} material order(s)`,
        orders: orderResult.orders,
        summary: orderResult.summary,
      });
    } else {
      console.error(`❌ Failed to generate orders:`);
      for (const error of orderResult.errors) {
        console.error(`   • ${error}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate material orders",
          details: orderResult.errors,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error generating material orders:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
