
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;

    // Try to find by ID or sessionId
    let quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      // Try finding by sessionId
      quote = await prisma.customerQuote.findUnique({
        where: { sessionId: quoteId },
      });
    }

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
