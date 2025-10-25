import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendBulkSMS } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, dealId, bulk, recipients, mediaUrl } = body;

    // Bulk SMS
    if (bulk && recipients && Array.isArray(recipients)) {
      const results = await sendBulkSMS(recipients);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: failureCount,
        },
      });
    }

    // Single SMS
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    const result = await sendSMS({
      to,
      body: message,
      dealId,
      mediaUrl,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        communicationId: result.communicationId,
        messageSid: result.messageSid,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
