import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Parse email (format depends on email service - SendGrid, Mailgun, etc.)
    const { from, subject, text, html } = body;

    // Extract email and name
    const emailMatch = from.match(/<(.+)>/);
    const email = emailMatch ? emailMatch[1] : from;
    const nameMatch = from.match(/^(.+?)\s*</);
    const name = nameMatch ? nameMatch[1].trim() : email;

    // Extract phone from email body (if present)
    const phoneMatch = text?.match(/(?:phone|mobile|tel)[\s:]+(\d[\d\s-]+)/i);
    const phone = phoneMatch ? phoneMatch[1].replace(/[^\d]/g, '') : '';

    // Create lead
    await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        address: 'TBD',
        leadSource: 'email',
        leadSourceDetails: `Subject: ${subject}`,
        initialNotes: text || html,
        status: 'new',
        systemSizeKw: 0,
        numPanels: 0,
        quoteData: {},
        quoteReference: `EMAIL-${Date.now()}`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email webhook error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
