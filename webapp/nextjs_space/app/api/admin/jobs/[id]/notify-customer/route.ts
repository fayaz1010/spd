import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

// Decrypt function
function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * POST /api/admin/jobs/[id]/notify-customer
 * Send installation schedule confirmation to customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job with full details
    const job = await prisma.installationJob.findUnique({
      where: { id: params.id },
      include: {
        lead: true,
        team: true,
        subcontractor: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.scheduledDate) {
      return NextResponse.json({ error: 'Job not scheduled yet' }, { status: 400 });
    }

    // Get SMTP settings
    const apiSettings = await prisma.apiSettings.findFirst();
    
    if (!apiSettings || !apiSettings.smtpEnabled) {
      return NextResponse.json(
        { error: 'SMTP not configured' },
        { status: 400 }
      );
    }

    const smtpPassword = apiSettings.smtpPassword ? decryptKey(apiSettings.smtpPassword) : '';
    
    const transporter = nodemailer.createTransport({
      host: apiSettings.smtpHost || 'smtp.office365.com',
      port: apiSettings.smtpPort || 587,
      secure: false,
      auth: {
        user: apiSettings.smtpUser || '',
        pass: smtpPassword,
      },
    } as any);

    const scheduledDate = new Date(job.scheduledDate);
    const installerName = job.team?.name || job.subcontractor?.companyName || 'Our installation team';

    // Generate confirmation token for customer
    const confirmationToken = Buffer.from(`${job.id}-${Date.now()}`).toString('base64url');
    
    // Save token to job
    await prisma.installationJob.update({
      where: { id: job.id },
      data: {
        customerConfirmationToken: confirmationToken,
        customerNotifiedAt: new Date(),
      },
    });

    const confirmationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/customer/confirm/${confirmationToken}`;

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(to right, #2563eb, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .details-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb; }
          .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-label { font-weight: bold; color: #6b7280; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Installation Scheduled!</h1>
            <p>Sun Direct Power</p>
          </div>
          <div class="content">
            <p>Dear ${job.lead.name},</p>
            <p>Great news! Your solar installation has been scheduled. Please review the details below and confirm your availability.</p>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #2563eb;">Installation Details</h3>
              <div class="detail-row">
                <span class="detail-label">Job Number:</span> ${job.jobNumber}
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span> ${format(scheduledDate, 'EEEE, MMMM d, yyyy')}
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span> ${job.scheduledStartTime || '9:00 AM'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration:</span> Approximately ${job.estimatedDuration} hours
              </div>
              <div class="detail-row">
                <span class="detail-label">Installer:</span> ${installerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">System:</span> ${job.systemSize}kW (${job.panelCount} panels)
              </div>
              ${job.batteryCapacity && job.batteryCapacity > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Battery:</span> ${job.batteryCapacity}kWh
              </div>
              ` : ''}
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #92400e;">Before Installation Day:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Ensure clear access to your roof and switchboard</li>
                <li>Remove any vehicles from the driveway</li>
                <li>Secure pets indoors</li>
                <li>Someone 18+ must be home during installation</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="button">
                Confirm Availability
              </a>
            </div>

            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              <strong>Need to reschedule?</strong> Please contact us as soon as possible at ${apiSettings.smtpFrom || 'info@sundirectpower.com.au'} or call us.
            </p>

            <div class="footer">
              <p><strong>Sun Direct Power</strong></p>
              <p>Phone: (08) 1234 5678 | Email: ${apiSettings.smtpFrom || 'info@sundirectpower.com.au'}</p>
              <p style="font-size: 12px; margin-top: 20px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: `${apiSettings.smtpFromName || 'Sun Direct Power'} <${apiSettings.smtpFrom || apiSettings.smtpUser}>`,
      to: job.lead.email,
      subject: `Installation Scheduled - ${format(scheduledDate, 'MMM d, yyyy')} - ${job.jobNumber}`,
      html: emailHTML,
    });

    return NextResponse.json({
      success: true,
      message: 'Customer notification sent successfully',
      sentTo: job.lead.email,
    });
  } catch (error) {
    console.error('Error sending customer notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
