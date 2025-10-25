import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { generatePOPDF } from "@/lib/po-pdf-generator";

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

// GET /api/admin/materials/[id]/pdf - Generate and download PO PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get material order with all details
    const order = await prisma.materialOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        job: {
          include: {
            lead: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Material order not found" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePOPDF(order);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${order.poNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PO PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
