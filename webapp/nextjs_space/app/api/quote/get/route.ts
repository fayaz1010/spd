
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const leadId = searchParams.get('leadId');
    const quoteId = searchParams.get('quoteId');

    let quote = null;

    if (quoteId) {
      quote = await prisma.customerQuote.findUnique({
        where: { id: quoteId },
      });
    } else if (sessionId) {
      quote = await prisma.customerQuote.findUnique({
        where: { sessionId },
      });
    } else if (leadId) {
      quote = await prisma.customerQuote.findUnique({
        where: { leadId },
      });
    }

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Update lastViewedAt
    await prisma.customerQuote.update({
      where: { id: quote.id },
      data: { lastViewedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
