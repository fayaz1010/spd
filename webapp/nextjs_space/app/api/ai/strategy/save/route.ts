import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Save Content Strategy to Database
 * POST /api/ai/strategy/save
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      targetAudience,
      businessGoals,
      pillars,
      clusters,
      funnelConfig,
      estimatedTraffic,
      estimatedLeads,
    } = body;

    if (!name || !pillars || pillars.length === 0) {
      return NextResponse.json(
        { error: 'Strategy name and pillars are required' },
        { status: 400 }
      );
    }

    console.log('Saving content strategy:', name);

    // Calculate totals
    const totalClusters = Object.values(clusters || {}).reduce(
      (sum: number, arr: any) => sum + arr.length,
      0
    );

    // Create strategy
    const strategy = await prisma.contentStrategy.create({
      data: {
        name,
        description,
        targetAudience,
        businessGoals,
        status: 'PLANNING',
        totalPillars: pillars.length,
        totalClusters,
        completedCount: 0,
        targetKeywords: pillars.map((p: any) => p.targetKeyword),
        estimatedTraffic,
        estimatedLeads,
      },
    });

    // Create pillars
    for (const pillarData of pillars) {
      const pillar = await prisma.pillar.create({
        data: {
          strategyId: strategy.id,
          title: pillarData.title,
          targetKeyword: pillarData.targetKeyword,
          searchVolume: pillarData.searchVolume || 0,
          competition: pillarData.competition || 'MEDIUM',
          intent: pillarData.intent || 'COMMERCIAL',
          outline: {
            wordCount: pillarData.wordCount,
            clusterCount: pillarData.clusterCount,
          },
          wordCount: pillarData.wordCount,
          status: 'PLANNED',
          calculatorCtas: funnelConfig?.calculatorEnabled
            ? funnelConfig.calculatorPlacements?.length || 2
            : 0,
          packageLinks: funnelConfig?.packagesEnabled ? 3 : 0,
          productLinks: funnelConfig?.productsEnabled ? 2 : 0,
        },
      });

      // Create clusters for this pillar
      const pillarClusters = clusters[pillarData.id] || [];
      for (const clusterData of pillarClusters) {
        await prisma.cluster.create({
          data: {
            pillarId: pillar.id,
            title: clusterData.title,
            targetKeyword: clusterData.targetKeyword,
            searchVolume: clusterData.searchVolume || 0,
            intent: clusterData.intent || 'INFORMATIONAL',
            outline: {
              wordCount: clusterData.wordCount,
            },
            wordCount: clusterData.wordCount,
            status: 'PLANNED',
            internalLinks: [],
            calculatorCtas: funnelConfig?.calculatorEnabled
              ? funnelConfig.calculatorPlacements?.length || 2
              : 0,
            packageLinks: funnelConfig?.packagesEnabled ? 1 : 0,
            productLinks: funnelConfig?.productsEnabled ? 1 : 0,
          },
        });
      }
    }

    console.log('Strategy saved:', strategy.id);

    return NextResponse.json({
      success: true,
      strategyId: strategy.id,
      message: 'Strategy saved successfully',
    });
  } catch (error: any) {
    console.error('Strategy save error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to save strategy',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
