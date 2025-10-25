import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      phone,
      customerName,
      direction,
      duration,
      outcome,
      notes,
      followUpRequired,
      followUpDate,
      dealId,
      leadId,
    } = body;

    if (!phone || !outcome) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, outcome' },
        { status: 400 }
      );
    }

    // Format phone number
    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+61' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+61' + formattedPhone;
    }

    // Save to Communication table
    const communication = await prisma.communication.create({
      data: {
        dealId,
        type: 'CALL',
        direction: direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND',
        body: notes || `Call outcome: ${outcome}`,
        from: direction === 'INBOUND' ? formattedPhone : 'system',
        to: direction === 'OUTBOUND' ? formattedPhone : 'system',
        sentAt: new Date(),
      },
    });

    // Create activity log
    const activityType = direction === 'INBOUND' ? 'CALL_RECEIVED' : 'CALL_MADE';
    const activityDescription = `${direction === 'INBOUND' ? 'Received' : 'Made'} call ${
      customerName ? `with ${customerName}` : ''
    } (${formattedPhone}). Outcome: ${outcome}. ${duration ? `Duration: ${duration} min.` : ''}${
      notes ? ` Notes: ${notes}` : ''
    }`;

    const activityData: any = {
      type: activityType,
      description: activityDescription,
      performedBy: admin.id,
      duration: duration || null,
      outcome,
      completedAt: new Date(),
    };

    if (dealId) {
      activityData.dealId = dealId;
    }
    if (leadId) {
      activityData.leadId = leadId;
    }

    const activity = await prisma.activity.create({
      data: activityData,
    });

    // Create follow-up task if required
    let followUpTask = null;
    if (followUpRequired && followUpDate) {
      followUpTask = await prisma.activity.create({
        data: {
          dealId,
          leadId,
          type: 'TASK',
          description: `Follow-up call: ${notes || outcome}`,
          performedBy: admin.id,
          scheduledAt: new Date(followUpDate),
        },
      });
    }

    return NextResponse.json({
      success: true,
      communicationId: communication.id,
      activityId: activity.id,
      followUpTaskId: followUpTask?.id,
    });
  } catch (error: any) {
    console.error('Error logging call:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to log call' },
      { status: 500 }
    );
  }
}
