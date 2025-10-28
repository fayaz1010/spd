import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, JWT_SECRET);

    // Get email stats
    const totalEmails = await prisma.emailMessage.count();
    const unreadEmails = await prisma.emailMessage.count({
      where: { isRead: false }
    });

    // Get SMS stats (placeholder - implement when SMS model is ready)
    const totalSMS = 0;
    const unreadSMS = 0;

    // Get WhatsApp stats (placeholder - implement when WhatsApp model is ready)
    const totalWhatsApp = 0;
    const unreadWhatsApp = 0;

    return NextResponse.json({
      stats: {
        totalEmails,
        unreadEmails,
        totalSMS,
        unreadSMS,
        totalWhatsApp,
        unreadWhatsApp
      }
    });
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
