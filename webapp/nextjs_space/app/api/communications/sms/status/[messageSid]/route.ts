import { NextRequest, NextResponse } from 'next/server';
import { getSMSStatus } from '@/lib/sms-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageSid: string } }
) {
  try {
    const { messageSid } = params;

    if (!messageSid) {
      return NextResponse.json(
        { success: false, error: 'Missing messageSid' },
        { status: 400 }
      );
    }

    const status = await getSMSStatus(messageSid);

    return NextResponse.json({
      success: true,
      messageSid,
      ...status,
    });
  } catch (error: any) {
    console.error('SMS status check error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check SMS status' },
      { status: 500 }
    );
  }
}
