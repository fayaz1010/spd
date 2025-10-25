
/**
 * API endpoint to check for previous quotes by address
 * 
 * This helps identify returning customers and avoid duplicate quotes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Normalize address for comparison (lowercase, trim spaces)
    const normalizedAddress = address.toLowerCase().trim();

    // Find previous leads with similar addresses
    const previousLeads = await prisma.lead.findMany({
      where: {
        address: {
          contains: normalizedAddress,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        quoteReference: true,
        createdAt: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        systemSizeKw: true,
        batterySizeKwh: true,
        quarterlyBill: true,
        depositPaid: true,
        marketingSegment: true,
        quoteData: true,
      },
    });

    if (previousLeads.length === 0) {
      return NextResponse.json({
        hasPreviousQuote: false,
        message: 'No previous quotes found for this address',
      });
    }

    // Return the most recent quote
    const mostRecent = previousLeads[0];
    const daysSinceQuote = Math.floor(
      (Date.now() - new Date(mostRecent.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      hasPreviousQuote: true,
      previousQuote: {
        reference: mostRecent.quoteReference,
        date: mostRecent.createdAt,
        daysSince: daysSinceQuote,
        name: mostRecent.name,
        email: mostRecent.email,
        phone: mostRecent.phone,
        status: mostRecent.status,
        systemSize: mostRecent.systemSizeKw,
        batterySize: mostRecent.batterySizeKwh,
        quarterlyBill: mostRecent.quarterlyBill,
        depositPaid: mostRecent.depositPaid,
        segment: mostRecent.marketingSegment,
        quoteData: mostRecent.quoteData,
      },
      totalQuotes: previousLeads.length,
      allQuotes: previousLeads.map(lead => ({
        reference: lead.quoteReference,
        date: lead.createdAt,
        status: lead.status,
      })),
    });
  } catch (error: any) {
    console.error('Error checking previous quotes:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to check previous quotes' },
      { status: 500 }
    );
  }
}
