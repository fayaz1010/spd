
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/analytics/performance - Get supplier performance metrics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (startDate && endDate) {
      where.periodStart = { gte: new Date(startDate) };
      where.periodEnd = { lte: new Date(endDate) };
    }

    const performances = await prisma.supplierPerformance.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: {
        periodStart: 'desc',
      },
    });

    return NextResponse.json({ performances });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/analytics/performance - Calculate and store performance metrics
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierId, periodStart, periodEnd } = body;

    if (!supplierId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'supplierId, periodStart, and periodEnd are required' },
        { status: 400 }
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    // Get all orders for this supplier in the period
    const orders = await prisma.materialOrder.findMany({
      where: {
        supplierId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        job: true,
      },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    
    const totalOrderValue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalOrderValue / totalOrders : 0;

    // Calculate commission from brand mappings
    const brandMappings = await prisma.brandSupplier.findMany({
      where: {
        supplierProduct: {
          supplierId,
        },
      },
    });
    
    const totalCommission = brandMappings.reduce((sum, m) => {
      if (m.commissionType === 'percentage') {
        // Estimate based on average order value
        return sum + (avgOrderValue * m.ourCommission / 100);
      }
      return sum + m.ourCommission;
    }, 0);

    // Calculate delivery performance
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
    const onTimeDeliveries = deliveredOrders.filter((o) => {
      if (!o.expectedDelivery || !o.deliveredAt) return false;
      return o.deliveredAt <= o.expectedDelivery;
    }).length;
    const lateDeliveries = deliveredOrders.length - onTimeDeliveries;

    // Calculate average lead time
    const leadTimes = deliveredOrders
      .filter((o) => o.deliveredAt && o.createdAt)
      .map((o) => {
        const diff = o.deliveredAt!.getTime() - o.createdAt.getTime();
        return diff / (1000 * 60 * 60 * 24); // Convert to days
      });
    const avgLeadTimeDays = leadTimes.length > 0
      ? leadTimes.reduce((sum, t) => sum + t, 0) / leadTimes.length
      : null;

    // Calculate performance score (0-100)
    let performanceScore = 0;
    if (totalOrders > 0) {
      const completionRate = (completedOrders / totalOrders) * 30; // 30 points
      const onTimeRate = deliveredOrders.length > 0
        ? (onTimeDeliveries / deliveredOrders.length) * 40 // 40 points
        : 0;
      const cancellationPenalty = (cancelledOrders / totalOrders) * -20; // -20 points
      const commissionBonus = Math.min((totalCommission / totalOrderValue) * 30, 30); // 30 points max

      performanceScore = Math.max(0, Math.min(100, 
        completionRate + onTimeRate + cancellationPenalty + commissionBonus
      ));
    }

    // Create or update performance record
    const performance = await prisma.supplierPerformance.upsert({
      where: {
        supplierId_periodStart_periodEnd: {
          supplierId,
          periodStart: start,
          periodEnd: end,
        },
      },
      create: {
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        supplierId,
        periodStart: start,
        periodEnd: end,
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalOrderValue,
        totalCommission,
        avgOrderValue,
        onTimeDeliveries,
        lateDeliveries,
        avgLeadTimeDays,
        performanceScore,
        updatedAt: new Date(),
      },
      update: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalOrderValue,
        totalCommission,
        avgOrderValue,
        onTimeDeliveries,
        lateDeliveries,
        avgLeadTimeDays,
        performanceScore,
      },
    });

    return NextResponse.json({
      success: true,
      performance,
    });
  } catch (error) {
    console.error('Error calculating performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate performance metrics' },
      { status: 500 }
    );
  }
}
