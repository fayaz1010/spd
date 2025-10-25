import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message, source } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if lead already exists
    let lead = await prisma.lead.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (lead) {
      // Update existing lead
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: name || lead.name,
          phone: phone || lead.phone,
          lastContactAt: new Date(),
        },
      });

      // Log chatbot interaction
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE_ADDED',
          description: `Chatbot conversation: ${message || 'Quote request'}`,
          performedBy: 'chatbot',
          completedAt: new Date(),
        },
      });
    } else {
      // Create new lead
      lead = await prisma.lead.create({
        data: {
          name: name || 'Chatbot Lead',
          email: email.toLowerCase(),
          phone: phone || '',
          source: source || 'CHATBOT',
          status: 'NEW',
          priority: 'MEDIUM',
          lastContactAt: new Date(),
        },
      });

      // Log initial contact
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: 'NOTE_ADDED',
          description: `New lead from chatbot: ${message || 'Interested in solar quote'}`,
          performedBy: 'chatbot',
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: 'Lead captured successfully',
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
