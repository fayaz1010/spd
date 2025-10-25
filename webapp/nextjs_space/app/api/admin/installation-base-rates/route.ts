import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/installation-base-rates
 * Get installation base rates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'WA';

    const rates = await prisma.installationBaseRates.findFirst({
      where: {
        region,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rates) {
      // Return default values if none exist
      return NextResponse.json({
        rates: {
          calloutFee: 500,
          hourlyRate: 85,
          minimumCharge: 800,
          region: 'WA',
          notes: '',
        },
      });
    }

    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error('Error fetching base rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch base rates', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/installation-base-rates
 * Update installation base rates
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      id,
      calloutFee,
      hourlyRate,
      minimumCharge,
      region,
      notes,
    } = body;

    // Validate required fields
    if (calloutFee === undefined || hourlyRate === undefined || minimumCharge === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: calloutFee, hourlyRate, minimumCharge' },
        { status: 400 }
      );
    }

    let rates;

    if (id) {
      // Update existing
      rates = await prisma.installationBaseRates.update({
        where: { id },
        data: {
          calloutFee: parseFloat(calloutFee),
          hourlyRate: parseFloat(hourlyRate),
          minimumCharge: parseFloat(minimumCharge),
          region: region || 'WA',
          notes: notes || null,
        },
      });
    } else {
      // Create new (deactivate old ones first)
      await prisma.installationBaseRates.updateMany({
        where: { region: region || 'WA' },
        data: { active: false },
      });

      rates = await prisma.installationBaseRates.create({
        data: {
          id: `rates_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          calloutFee: parseFloat(calloutFee),
          hourlyRate: parseFloat(hourlyRate),
          minimumCharge: parseFloat(minimumCharge),
          region: region || 'WA',
          active: true,
          notes: notes || null,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ rates });
  } catch (error: any) {
    console.error('Error updating base rates:', error);
    return NextResponse.json(
      { error: 'Failed to update base rates', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
