import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET - Fetch popup settings
 */
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.systemSetting.findFirst({
      where: { key: 'popupSettings' }
    });

    if (settings && settings.value) {
      return NextResponse.json({
        success: true,
        settings: typeof settings.value === 'string' 
          ? JSON.parse(settings.value)
          : settings.value
      });
    }

    // Return defaults if no settings found
    return NextResponse.json({
      success: true,
      settings: {
        calculatePopup: {
          enabled: true,
          showOnPages: ['/', '/about', '/services', '/contact'],
          excludePages: ['/calculator', '/calculator-v2', '/admin'],
          showAfterSeconds: 5,
          showOnScrollPercent: 50,
          showOnExitIntent: true,
          title: 'Get Your Solar Quote',
          description: 'Ready for a complete solar system? Get a personalized quote in minutes!',
          buttonText: 'Calculate My System',
          targetUrl: '/calculator-v2',
          showInPerth: true,
          showInWA: true,
          showNationwide: true,
          showOnDesktop: true,
          showOnMobile: true,
          showOnTablet: true,
        },
        installAppPopup: {
          enabled: true,
          showOnPages: ['/admin', '/installer'],
          excludePages: [],
          showAfterSeconds: 10,
          showAfterVisits: 2,
          title: 'Install Installer App',
          description: 'Install the app for offline access, faster loading, and a better experience.',
          buttonText: 'Install',
          adminOnly: true,
          installerOnly: true,
          showOnDesktop: true,
          showOnMobile: true,
          showOnTablet: true,
        },
      }
    });
  } catch (error: any) {
    console.error('Error fetching popup settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST - Save popup settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate settings
    const { calculatePopup, installAppPopup } = body;

    if (!calculatePopup || !installAppPopup) {
      return NextResponse.json(
        { error: 'Invalid popup settings' },
        { status: 400 }
      );
    }

    // Save to database
    const saved = await prisma.systemSetting.upsert({
      where: { key: 'popupSettings' },
      update: {
        value: JSON.stringify(body),
        updatedAt: new Date(),
      },
      create: {
        key: 'popupSettings',
        value: JSON.stringify(body),
        description: 'Popup display settings for Calculate My System and Install App popups',
      },
    });

    console.log('✅ Popup settings saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: typeof saved.value === 'string' 
        ? JSON.parse(saved.value)
        : saved.value
    });
  } catch (error: any) {
    console.error('Error saving popup settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
