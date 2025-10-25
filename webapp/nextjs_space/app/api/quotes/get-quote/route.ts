import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET endpoint to retrieve quote by sessionId
 * Used by customization page to load saved quote and products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get quote from database
    const quote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Retrieved quote for session: ${sessionId}`);
    console.log(`   Package: ${quote.selectedPackageName}`);
    console.log(`   Panel Product: ${quote.finalPanelProductId}`);
    console.log(`   Battery Product: ${quote.finalBatteryProductId}`);
    console.log(`   Inverter Product: ${quote.finalInverterProductId}`);

    return NextResponse.json({
      success: true,
      quote,
    });

  } catch (error: any) {
    console.error('Error retrieving quote:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quote', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
