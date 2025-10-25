// Email service using Nodemailer (can be swapped for SendGrid, Resend, etc.)
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  dealId?: string;
  leadId?: string;
  jobId?: string;
  orderId?: string;
  performedBy?: string;
  trackingEnabled?: boolean;
}

// Create reusable transporter
// Fetches SMTP settings from database or falls back to environment variables
const createTransporter = async () => {
  try {
    // Try to get SMTP settings from database
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (settings?.smtpEnabled && settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
      // Use database SMTP settings
      return nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      });
    }
  } catch (error) {
    console.error('Failed to fetch SMTP settings from database:', error);
  }

  // Fallback to environment variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Generate unique tracking ID
function generateTrackingId(): string {
  return randomBytes(16).toString('hex');
}

// Add tracking pixel to HTML
function addTrackingPixel(html: string, trackingId: string, baseUrl: string): string {
  const trackingPixel = `<img src="${baseUrl}/api/communications/email/track/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Add pixel before closing body tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${trackingPixel}</body>`);
  }
  return html + trackingPixel;
}

// Add click tracking to links
function addClickTracking(html: string, trackingId: string, baseUrl: string): string {
  // Replace all href links with tracking links
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    const trackingUrl = `${baseUrl}/api/communications/email/click/${trackingId}?url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}

export async function sendEmail(options: EmailOptions): Promise<{success: boolean; communicationId?: string; trackingId?: string}> {
  try {
    const transporter = await createTransporter();

    // Get from email from database settings or use default
    let fromEmail = process.env.SMTP_FROM || 'noreply@sundirectpower.com.au';
    let fromName = 'Sun Direct Power';

    try {
      const settings = await prisma.apiSettings.findFirst({
        where: { active: true },
      });
      if (settings?.smtpFrom) {
        fromEmail = settings.smtpFrom;
      }
      if (settings?.smtpFromName) {
        fromName = settings.smtpFromName;
      }
    } catch (error) {
      console.error('Failed to fetch from email settings:', error);
    }

    // Generate tracking ID if tracking is enabled
    const trackingId = options.trackingEnabled !== false ? generateTrackingId() : null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Add tracking to HTML if enabled
    let finalHtml = options.html;
    if (trackingId) {
      finalHtml = addTrackingPixel(finalHtml, trackingId, baseUrl);
      finalHtml = addClickTracking(finalHtml, trackingId, baseUrl);
    }

    // Convert arrays to comma-separated strings
    const toAddress = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const ccAddress = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined;
    const bccAddress = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: toAddress,
      cc: ccAddress,
      bcc: bccAddress,
      subject: options.subject,
      html: finalHtml,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    // Save to database if dealId or leadId provided
    let communicationId: string | undefined;
    if (options.dealId || options.leadId) {
      try {
        const communication = await prisma.communication.create({
          data: {
            dealId: options.dealId,
            type: 'EMAIL',
            direction: 'OUTBOUND',
            subject: options.subject,
            body: options.html,
            from: fromEmail,
            to: toAddress,
            cc: ccAddress,
            bcc: bccAddress,
            messageId: info.messageId,
            trackingId: trackingId || undefined,
            sentAt: new Date(),
          },
        });

        communicationId = communication.id;

        // Create email tracking record if tracking enabled
        if (trackingId) {
          await prisma.emailTracking.create({
            data: {
              communicationId: communication.id,
              trackingId,
            },
          });
        }

        // Log activity - create for both deal and lead
        const activityData: any = {
          type: 'EMAIL_SENT',
          description: `Email sent: ${options.subject} to ${toAddress}`,
          performedBy: options.performedBy || 'system',
          completedAt: new Date(),
        };

        if (options.dealId) {
          activityData.dealId = options.dealId;
        }
        if (options.leadId) {
          activityData.leadId = options.leadId;
        }

        await prisma.activity.create({
          data: activityData,
        });
      } catch (dbError) {
        console.error('Failed to save communication to database:', dbError);
      }
    }

    return { 
      success: true, 
      communicationId,
      trackingId: trackingId || undefined
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false };
  }
}

// Email template helpers
export function wrapEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sun Direct Power</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #ffffff;
          padding: 30px 20px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .highlight {
          background: #eff6ff;
          padding: 15px;
          border-left: 4px solid #2563eb;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">Sun Direct Power</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Solar Energy Partner</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p><strong>Sun Direct Power</strong></p>
        <p>info@sundirectpower.com.au | 1300 XXX XXX</p>
        <p>ABN: XX XXX XXX XXX | CEC Accredited Installer</p>
        <p style="margin-top: 15px;">
          <a href="#" style="color: #2563eb; text-decoration: none;">Unsubscribe</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
