import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function getMicrosoftGraphClient() {
  const apiSettings = await prisma.apiSettings.findFirst();
  
  if (!apiSettings?.microsoftEnabled || !apiSettings.microsoftClientId || 
      !apiSettings.microsoftClientSecret || !apiSettings.microsoftTenantId) {
    throw new Error('Microsoft 365 OAuth is not configured');
  }

  const credential = new ClientSecretCredential(
    apiSettings.microsoftTenantId,
    apiSettings.microsoftClientId,
    apiSettings.microsoftClientSecret
  );

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default']
  });

  return Client.initWithMiddleware({ authProvider });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);

    const body = await request.json();
    const { to, cc, bcc, subject, body: emailBody, replyToId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      );
    }

    // Get Microsoft Graph client
    const client = await getMicrosoftGraphClient();

    // Prepare email message
    const message: any = {
      subject,
      body: {
        contentType: 'Text',
        content: emailBody
      },
      toRecipients: to.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }))
    };

    if (cc) {
      message.ccRecipients = cc.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }));
    }

    if (bcc) {
      message.bccRecipients = bcc.split(',').map((email: string) => ({
        emailAddress: { address: email.trim() }
      }));
    }

    // Send email via Microsoft Graph API
    const sentMessage = await client
      .api('/me/sendMail')
      .post({
        message,
        saveToSentItems: true
      });

    // Store sent email in database
    const apiSettings = await prisma.apiSettings.findFirst();
    const fromEmail = apiSettings?.businessEmail || 'noreply@sundirectpower.com.au';

    const emailRecord = await prisma.emailMessage.create({
      data: {
        messageId: `sent-${Date.now()}`,
        from: fromEmail,
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body: emailBody,
        sentAt: new Date(),
        receivedAt: new Date(),
        isRead: true,
        direction: 'outbound',
        provider: 'microsoft365'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: emailRecord.id
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
