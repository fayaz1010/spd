
import { NextRequest, NextResponse } from 'next/server';
import { getStripePublishableKey, isStripeEnabled } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint to get Stripe publishable key for client-side
 * No authentication required as publishable key is safe to expose
 */
export async function GET(request: NextRequest) {
  try {
    const enabled = await isStripeEnabled();
    
    if (!enabled) {
      return NextResponse.json({
        enabled: false,
        publishableKey: null,
      });
    }

    const publishableKey = await getStripePublishableKey();

    return NextResponse.json({
      enabled: true,
      publishableKey,
    });
  } catch (error: any) {
    console.error('Error fetching Stripe config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe configuration' },
      { status: 500 }
    );
  }
}
