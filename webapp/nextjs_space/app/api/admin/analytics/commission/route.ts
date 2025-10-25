
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// GET /api/admin/analytics/commission - Get commission tracking data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const supplierId = searchParams.get('supplierId');

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get all material orders in period
    const where: any = {
      ...dateFilter,
      status: { in: ['DELIVERED', 'CONFIRMED', 'IN_TRANSIT'] }, // Only count confirmed orders
    };
    if (supplierId) {
      where.supplierId = supplierId;
    }

    const orders = await prisma.materialOrder.findMany({
      where,
      include: {
        supplier: true,
        job: true,
      },
    });

    // Get brand mappings for commission calculation
    const brandMappings = await prisma.brandSupplier.findMany({
      where: supplierId ? { supplierProduct: { supplierId } } : {},
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
        panelBrand: true,
        batteryBrand: true,
        inverterBrand: true,
      },
    });

    // Calculate commission by supplier
    const commissionBySupplier: { [key: string]: any } = {};

    for (const order of orders) {
      const supplier = order.supplier;
      if (!commissionBySupplier[supplier.id]) {
        commissionBySupplier[supplier.id] = {
          supplierId: supplier.id,
          supplierName: supplier.name,
          totalOrders: 0,
          totalOrderValue: 0,
          totalCommission: 0,
          orders: [],
        };
      }

      const supplierData = commissionBySupplier[supplier.id];
      supplierData.totalOrders++;
      supplierData.totalOrderValue += order.total || 0;

      // Calculate commission for this order's items
      const items = order.items as any[] || [];
      for (const item of items) {
        // Find matching brand mapping
        const mapping = brandMappings.find(
          (m) =>
            m.supplierProduct.brand === item.brand &&
            m.supplierProduct.model === item.model
        );

        if (mapping) {
          let commission = 0;
          if (mapping.commissionType === 'percentage') {
            commission = (item.unitCost * item.quantity * mapping.ourCommission) / 100;
          } else {
            commission = mapping.ourCommission * item.quantity;
          }
          supplierData.totalCommission += commission;
        }
      }

      supplierData.orders.push({
        orderId: order.id,
        orderNumber: order.poNumber,
        createdAt: order.createdAt,
        totalCost: order.total,
        status: order.status,
      });
    }

    // Convert to array and sort by total commission
    const commissionData = Object.values(commissionBySupplier).sort(
      (a: any, b: any) => b.totalCommission - a.totalCommission
    );

    // Calculate totals
    const totals = {
      totalOrders: orders.length,
      totalOrderValue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      totalCommission: commissionData.reduce(
        (sum: number, s: any) => sum + s.totalCommission,
        0
      ),
      avgCommissionPerOrder:
        orders.length > 0
          ? commissionData.reduce((sum: number, s: any) => sum + s.totalCommission, 0) /
            orders.length
          : 0,
    };

    return NextResponse.json({
      commissionData,
      totals,
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'all time',
      },
    });
  } catch (error) {
    console.error('Error fetching commission data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commission data' },
      { status: 500 }
    );
  }
}
