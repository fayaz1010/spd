
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
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// PUT /api/admin/materials/[id]/status - Update material order status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const validStatuses = [
      "DRAFT",
      "PENDING_REVIEW",
      "SENT",
      "CONFIRMED",
      "IN_TRANSIT",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: any = {
      status,
    };

    // Set timestamps based on status
    if (status === "SENT") {
      updateData.sentAt = new Date();
    } else if (status === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    } else if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();

      // Also update job status to MATERIALS_READY
      const order = await prisma.materialOrder.findUnique({
        where: { id: params.id },
        select: { jobId: true },
      });

      if (order) {
        await prisma.installationJob.update({
          where: { id: order.jobId },
          data: {
            status: "MATERIALS_READY",
          },
        });
      }
    }

    const materialOrder = await prisma.materialOrder.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(materialOrder);
  } catch (error) {
    console.error("Error updating material order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
