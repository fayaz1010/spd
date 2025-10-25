import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create initial quote record immediately after Step 1 (address entry)
 * This ensures all data is tracked from the beginning
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      address,
      propertyType,
      roofType,
      latitude,
      longitude,
      suburb,
    } = body;

    if (!sessionId || !address) {
      return NextResponse.json(
        { error: 'Session ID and address are required' },
        { status: 400 }
      );
    }

    // Check if quote already exists for this session
    const existingQuote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (existingQuote) {
      // Update existing quote
      const updated = await prisma.customerQuote.update({
        where: { sessionId },
        data: {
          address,
          propertyType,
          roofType,
          latitude,
          longitude,
          suburb,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        quoteId: updated.id,
        quoteReference: updated.quoteReference,
      });
    }

    // Generate unique quote reference
    const quoteReference = `SQ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create new quote
    const quote = await prisma.customerQuote.create({
      data: {
        id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        quoteReference,
        address,
        propertyType,
        roofType,
        latitude,
        longitude,
        suburb,
        status: 'draft',
        // Initialize with default values
        householdSize: 4,
        hasEv: false,
        hasPool: false,
        homeOffices: 0,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created initial quote: ${quoteReference} for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      quoteReference: quote.quoteReference,
    });

  } catch (error: any) {
    console.error('Error creating initial quote:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to create quote' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
