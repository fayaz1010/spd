import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

/**
 * POST /api/stripe/create-payment-intent
 * Create a payment intent and process payment
 */
export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      paymentType,
      leadId,
      quoteReference,
      cardDetails,
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get Stripe secret key from settings
    const apiSettings = await prisma.apiSettings.findFirst();

    if (!apiSettings || !apiSettings.stripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(apiSettings.stripeSecretKey);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency: 'aud',
      description: `Solar System ${paymentType === 'deposit' ? 'Deposit' : 'Full Payment'} - ${quoteReference || 'N/A'}`,
      metadata: {
        leadId: leadId || '',
        quoteReference: quoteReference || '',
        paymentType,
      },
      payment_method_types: ['card'],
      confirm: false,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5123'}/confirmation?ref=${quoteReference}`,
    });

    if (paymentIntent.status === 'succeeded') {
      // Update lead with payment info
      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            paymentStatus: paymentType === 'deposit' ? 'deposit_paid' : 'paid_in_full',
            updatedAt: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
      });
    } else {
      return NextResponse.json(
        { error: 'Payment requires additional action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Payment failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
