import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/settings/stripe-key
 * Get Stripe publishable key from settings
 */
export async function GET(request: NextRequest) {
  try {
    // Get the active API settings
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings || !settings.stripePublishableKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      publicKey: settings.stripePublishableKey,
    });
  } catch (error: any) {
    console.error('Error fetching Stripe key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
