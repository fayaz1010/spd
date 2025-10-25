import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/tax-settings - Get current tax settings
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    // Try to get settings from database
    const settings = await prisma.configSettings.findUnique({
      where: {
        key: 'tax_settings',
      },
    });

    if (settings && settings.value) {
      return NextResponse.json({
        settings: typeof settings.value === 'string' 
          ? JSON.parse(settings.value) 
          : settings.value,
      });
    }

    // Return default settings if none exist
    const defaultSettings = {
      gstRate: 10,
      gstEnabled: true,
      taxInclusive: false,
      stateTaxes: {
        NSW: 0,
        VIC: 0,
        QLD: 0,
        SA: 0,
        WA: 0,
        TAS: 0,
        NT: 0,
        ACT: 0,
      },
      exemptCategories: [],
    };

    return NextResponse.json({ settings: defaultSettings });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching tax settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/tax-settings - Update tax settings
export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();

    // Validate settings
    if (typeof body.gstRate !== 'number' || body.gstRate < 0 || body.gstRate > 100) {
      return NextResponse.json(
        { error: 'Invalid GST rate. Must be between 0 and 100.' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.configSettings.upsert({
      where: {
        key: 'tax_settings',
      },
      update: {
        value: body,
        updatedAt: new Date(),
      },
      create: {
        id: `cfg_tax_${Date.now()}`,
        key: 'tax_settings',
        value: body,
        description: 'Tax and GST configuration settings',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      settings: typeof settings.value === 'string' 
        ? JSON.parse(settings.value) 
        : settings.value,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating tax settings:', error);
    return NextResponse.json(
      { error: 'Failed to update tax settings' },
      { status: 500 }
    );
  }
}
