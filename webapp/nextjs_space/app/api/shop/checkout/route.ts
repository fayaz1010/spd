import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe
async function getStripe() {
  const apiSettings = await prisma.apiSettings.findFirst({
    where: { active: true },
  });

  if (!apiSettings?.stripeEnabled || !apiSettings?.stripeSecretKey) {
    throw new Error('Stripe is not configured');
  }

  return new Stripe(apiSettings.stripeSecretKey, {
    apiVersion: '2025-09-30.clover',
  });
}

// POST - Create checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, customerName, customerEmail, customerPhone, shippingAddress } = body;

    if (!sessionId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: 'Session ID, customer name, and email required' },
        { status: 400 }
      );
    }

    // Get cart
    const cart = await prisma.shopCart.findUnique({
      where: { sessionId },
    });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${nanoid(6).toUpperCase()}`;

    // Calculate totals
    const subtotal = cart.totalAmount;
    const tax = subtotal * 0.1; // 10% GST
    const shippingCost = subtotal >= 1000 ? 0 : 50; // Free shipping over $1000
    const totalAmount = subtotal + tax + shippingCost;

    // Create order
    const order = await prisma.shopOrder.create({
      data: {
        id: nanoid(),
        orderNumber,
        sessionId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        shippingAddress: shippingAddress || null,
        items: cart.items,
        subtotal,
        tax,
        shippingCost,
        totalAmount,
        status: 'PAYMENT_PENDING',
        paymentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create Stripe checkout session
    const stripe = await getStripe();
    
    const lineItems = (cart.items as any[]).map((item) => ({
      price_data: {
        currency: 'aud',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add shipping if applicable
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Shipping',
            description: 'Standard delivery',
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/shop?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        orderNumber,
        orderId: order.id,
      },
    });

    // Update order with Stripe session ID
    await prisma.shopOrder.update({
      where: { id: order.id },
      data: {
        stripeSessionId: stripeSession.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      checkoutUrl: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// GET - Get order status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('orderNumber');
    const stripeSessionId = searchParams.get('session_id');

    if (!orderNumber && !stripeSessionId) {
      return NextResponse.json(
        { error: 'Order number or Stripe session ID required' },
        { status: 400 }
      );
    }

    const order = await prisma.shopOrder.findFirst({
      where: orderNumber
        ? { orderNumber }
        : { stripeSessionId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If Stripe session ID provided, check payment status
    if (stripeSessionId && order.paymentStatus === 'pending') {
      try {
        const stripe = await getStripe();
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

        if (session.payment_status === 'paid') {
          // Update order
          await prisma.shopOrder.update({
            where: { id: order.id },
            data: {
              status: 'PAID',
              paymentStatus: 'paid',
              stripePaymentId: session.payment_intent as string,
              stripeCustomerId: session.customer as string,
              paymentCompletedAt: new Date(),
            },
          });

          // Clear cart
          if (order.sessionId) {
            await prisma.shopCart.delete({
              where: { sessionId: order.sessionId },
            }).catch(() => {});
          }

          return NextResponse.json({
            ...order,
            status: 'PAID',
            paymentStatus: 'paid',
            paymentCompletedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error checking Stripe session:', error);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
