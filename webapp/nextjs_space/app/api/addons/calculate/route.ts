import { NextRequest, NextResponse } from 'next/server';
import { calculateAddonCosts, saveAddonsToQuote } from '@/lib/services/addon-service';

/**
 * POST /api/addons/calculate
 * Calculate costs with selected addons and optionally save to quote
 */
export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      selectedAddonIds,
      currentTotalCost,
      currentRebates,
      saveToQuote = false,
    } = await request.json();

    if (!selectedAddonIds || !Array.isArray(selectedAddonIds)) {
      return NextResponse.json(
        { success: false, error: 'selectedAddonIds must be an array' },
        { status: 400 }
      );
    }

    // Calculate addon costs
    const calculation = await calculateAddonCosts(
      selectedAddonIds,
      currentTotalCost || 0,
      currentRebates || 0
    );

    // Optionally save to quote
    if (saveToQuote && sessionId) {
      const saved = await saveAddonsToQuote(sessionId, selectedAddonIds);
      if (!saved) {
        console.warn('⚠️ Failed to save addons to quote');
      }
    }

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    console.error('Error calculating addon costs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
