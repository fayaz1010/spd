import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Reset Strategy Status
 * POST /api/ai/strategy/[id]/reset-status
 * 
 * Fixes stuck strategies by recalculating status based on actual article completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;

    // Get strategy with all articles
    const strategy = await prisma.contentStrategy.findUnique({
      where: { id: strategyId },
      include: {
        pillars: {
          include: {
            clusters: true,
          },
        },
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found' },
        { status: 404 }
      );
    }

    // Count total and completed articles
    const totalPillars = strategy.pillars.length;
    const completedPillars = strategy.pillars.filter((p: any) => p.blogPostId).length;
    
    const totalClusters = strategy.pillars.reduce((sum: number, p: any) => sum + p.clusters.length, 0);
    const completedClusters = strategy.pillars.reduce(
      (sum: number, p: any) => sum + p.clusters.filter((c: any) => c.blogPostId).length,
      0
    );

    const totalArticles = totalPillars + totalClusters;
    const completedArticles = completedPillars + completedClusters;
    const failedArticles = totalArticles - completedArticles;

    // Determine correct status
    let newStatus = strategy.status;
    
    if (completedArticles === 0) {
      newStatus = 'PLANNING';
    } else if (completedArticles === totalArticles) {
      newStatus = 'REVIEW'; // All done, ready for review/enhancement
    } else if (completedArticles > 0) {
      newStatus = 'REVIEW'; // Partial completion, needs review
    }

    // Update strategy status
    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message: `Status reset to ${newStatus}`,
      stats: {
        totalArticles,
        completedArticles,
        failedArticles,
        status: newStatus,
      },
    });
  } catch (error: any) {
    console.error('Error resetting strategy status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset status' },
      { status: 500 }
    );
  }
}
