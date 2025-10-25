
import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, paymentType } = body; // paymentType: 'deposit' or 'full'

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Get Stripe instance
    const stripe = await getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Get payment settings for deposit percentage
    const paymentSettings = await prisma.paymentSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = (lead.quoteData as any)?.totalCost || 0;
    
    // Calculate amount based on payment type
    let amount: number;
    let description: string;
    
    if (paymentType === 'deposit') {
      const depositPercentage = paymentSettings?.depositPercentage || 10;
      amount = Math.round((totalCost * depositPercentage) / 100);
      description = `Deposit (${depositPercentage}%) for Solar System - Quote ${lead.quoteReference}`;
    } else {
      amount = Math.round(totalCost);
      description = `Full Payment for Solar System - Quote ${lead.quoteReference}`;
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Create or get Stripe customer
    let customerId = lead.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        metadata: {
          leadId: lead.id,
          quoteReference: lead.quoteReference,
        },
      });
      customerId = customer.id;
      
      // Update lead with customer ID
      await prisma.lead.update({
        where: { id: leadId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: description,
              description: `${lead.systemSizeKw}kW Solar + ${lead.batterySizeKwh}kWh Battery`,
              images: [], // You can add product images here
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}&ref=${lead.quoteReference}`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/confirmation?ref=${lead.quoteReference}&data=${encodeURIComponent(JSON.stringify(lead.quoteData))}`,
      metadata: {
        leadId: lead.id,
        quoteReference: lead.quoteReference,
        paymentType,
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    });

    // Update lead with session ID
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stripeSessionId: session.id,
        paymentMethod: paymentType,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout session creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
