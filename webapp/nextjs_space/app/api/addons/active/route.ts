import { NextRequest, NextResponse } from 'next/server';
import { getActiveAddons, getAddonsByCategory } from '@/lib/services/addon-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/addons/active
 * Fetch all active addons, optionally grouped by category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupByCategory = searchParams.get('groupByCategory') === 'true';

    if (groupByCategory) {
      const categorized = await getAddonsByCategory();
      return NextResponse.json({
        success: true,
        addons: categorized,
      });
    }

    const addons = await getActiveAddons();
    return NextResponse.json({
      success: true,
      addons,
    });
  } catch (error: any) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
