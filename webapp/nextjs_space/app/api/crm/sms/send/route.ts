import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, message, dealId, leadId } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Get Twilio settings
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings?.twilioEnabled || !settings.twilioAccountSid || !settings.twilioAuthToken) {
      return NextResponse.json(
        { error: 'Twilio is not configured. Please configure in API settings.' },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

    // Format phone number (ensure it starts with +61 for Australia)
    let formattedTo = to.replace(/\s/g, '');
    if (formattedTo.startsWith('0')) {
      formattedTo = '+61' + formattedTo.substring(1);
    } else if (!formattedTo.startsWith('+')) {
      formattedTo = '+61' + formattedTo;
    }

    // Send SMS via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: settings.twilioPhoneNumber,
      to: formattedTo,
    });

    // Save to Communication table
    const communication = await prisma.communication.create({
      data: {
        dealId,
        type: 'SMS',
        direction: 'OUTBOUND',
        body: message,
        from: settings.twilioPhoneNumber || 'system',
        to: formattedTo,
        messageId: twilioMessage.sid,
        sentAt: new Date(),
      },
    });

    // Create activity log
    const activityData: any = {
      type: 'NOTE_ADDED', // SMS activities logged as notes
      description: `SMS sent to ${formattedTo}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      performedBy: admin.id,
      completedAt: new Date(),
    };

    if (dealId) {
      activityData.dealId = dealId;
    }
    if (leadId) {
      activityData.leadId = leadId;
    }

    await prisma.activity.create({
      data: activityData,
    });

    return NextResponse.json({
      success: true,
      communicationId: communication.id,
      messageId: twilioMessage.sid,
      status: twilioMessage.status,
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
    // Handle Twilio-specific errors
    if (error.code) {
      return NextResponse.json(
        { error: `Twilio error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
