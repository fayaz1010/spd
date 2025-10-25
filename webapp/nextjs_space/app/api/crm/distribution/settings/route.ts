import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth-admin';

// Distribution settings are stored in a JSON field in ApiSettings
export async function GET(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    // Default settings if none exist
    const defaultSettings = {
      autoAssignEnabled: false,
      assignmentMethod: 'round-robin',
      notifyOnAssignment: true,
      reassignInactive: false,
      inactiveThresholdHours: 24,
      territoryRules: [],
    };

    const distributionSettings = settings?.distributionSettings 
      ? JSON.parse(settings.distributionSettings as string)
      : defaultSettings;

    return NextResponse.json({
      settings: distributionSettings,
    });
  } catch (error) {
    console.error('Error fetching distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get or create settings record
    let settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      settings = await prisma.apiSettings.create({
        data: {
          id: 'default',
          active: true,
          distributionSettings: JSON.stringify(body),
        },
      });
    } else {
      settings = await prisma.apiSettings.update({
        where: { id: settings.id },
        data: {
          distributionSettings: JSON.stringify(body),
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: JSON.parse(settings.distributionSettings as string),
    });
  } catch (error) {
    console.error('Error saving distribution settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
