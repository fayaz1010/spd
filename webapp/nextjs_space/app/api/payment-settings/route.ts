import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.paymentSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Return default settings if none found
      return NextResponse.json({
        depositPercentage: 10,
        installmentMonths: 24,
        urgencyMessage: 'Only 3 installation slots left this month - Secure yours today!',
      });
    }

    return NextResponse.json({
      depositPercentage: settings.depositPercentage,
      installmentMonths: settings.installmentMonths,
      urgencyMessage: settings.urgencyMessage,
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment settings' },
      { status: 500 }
    );
  }
}
