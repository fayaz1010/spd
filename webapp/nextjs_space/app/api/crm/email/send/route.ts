import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { sendEmail, wrapEmailTemplate } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, dealId, leadId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Wrap email in template
    const html = wrapEmailTemplate(emailBody);

    // Send email
    const result = await sendEmail({
      to,
      cc,
      bcc,
      subject,
      html,
      dealId,
      leadId,
      performedBy: admin.id,
      trackingEnabled: true,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        communicationId: result.communicationId,
        trackingId: result.trackingId,
      });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
