
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const quote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!quote) {
      return NextResponse.json({
        success: true,
        found: false,
        quote: null,
      });
    }

    return NextResponse.json({
      success: true,
      found: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error fetching quote by session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
