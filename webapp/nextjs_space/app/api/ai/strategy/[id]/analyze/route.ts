import { NextRequest, NextResponse } from 'next/server';
import { analyzeStrategyProgress } from '@/lib/generation-recovery';

export const dynamic = 'force-dynamic';

/**
 * Analyze Strategy Progress
 * GET /api/ai/strategy/[id]/analyze
 * 
 * Returns detailed analysis of all articles in the strategy:
 * - Current stage of each article
 * - Corruption detection
 * - What needs to be done next
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;

    console.log(`Analyzing strategy: ${strategyId}`);

    const analysis = await analyzeStrategyProgress(strategyId);

    console.log('Analysis complete:', {
      total: analysis.totalArticles,
      planned: analysis.planned,
      generating: analysis.generating,
      generated: analysis.generated,
      corrupted: analysis.corrupted,
      published: analysis.published,
    });

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze strategy' },
      { status: 500 }
    );
  }
}
