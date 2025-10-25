import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/company
 * Fetch company settings
 */
export async function GET() {
  try {
    // Get the first (and only) settings record
    let settings = await prisma.systemSettings.findFirst();
    
    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          updatedAt: new Date(),
          companyName: 'Sun Direct Power',
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/company
 * Update company settings
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get existing settings or create new
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      // Update existing
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          ...data,
          updatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings/company
 * Partial update of company settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Get existing settings
    const settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }
    
    // Update only provided fields
    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error patching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}
