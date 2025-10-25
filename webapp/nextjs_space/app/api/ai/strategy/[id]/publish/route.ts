import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Batch Publish All Articles in Strategy
 * POST /api/ai/strategy/[id]/publish
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;

    // Fetch strategy with pillars and clusters
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
        { error: 'Strategy not found' },
        { status: 404 }
      );
    }

    let publishedCount = 0;
    const publishedArticles = [];

    // Publish all pillar articles
    for (const pillar of strategy.pillars) {
      if (pillar.blogPostId) {
        const blogPost = await prisma.blogPost.update({
          where: { id: pillar.blogPostId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        await prisma.pillar.update({
          where: { id: pillar.id },
          data: { status: 'PUBLISHED' },
        });

        publishedCount++;
        publishedArticles.push({
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          type: 'pillar',
        });

        // Publish cluster articles
        for (const cluster of pillar.clusters) {
          if (cluster.blogPostId) {
            const clusterPost = await prisma.blogPost.update({
              where: { id: cluster.blogPostId },
              data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
              },
            });

            await prisma.cluster.update({
              where: { id: cluster.id },
              data: { status: 'PUBLISHED' },
            });

            publishedCount++;
            publishedArticles.push({
              id: clusterPost.id,
              title: clusterPost.title,
              slug: clusterPost.slug,
              type: 'cluster',
            });
          }
        }
      }
    }

    // Update strategy status
    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: { status: 'PUBLISHED' },
    });

    console.log(`Published ${publishedCount} articles for strategy ${strategyId}`);

    return NextResponse.json({
      success: true,
      publishedCount,
      publishedArticles,
      message: `Successfully published ${publishedCount} articles`,
    });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to publish articles',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
