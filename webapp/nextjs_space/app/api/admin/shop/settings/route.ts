/**
 * Shop Settings API
 * Manage store configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/shop/settings - Get shop settings
export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.shopSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          id: 'shop-settings',
          storeName: 'Sun Direct Power Shop',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shop settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/shop/settings - Update shop settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    let settings = await prisma.shopSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.shopSettings.create({
        data: {
          id: 'shop-settings',
          ...body,
        },
      });
    } else {
      // Update existing
      settings = await prisma.shopSettings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating shop settings:', error);
    return NextResponse.json(
      { error: 'Failed to update shop settings' },
      { status: 500 }
    );
  }
}
