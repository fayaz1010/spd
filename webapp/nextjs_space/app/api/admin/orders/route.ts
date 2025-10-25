
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * Fetch all material orders with filters
 */
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');
    const jobId = searchParams.get('jobId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const orders = await prisma.materialOrder.findMany({
      where,
      include: {
        supplier: true,
        job: {
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                quoteReference: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary statistics
    const summary = {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, order) => sum + order.total, 0),
      byStatus: {
        DRAFT: orders.filter((o) => o.status === 'DRAFT').length,
        PENDING_REVIEW: orders.filter((o) => o.status === 'PENDING_REVIEW')
          .length,
        SENT: orders.filter((o) => o.status === 'SENT').length,
        CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
        IN_TRANSIT: orders.filter((o) => o.status === 'IN_TRANSIT').length,
        DELIVERED: orders.filter((o) => o.status === 'DELIVERED').length,
        CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
      },
      bySupplier: {} as Record<string, { name: string; count: number; total: number }>,
    };

    // Group by supplier
    orders.forEach((order) => {
      const supplierId = order.supplierId;
      if (!summary.bySupplier[supplierId]) {
        summary.bySupplier[supplierId] = {
          name: order.supplier.name,
          count: 0,
          total: 0,
        };
      }
      summary.bySupplier[supplierId].count++;
      summary.bySupplier[supplierId].total += order.total;
    });

    return NextResponse.json({
      orders,
      summary,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/orders
 * Create a new material order manually
 */
export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobId,
      supplierId,
      items,
      subtotal,
      tax,
      total,
      notes,
      expectedDelivery,
    } = body;

    // Validate required fields
    if (!jobId || !supplierId || !items || !subtotal || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate PO number
    const poNumber = await generatePONumber();

    const order = await prisma.materialOrder.create({
      data: {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId,
        supplierId,
        poNumber,
        items: items as any,
        subtotal,
        tax: tax || 0,
        total,
        notes,
        status: 'DRAFT',
        expectedDelivery: expectedDelivery
          ? new Date(expectedDelivery)
          : undefined,
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

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

async function generatePONumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const todayOrders = await prisma.materialOrder.findMany({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: {
      poNumber: 'desc',
    },
    take: 1,
  });

  let sequence = 1;
  if (todayOrders.length > 0) {
    const lastPO = todayOrders[0].poNumber;
    const lastSequence = parseInt(lastPO.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }

  return `PO-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}
