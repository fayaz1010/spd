import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email-service';
import { sendSMS } from '@/lib/sms-service';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { message, type } = body; // type: 'email' or 'sms'

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get original communication
    const originalComm = await prisma.communication.findUnique({
      where: { id },
      include: {
        deal: {
          select: {
            id: true,
            lead: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!originalComm) {
      return NextResponse.json(
        { success: false, error: 'Communication not found' },
        { status: 404 }
      );
    }

    let result: any;

    // Send reply based on type
    if (type === 'email' || originalComm.type === 'EMAIL') {
      // Send email reply
      const subject = originalComm.subject?.startsWith('Re:') 
        ? originalComm.subject 
        : `Re: ${originalComm.subject || 'Your inquiry'}`;

      result = await sendEmail({
        to: originalComm.from,
        subject,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        dealId: originalComm.dealId,
        trackingEnabled: true,
      });

      if (result.success && result.communicationId) {
        // Update thread ID
        await prisma.communication.update({
          where: { id: result.communicationId },
          data: {
            threadId: originalComm.threadId || originalComm.id,
          },
        });
      }
    } else if (type === 'sms' || originalComm.type === 'SMS') {
      // Send SMS reply
      result = await sendSMS({
        to: originalComm.from,
        body: message,
        dealId: originalComm.dealId,
      });

      if (result.success && result.communicationId) {
        // Update thread ID
        await prisma.communication.update({
          where: { id: result.communicationId },
          data: {
            threadId: originalComm.threadId || originalComm.id,
          },
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid communication type' },
        { status: 400 }
      );
    }

    if (result.success) {
      // Mark original as replied
      await prisma.communication.update({
        where: { id },
        data: {
          repliedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        communicationId: result.communicationId,
        message: 'Reply sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send reply' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Reply error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}
