/**
 * API Route: Update Lead Status
 * Updates lead status based on payment and progress
 * Status progression: potential → confirmed → sale → job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      leadId,
      status,
      depositPaid,
      depositAmount,
      paymentMethod,
      paymentStatus,
      stripePaymentId,
      stripeSessionId,
      stripeCustomerId,
    } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId is required' },
        { status: 400 }
      );
    }

    // Determine lead type and status based on payment
    let leadType = 'confirmed';
    let leadStatus = 'contacted';

    if (depositPaid && paymentStatus === 'completed') {
      leadType = 'sale'; // Deposit paid = Sale
      leadStatus = 'deposit_paid';
    }

    if (paymentStatus === 'completed' && !depositPaid) {
      // Full payment completed = Job
      leadType = 'job';
      leadStatus = 'paid_in_full';
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        leadType,
        status: status || leadStatus,
        depositPaid: depositPaid || false,
        depositAmount: depositAmount || null,
        paymentMethod: paymentMethod || null,
        paymentStatus: paymentStatus || 'pending',
        stripePaymentId: stripePaymentId || null,
        stripeSessionId: stripeSessionId || null,
        stripeCustomerId: stripeCustomerId || null,
        paymentCompletedAt: paymentStatus === 'completed' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: `Lead status updated to ${leadType}`,
    });
  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'Failed to update lead status', details: error.message },
      { status: 500 }
    );
  }
}
