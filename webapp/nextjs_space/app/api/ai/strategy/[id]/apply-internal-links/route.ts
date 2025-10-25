import { NextRequest, NextResponse } from 'next/server';
import { applyInternalLinksToStrategy } from '@/lib/internal-linking';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Apply internal links to all articles in strategy
 * POST /api/ai/strategy/[id]/apply-internal-links
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    
    console.log(`Applying internal links to strategy: ${strategyId}`);
    
    const result = await applyInternalLinksToStrategy(strategyId);
    
    console.log(`✅ Internal links applied:`, result);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Internal linking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply internal links' },
      { status: 500 }
    );
  }
}
