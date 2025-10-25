import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';
import { sendEmail, wrapEmailTemplate } from '@/lib/email-service';
import { updateDealStage } from '@/lib/crm-auto-deal';

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { leadId, quoteId, customerEmail, customerName } = body;

    if (!leadId || !quoteId || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the proposal URL
    const proposalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5123'}/proposal/${quoteId}`;

    // Create email content
    const emailBody = `
      <h2 style="color: #2563eb;">Your Solar Installation Proposal is Ready!</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Thank you for choosing Sun Direct Power for your solar installation needs.</p>
      
      <p>We've completed your site visit and prepared your final proposal. Please review and sign the proposal at your earliest convenience.</p>
      
      <div class="highlight">
        <p style="margin: 0 0 15px 0;"><strong>What's included in your proposal:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Detailed system specifications</li>
          <li>Installation timeline</li>
          <li>Pricing and payment options</li>
          <li>Warranty information</li>
          <li>Expected energy savings</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${proposalUrl}" class="button">
          View & Sign Proposal
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This link will remain active for 30 days. If you have any questions, please don't hesitate to contact us.
      </p>
    `;

    // Wrap email in template
    const html = wrapEmailTemplate(emailBody);

    // Send email using existing email service (uses SMTP from database settings)
    const result = await sendEmail({
      to: customerEmail,
      subject: 'Your Solar Installation Proposal - Sun Direct Power',
      html,
      dealId: leadId,
      trackingEnabled: true
    });

    if (!result.success) {
      throw new Error('Email sending failed');
    }

    // Update quote status to 'SENT'
    await prisma.customerQuote.update({
      where: { id: quoteId },
      data: {
        status: 'SENT',
        updatedAt: new Date()
      }
    });

    // Auto-update CRM deal stage
    try {
      await updateDealStage(leadId, 'FINAL_PROPOSAL_SENT', 'system');
      console.log(`✅ Deal stage updated to FINAL_PROPOSAL_SENT for lead ${leadId}`);
    } catch (dealError) {
      console.error('Failed to update deal stage:', dealError);
      // Don't fail the request if deal update fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Proposal email sent successfully',
      proposalUrl,
      communicationId: result.communicationId,
      trackingId: result.trackingId
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error sending proposal email:', error);
    return NextResponse.json(
      { error: 'Failed to send proposal email', details: error.message },
      { status: 500 }
    );
  }
}
