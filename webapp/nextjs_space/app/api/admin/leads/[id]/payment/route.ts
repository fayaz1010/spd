import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/leads/[id]/payment
 * Update payment details for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;
    const body = await request.json();

    const {
      depositPaid,
      depositAmount,
      depositPaidAt,
      depositReceiptUrl,
      depositPaymentMethod,
      depositTransactionRef,
      finalPaid,
      finalAmount,
      finalPaidAt,
      finalReceiptUrl,
      finalPaymentMethod,
      finalTransactionRef
    } = body;

    // Update lead with payment details
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        depositPaid: depositPaid || false,
        depositAmount: depositAmount || 0,
        depositPaidAt: depositPaidAt ? new Date(depositPaidAt) : null,
        depositReceiptUrl: depositReceiptUrl || null,
        depositPaymentMethod: depositPaymentMethod || null,
        depositTransactionRef: depositTransactionRef || null,
        finalPaid: finalPaid || false,
        finalAmount: finalAmount || 0,
        finalPaidAt: finalPaidAt ? new Date(finalPaidAt) : null,
        finalReceiptUrl: finalReceiptUrl || null,
        finalPaymentMethod: finalPaymentMethod || null,
        finalTransactionRef: finalTransactionRef || null,
        updatedAt: new Date()
      }
    });

    // Create activity log
    const paymentStatus = depositPaid && finalPaid ? 'Fully Paid' : depositPaid ? 'Deposit Paid' : 'Payment Updated';
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'payment',
        description: `Payment updated: ${paymentStatus}`,
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      lead
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error updating payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update payment',
        details: error.message
      },
      { status: 500 }
    );
  }
}
