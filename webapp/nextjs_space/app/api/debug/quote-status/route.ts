import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('quoteId');

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId required' }, { status: 400 });
    }

    const quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
      select: {
        id: true,
        status: true,
        signedAt: true,
        customerSignature: true,
      }
    });

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
