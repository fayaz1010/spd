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

    // Get Microsoft Graph client
    const client = await getMicrosoftGraphClient();

    // Fetch emails from Microsoft 365
    const messages = await client
      .api('/me/messages')
      .top(50)
      .orderby('receivedDateTime DESC')
      .select('id,subject,from,toRecipients,ccRecipients,receivedDateTime,bodyPreview,body,hasAttachments,isRead')
      .get();

    let syncedCount = 0;
    let newCount = 0;

    // Process and store emails
    for (const message of messages.value) {
      const messageId = message.id;
      
      // Check if email already exists
      const existing = await prisma.emailMessage.findUnique({
        where: { messageId }
      });

      if (!existing) {
        // Extract email addresses
        const fromEmail = message.from?.emailAddress?.address || 'unknown';
        const toEmails = message.toRecipients?.map((r: any) => r.emailAddress.address).join(', ') || '';
        const ccEmails = message.ccRecipients?.map((r: any) => r.emailAddress.address).join(', ') || '';

        // Create new email record
        await prisma.emailMessage.create({
          data: {
            messageId,
            from: fromEmail,
            to: toEmails,
            cc: ccEmails || null,
            subject: message.subject || '(No Subject)',
            body: message.bodyPreview || '',
            bodyHtml: message.body?.content || null,
            receivedAt: new Date(message.receivedDateTime),
            isRead: message.isRead || false,
            hasAttachments: message.hasAttachments || false,
            direction: 'inbound',
            provider: 'microsoft365',
            rawData: message
          }
        });

        newCount++;
      }

      syncedCount++;
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      new: newCount,
      message: `Synced ${syncedCount} emails, ${newCount} new`
    });
  } catch (error: any) {
    console.error('Error syncing emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
