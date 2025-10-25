
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

// GET /api/admin/materials - List all material orders
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const orders = await prisma.materialOrder.findMany({
      where,
      include: {
        supplier: true,
        job: {
          include: {
            lead: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching material orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/materials - Create a new material order manually
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, supplierId, items, notes, subtotal, tax, total } = body;

    if (!jobId || !supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify job exists
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    // Generate PO number
    const year = new Date().getFullYear();
    const count = await prisma.materialOrder.count();
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

    // Create material order
    const order = await prisma.materialOrder.create({
      data: {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId,
        supplierId,
        poNumber,
        items: items as any,
        subtotal,
        tax,
        total,
        status: "DRAFT",
        notes,
        updatedAt: new Date(),
      },
      include: {
        supplier: true,
        job: {
          include: {
            lead: true,
          },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating material order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
