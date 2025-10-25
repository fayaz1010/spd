import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { generateSMSMessage } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { context, customerPhone } = body;

    if (!context) {
      return NextResponse.json(
        { error: 'Please provide context' },
        { status: 400 }
      );
    }

    // Generate SMS content using AI (keeps it under 160 chars)
    const generatedMessage = await generateSMSMessage(context);

    return NextResponse.json({
      message: generatedMessage,
    });
  } catch (error: any) {
    console.error('Error generating SMS:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate SMS' },
      { status: 500 }
    );
  }
}
