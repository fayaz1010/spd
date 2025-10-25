import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth-admin';
import { generateEmailSuggestion } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, context, customerEmail } = body;

    if (!subject && !context) {
      return NextResponse.json(
        { error: 'Please provide subject or context' },
        { status: 400 }
      );
    }

    // Build context for AI
    const fullContext = `
      Subject: ${subject || 'Follow-up email'}
      ${context ? `Context: ${context}` : ''}
      ${customerEmail ? `Customer: ${customerEmail}` : ''}
    `;

    // Generate email content using AI
    const generatedBody = await generateEmailSuggestion(fullContext, context);

    return NextResponse.json({
      body: generatedBody,
      subject: subject || 'Follow-up from Sun Direct Power',
    });
  } catch (error: any) {
    console.error('Error generating email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}
