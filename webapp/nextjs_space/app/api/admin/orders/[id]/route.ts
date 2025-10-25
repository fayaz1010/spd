
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/[id]
 * Get a single order by ID
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

    const order = await prisma.materialOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        job: {
          include: {
            lead: true,
            team: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Update order status and details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      sentTo,
      expectedDelivery,
      deliveredAt,
      deliveryNotes,
      notes,
      // Delivery details
      deliveryAddress,
      deliveryContactName,
      deliveryContactPhone,
      deliveryTimeSlot,
      deliveryInstructions,
      trackingNumber,
      // Receipt confirmation
      receivedBy,
      receivedAt,
      receiptPhotos,
      receiptSignature,
      itemsReceived,
      // Issue tracking
      damageReported,
      damagePhotos,
      damageDescription,
      shortageReported,
      shortageItems,
    } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // Auto-set timestamps based on status
      if (status === 'SENT' && !updateData.sentAt) {
        updateData.sentAt = new Date();
        if (sentTo) {
          updateData.sentTo = sentTo;
        }
      }
      if (status === 'CONFIRMED' && !updateData.confirmedAt) {
        updateData.confirmedAt = new Date();
      }
      if (status === 'DELIVERED' && !updateData.deliveredAt) {
        updateData.deliveredAt = new Date();
      }
    }

    if (expectedDelivery) {
      updateData.expectedDelivery = new Date(expectedDelivery);
    }

    if (deliveredAt) {
      updateData.deliveredAt = new Date(deliveredAt);
    }

    if (deliveryNotes !== undefined) {
      updateData.deliveryNotes = deliveryNotes;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Delivery details
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
    if (deliveryContactName !== undefined) updateData.deliveryContactName = deliveryContactName;
    if (deliveryContactPhone !== undefined) updateData.deliveryContactPhone = deliveryContactPhone;
    if (deliveryTimeSlot !== undefined) updateData.deliveryTimeSlot = deliveryTimeSlot;
    if (deliveryInstructions !== undefined) updateData.deliveryInstructions = deliveryInstructions;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

    // Receipt confirmation
    if (receivedBy !== undefined) updateData.receivedBy = receivedBy;
    if (receivedAt !== undefined) updateData.receivedAt = new Date(receivedAt);
    if (receiptPhotos !== undefined) updateData.receiptPhotos = receiptPhotos;
    if (receiptSignature !== undefined) updateData.receiptSignature = receiptSignature;
    if (itemsReceived !== undefined) updateData.itemsReceived = itemsReceived;

    // Issue tracking
    if (damageReported !== undefined) updateData.damageReported = damageReported;
    if (damagePhotos !== undefined) updateData.damagePhotos = damagePhotos;
    if (damageDescription !== undefined) updateData.damageDescription = damageDescription;
    if (shortageReported !== undefined) updateData.shortageReported = shortageReported;
    if (shortageItems !== undefined) updateData.shortageItems = shortageItems;

    const order = await prisma.materialOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: true,
        job: {
          include: {
            lead: true,
          },
        },
      },
    });

    // Update job status if all orders are delivered
    if (status === 'DELIVERED') {
      await checkAndUpdateJobMaterialsStatus(order.jobId);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/orders/[id]
 * Cancel/delete an order
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by setting status to CANCELLED
    const order = await prisma.materialOrder.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}

/**
 * Check if all orders for a job are delivered and update job status
 */
async function checkAndUpdateJobMaterialsStatus(jobId: string) {
  const allOrders = await prisma.materialOrder.findMany({
    where: {
      jobId,
      status: { not: 'CANCELLED' },
    },
  });

  const allDelivered = allOrders.every((o) => o.status === 'DELIVERED');

  if (allDelivered && allOrders.length > 0) {
    await prisma.installationJob.update({
      where: { id: jobId },
      data: { status: 'MATERIALS_READY' },
    });
    console.log(`✅ Job ${jobId} materials are ready - all orders delivered`);
  }
}
