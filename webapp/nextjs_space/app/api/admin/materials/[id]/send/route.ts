
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { generatePOEmailHTML, generatePOEmailText } from "@/lib/emails/po-email";
import { generatePOPDF } from "@/lib/po-pdf-generator";
import { sendEmail } from "@/lib/email-service";

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

// POST /api/admin/materials/[id]/send - Send PO via email
export async function POST(
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

    // Generate email content
    const emailHTML = generatePOEmailHTML({
      supplierName: order.supplier.name,
      poNumber: order.poNumber,
      total: order.total,
      expectedDelivery: order.expectedDelivery
        ? new Date(order.expectedDelivery).toLocaleDateString()
        : undefined,
      notes: order.notes || undefined,
    });

    const emailText = generatePOEmailText({
      supplierName: order.supplier.name,
      poNumber: order.poNumber,
      total: order.total,
      expectedDelivery: order.expectedDelivery
        ? new Date(order.expectedDelivery).toLocaleDateString()
        : undefined,
      notes: order.notes || undefined,
    });

    // Generate PDF attachment
    console.log("Generating PO PDF...");
    const pdfBuffer = await generatePOPDF(order);
    
    // Send email with PDF attachment
    console.log("Sending PO email to:", order.supplier.email);
    await sendEmail({
      to: order.supplier.email,
      subject: `Purchase Order ${order.poNumber} from Sun Direct Power`,
      html: emailHTML,
      attachments: [
        {
          filename: `${order.poNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
      leadId: order.job?.lead?.id,
      jobId: order.jobId || undefined,
      orderId: order.id,
      performedBy: typeof decoded === 'object' && decoded !== null && 'id' in decoded ? String(decoded.id) : 'system',
      trackingEnabled: false, // Don't track supplier emails
    });
    
    console.log("✅ PO sent successfully");

    // Update order status
    const updatedOrder = await prisma.materialOrder.update({
      where: { id: params.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        sentTo: order.supplier.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Purchase order sent successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error sending PO:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
