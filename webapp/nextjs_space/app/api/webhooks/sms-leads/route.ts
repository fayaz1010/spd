import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    // Check if lead already exists with this phone
    const existing = await prisma.lead.findFirst({
      where: { phone: from },
    });

    if (existing) {
      // Add as activity
      await prisma.activity.create({
        data: {
          leadId: existing.id,
          type: 'sms',
          direction: 'inbound',
          description: body,
          createdBy: 'system',
        },
      });
    } else {
      // Create new lead
      await prisma.lead.create({
        data: {
          name: 'SMS Lead',
          phone: from,
          email: '',
          address: 'TBD',
          leadSource: 'sms',
          initialNotes: body,
          status: 'new',
          systemSizeKw: 0,
          numPanels: 0,
          quoteData: {},
          quoteReference: `SMS-${Date.now()}`,
          updatedAt: new Date(),
        },
      });
    }

    // Send auto-reply (Twilio TwiML format)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>Thanks for contacting Sun Direct Power! We'll get back to you shortly.</Message>
      </Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json({ error: 'Failed to process SMS' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
