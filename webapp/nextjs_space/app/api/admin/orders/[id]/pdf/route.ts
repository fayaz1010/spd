import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { generatePOPDF } from '@/lib/po-pdf-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/[id]/pdf
 * Generate and download PO PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch order with all details
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generatePOPDF(order);

    // Return PDF as download
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PO-${order.poNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
