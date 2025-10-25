
import { NextRequest, NextResponse } from 'next/server';
import { calculateRebatesFromDB } from '@/lib/pricing-service';

export async function POST(request: NextRequest) {
  try {
    const { systemSizeKw, batterySizeKwh, batteryCost } = await request.json();

    if (!systemSizeKw || systemSizeKw <= 0) {
      return NextResponse.json(
        { error: 'Valid system size is required' },
        { status: 400 }
      );
    }

    const rebates = await calculateRebatesFromDB(
      systemSizeKw,
      batterySizeKwh || 0,
      batteryCost || 0
    );

    return NextResponse.json({
      success: true,
      rebates,
    });
  } catch (error) {
    console.error('Error calculating rebates:', error);
    return NextResponse.json(
      { error: 'Failed to calculate rebates' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
