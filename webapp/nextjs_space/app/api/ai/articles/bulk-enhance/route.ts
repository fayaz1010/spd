import { NextRequest, NextResponse } from 'next/server';
import { bulkEnhanceArticles } from '@/lib/article-enhancer';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for bulk operations

/**
 * Bulk enhance articles
 * POST /api/ai/articles/bulk-enhance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { articleIds, strategyId } = body;
    
    if (!articleIds || !Array.isArray(articleIds)) {
      return NextResponse.json(
        { error: 'articleIds array is required' },
        { status: 400 }
      );
    }
    
    console.log(`Bulk enhancing ${articleIds.length} articles...`);
    
    // Enhance all articles
    const results = await bulkEnhanceArticles(articleIds);
    
    // Calculate summary
    const summary = {
      total: articleIds.length,
      enhanced: results.size,
      avgEeatScore: 0,
      ymylCompliant: 0,
      totalChanges: 0,
    };
    
    results.forEach((result) => {
      summary.avgEeatScore += result.eeatScore;
      summary.ymylCompliant += result.ymylCompliant ? 1 : 0;
      summary.totalChanges += result.changes.length;
    });
    
    summary.avgEeatScore = Math.round(summary.avgEeatScore / results.size);
    
    console.log(`✅ Bulk enhancement complete:`, summary);
    
    return NextResponse.json({
      success: true,
      summary,
      results: Array.from(results.entries()).map(([id, result]) => ({
        articleId: id,
        changes: result.changes,
        eeatScore: result.eeatScore,
        ymylCompliant: result.ymylCompliant,
        issues: result.issues,
      })),
    });
  } catch (error: any) {
    console.error('Bulk enhancement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance articles' },
      { status: 500 }
    );
  }
}
