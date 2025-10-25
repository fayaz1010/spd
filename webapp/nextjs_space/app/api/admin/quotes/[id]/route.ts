
/**
 * API Route: Admin Quote Detail & Status Update
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;

    const quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
      include: {
        lead: true,
      },
    });

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
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    const validStatuses = ['draft', 'sent', 'viewed', 'accepted', 'paid', 'expired'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update quote
    const updatedQuote = await prisma.customerQuote.update({
      where: { id: quoteId },
      data: {
        status: status || undefined,
        updatedAt: new Date(),
        lastViewedAt: status === 'viewed' ? new Date() : undefined,
      },
      include: {
        lead: true,
      },
    });

    // If status is changed to 'sent', update the lead status as well
    if (status === 'sent' && updatedQuote.leadId) {
      await prisma.lead.update({
        where: { id: updatedQuote.leadId },
        data: { status: 'quoted' },
      });
    }

    // If status is 'accepted', update lead status to 'won'
    if (status === 'accepted' && updatedQuote.leadId) {
      await prisma.lead.update({
        where: { id: updatedQuote.leadId },
        data: { status: 'won' },
      });
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
    });
  } catch (error: any) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote', details: error.message },
      { status: 500 }
    );
  }
}
