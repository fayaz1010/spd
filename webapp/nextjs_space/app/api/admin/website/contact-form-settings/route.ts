import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/website/contact-form-settings - Get contact form settings
 */
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.contactFormSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.contactFormSettings.create({
        data: {
          id: 'contact-form-settings',
          enabled: true,
          recipientEmail: '',
          subjectPrefix: '[Website Contact]',
          autoReplyEnabled: true,
          autoReplySubject: 'Thank you for contacting us',
          autoReplyMessage: 'We have received your message and will get back to you soon.',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching contact form settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/website/contact-form-settings - Update contact form settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    let settings = await prisma.contactFormSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.contactFormSettings.create({
        data: {
          id: 'contact-form-settings',
          ...body,
        },
      });
    } else {
      // Update existing
      settings = await prisma.contactFormSettings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error updating contact form settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings', details: error.message },
      { status: 500 }
    );
  }
}
