import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import { updateSMSStatus } from '@/lib/sms-service';

const prisma = new PrismaClient();

// Verify Twilio webhook signature
async function verifyTwilioSignature(request: NextRequest): Promise<boolean> {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) return false;

    const signature = request.headers.get('x-twilio-signature');
    if (!signature) return false;

    const url = request.url;
    const body = await request.text();
    const params = new URLSearchParams(body);
    const twilioParams: Record<string, string> = {};
    
    params.forEach((value, key) => {
      twilioParams[key] = value;
    });

    return twilio.validateRequest(authToken, signature, url, twilioParams);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const {
      MessageSid,
      MessageStatus,
      From,
      To,
      Body,
      ErrorCode,
      ErrorMessage,
    } = data;

    console.log('Twilio webhook received:', {
      MessageSid,
      MessageStatus,
      From,
      To,
    });

    // Handle status updates
    if (MessageSid && MessageStatus) {
      await updateSMSStatus(
        MessageSid,
        MessageStatus,
        ErrorCode,
        ErrorMessage
      );
    }

    // Handle incoming SMS (replies)
    if (MessageStatus === 'received' && From && Body) {
      await handleIncomingSMS(From, To, Body, MessageSid);
    }

    // Respond with TwiML (required by Twilio)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return success to Twilio to avoid retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );
  }
}

// Handle incoming SMS replies
async function handleIncomingSMS(
  from: string,
  to: string,
  body: string,
  messageSid: string
): Promise<void> {
  try {
    // Find the most recent outbound SMS to this number
    const recentCommunication = await prisma.communication.findFirst({
      where: {
        type: 'SMS',
        direction: 'OUTBOUND',
        to: from,
      },
      orderBy: {
        sentAt: 'desc',
      },
      select: {
        dealId: true,
        threadId: true,
      },
    });

    if (recentCommunication) {
      // Save incoming SMS
      const communication = await prisma.communication.create({
        data: {
          dealId: recentCommunication.dealId,
          type: 'SMS',
          direction: 'INBOUND',
          body,
          from,
          to,
          messageId: messageSid,
          threadId: recentCommunication.threadId || undefined,
          sentAt: new Date(),
          deliveredAt: new Date(),
          repliedAt: new Date(),
        },
      });

      // Update the original message's repliedAt
      if (recentCommunication.threadId) {
        await prisma.communication.updateMany({
          where: {
            threadId: recentCommunication.threadId,
            direction: 'OUTBOUND',
          },
          data: {
            repliedAt: new Date(),
          },
        });
      }

      // Log activity
      await prisma.activity.create({
        data: {
          dealId: recentCommunication.dealId,
          type: 'NOTE_ADDED',
          title: 'SMS reply received',
          description: `Customer replied via SMS: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`,
          performedBy: 'system',
          completedAt: new Date(),
        },
      });

      console.log('Incoming SMS saved:', communication.id);
    } else {
      console.log('No matching outbound SMS found for:', from);
    }
  } catch (error) {
    console.error('Failed to handle incoming SMS:', error);
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Twilio webhook endpoint is active',
  });
}
