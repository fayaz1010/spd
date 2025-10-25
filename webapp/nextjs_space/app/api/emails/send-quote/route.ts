import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import { quoteConfirmationEmail } from '@/lib/email-templates';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, customerEmail } = body;

    if (!quoteId || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch quote details
    const quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
      include: {
        lead: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Generate email content
    const emailHtml = quoteConfirmationEmail({
      customerName: quote.lead?.name || 'Valued Customer',
      quoteReference: quote.quoteReference || quoteId,
      systemSize: quote.systemSizeKw || 0,
      totalCost: quote.totalCostAfterRebates || 0,
      annualSavings: quote.annualSavings || 0,
      quoteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/confirmation?quoteId=${quoteId}`,
    });

    // Send email
    const sent = await sendEmail({
      to: customerEmail,
      subject: `Your Solar Quote is Ready - ${quote.quoteReference || quoteId}`,
      html: emailHtml,
    });

    if (sent) {
      // Log email sent (optional - add EmailLog model)
      return NextResponse.json({
        success: true,
        message: 'Quote email sent successfully',
      });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
