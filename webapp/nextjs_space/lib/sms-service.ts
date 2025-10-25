// SMS service using Twilio
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

interface SMSOptions {
  to: string;
  body: string;
  dealId?: string;
  mediaUrl?: string[]; // For MMS
}

interface SMSResult {
  success: boolean;
  communicationId?: string;
  messageSid?: string;
  error?: string;
}

// Create Twilio client
async function createTwilioClient() {
  try {
    // Get Twilio settings from database
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (settings?.twilioEnabled && settings.twilioAccountSid && settings.twilioAuthToken) {
      return twilio(settings.twilioAccountSid, settings.twilioAuthToken);
    }
  } catch (error) {
    console.error('Failed to fetch Twilio settings from database:', error);
  }

  // Fallback to environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
}

// Get Twilio phone number
async function getTwilioPhoneNumber(): Promise<string> {
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
    });

    if (settings?.twilioPhoneNumber) {
      return settings.twilioPhoneNumber;
    }
  } catch (error) {
    console.error('Failed to fetch Twilio phone number:', error);
  }

  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error('Twilio phone number not configured');
  }

  return phoneNumber;
}

// Send SMS
export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  try {
    const client = await createTwilioClient();
    const fromNumber = await getTwilioPhoneNumber();

    // Format phone number (ensure it has country code)
    let toNumber = options.to;
    if (!toNumber.startsWith('+')) {
      // Assume Australian number if no country code
      toNumber = '+61' + toNumber.replace(/^0/, '');
    }

    // Send SMS via Twilio
    const messageOptions: any = {
      body: options.body,
      from: fromNumber,
      to: toNumber,
    };

    if (options.mediaUrl && options.mediaUrl.length > 0) {
      messageOptions.mediaUrl = options.mediaUrl;
    }

    const message = await client.messages.create(messageOptions);

    console.log('SMS sent:', message.sid);

    // Save to database if dealId provided
    let communicationId: string | undefined;
    if (options.dealId) {
      try {
        const communication = await prisma.communication.create({
          data: {
            dealId: options.dealId,
            type: 'SMS',
            direction: 'OUTBOUND',
            body: options.body,
            from: fromNumber,
            to: toNumber,
            messageId: message.sid,
            sentAt: new Date(),
            deliveredAt: message.status === 'delivered' ? new Date() : null,
          },
        });

        communicationId = communication.id;

        // Log activity
        await prisma.activity.create({
          data: {
            dealId: options.dealId,
            type: 'NOTE_ADDED', // Using NOTE_ADDED as SMS type doesn't exist yet
            title: 'SMS sent',
            description: `SMS sent to ${toNumber}: ${options.body.substring(0, 50)}${options.body.length > 50 ? '...' : ''}`,
            performedBy: 'system', // TODO: Get from session
            completedAt: new Date(),
          },
        });
      } catch (dbError) {
        console.error('Failed to save SMS to database:', dbError);
      }
    }

    return {
      success: true,
      communicationId,
      messageSid: message.sid,
    };
  } catch (error: any) {
    console.error('SMS sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

// Send bulk SMS
export async function sendBulkSMS(
  recipients: Array<{ to: string; body: string; dealId?: string }>
): Promise<Array<SMSResult>> {
  const results: SMSResult[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS(recipient);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Get SMS status from Twilio
export async function getSMSStatus(messageSid: string): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  try {
    const client = await createTwilioClient();
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error: any) {
    console.error('Failed to fetch SMS status:', error);
    return {
      status: 'unknown',
      errorMessage: error.message,
    };
  }
}

// Update SMS status in database
export async function updateSMSStatus(
  messageSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  try {
    const communication = await prisma.communication.findFirst({
      where: { messageId: messageSid },
    });

    if (communication) {
      const updateData: any = {};

      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }

      await prisma.communication.update({
        where: { id: communication.id },
        data: updateData,
      });

      // Log activity for failures
      if (status === 'failed' || status === 'undelivered') {
        await prisma.activity.create({
          data: {
            dealId: communication.dealId,
            type: 'NOTE_ADDED',
            title: 'SMS delivery failed',
            description: `SMS delivery failed: ${errorMessage || 'Unknown error'}`,
            performedBy: 'system',
            completedAt: new Date(),
          },
        });
      }
    }
  } catch (error) {
    console.error('Failed to update SMS status:', error);
  }
}

// SMS template helpers
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with 61, it's already formatted
  if (cleaned.startsWith('61')) {
    return '+' + cleaned;
  }
  
  // If starts with 0, it's Australian
  if (cleaned.startsWith('0')) {
    return '+61' + cleaned.substring(1);
  }
  
  // Otherwise assume Australian
  return '+61' + cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Basic validation for Australian numbers
  return /^\+61[2-478]\d{8}$/.test(formatted);
}

// SMS templates
export const smsTemplates = {
  quoteReady: (customerName: string, quoteRef: string) => 
    `Hi ${customerName}, your solar quote ${quoteRef} is ready! View it here: [LINK]. Questions? Reply to this message.`,
  
  installationReminder: (customerName: string, date: string) =>
    `Hi ${customerName}, reminder: Your solar installation is scheduled for ${date}. Our team will arrive as planned. Reply if you need to reschedule.`,
  
  installationComplete: (customerName: string) =>
    `Hi ${customerName}, your solar system is now live! 🌞 You'll receive your warranty documents via email. Questions? Reply anytime.`,
  
  followUp: (customerName: string) =>
    `Hi ${customerName}, just following up on your solar quote. Any questions? We're here to help! Reply or call us.`,
  
  appointmentConfirmation: (customerName: string, date: string, time: string) =>
    `Hi ${customerName}, your appointment is confirmed for ${date} at ${time}. See you then!`,
};
