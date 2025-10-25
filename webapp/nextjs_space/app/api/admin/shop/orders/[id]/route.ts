/**
 * Shop Order Detail API
 * Manage individual orders with inventory auto-update
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/orders/[id] - Get single order
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.shopOrder.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Parse items from JSON
    const items = order.items as any;

    return NextResponse.json({
      ...order,
      items,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/orders/[id] - Update order with inventory management
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      status,
      paymentStatus,
      trackingNumber,
      carrier,
      notes,
      shippedAt,
      deliveredAt,
      cancelledAt,
      cancellationReason,
    } = body;

    // Get current order
    const currentOrder = await prisma.shopOrder.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const oldStatus = currentOrder.status;
    const oldPaymentStatus = currentOrder.paymentStatus;
    const items = currentOrder.items as any[];

    // Update order
    const updatedOrder = await prisma.shopOrder.update({
      where: { id: params.id },
      data: {
        status,
        paymentStatus,
        trackingNumber,
        carrier,
        notes,
        shippedAt: shippedAt ? new Date(shippedAt) : currentOrder.shippedAt,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : currentOrder.deliveredAt,
        cancelledAt: cancelledAt ? new Date(cancelledAt) : currentOrder.cancelledAt,
        cancellationReason,
        updatedAt: new Date(),
      },
    });

    // INVENTORY AUTO-UPDATE LOGIC
    
    // Case 1: Order just got paid - Reduce inventory
    if (paymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
      await reduceInventory(items, params.id);
    }

    // Case 2: Order cancelled or refunded - Restore inventory
    if (
      (status === 'cancelled' && oldStatus !== 'cancelled') ||
      (paymentStatus === 'refunded' && oldPaymentStatus !== 'refunded')
    ) {
      await restoreInventory(items, params.id, status === 'cancelled' ? 'return' : 'refund');
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// Helper: Reduce inventory when order is paid
async function reduceInventory(items: any[], orderId: string) {
  for (const item of items) {
    // Check if item has shopProductId (some items might be from old system)
    const shopProductId = item.shopProductId || item.addonId;
    
    if (!shopProductId) continue;

    try {
      const shopProduct = await prisma.shopProduct.findUnique({
        where: { id: shopProductId },
      });

      if (shopProduct && shopProduct.trackInventory) {
        const newQty = Math.max(0, shopProduct.stockQty - item.quantity);

        // Update stock
        await prisma.shopProduct.update({
          where: { id: shopProductId },
          data: { stockQty: newQty },
        });

        // Log stock history
        await prisma.stockHistory.create({
          data: {
            shopProductId,
            previousQty: shopProduct.stockQty,
            newQty,
            change: -item.quantity,
            reason: 'sale',
            orderId,
            notes: `Order ${orderId} - ${item.name}`,
          },
        });

        console.log(`✅ Reduced stock for ${item.name}: ${shopProduct.stockQty} → ${newQty}`);
      }
    } catch (error) {
      console.error(`Error reducing inventory for ${item.name}:`, error);
    }
  }
}

// Helper: Restore inventory when order is cancelled/refunded
async function restoreInventory(items: any[], orderId: string, reason: string) {
  for (const item of items) {
    const shopProductId = item.shopProductId || item.addonId;
    
    if (!shopProductId) continue;

    try {
      const shopProduct = await prisma.shopProduct.findUnique({
        where: { id: shopProductId },
      });

      if (shopProduct && shopProduct.trackInventory) {
        const newQty = shopProduct.stockQty + item.quantity;

        // Update stock
        await prisma.shopProduct.update({
          where: { id: shopProductId },
          data: { stockQty: newQty },
        });

        // Log stock history
        await prisma.stockHistory.create({
          data: {
            shopProductId,
            previousQty: shopProduct.stockQty,
            newQty,
            change: item.quantity,
            reason,
            orderId,
            notes: `Order ${orderId} ${reason} - ${item.name}`,
          },
        });

        console.log(`✅ Restored stock for ${item.name}: ${shopProduct.stockQty} → ${newQty}`);
      }
    } catch (error) {
      console.error(`Error restoring inventory for ${item.name}:`, error);
    }
  }
}
