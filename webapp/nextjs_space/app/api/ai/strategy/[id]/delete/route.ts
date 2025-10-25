import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Delete strategy and all related content
 * DELETE /api/ai/strategy/[id]/delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const strategyId = params.id;
    
    console.log(`🗑️ Deleting strategy: ${strategyId}`);
    
    // Fetch strategy with all related data
    const strategy = await prisma.contentStrategy.findUnique({
      where: { id: strategyId },
      include: {
        pillars: {
          include: {
            blogPost: true,
            clusters: {
              include: {
                blogPost: true,
              },
            },
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
    
    let deletedBlogPosts = 0;
    let deletedPillars = 0;
    let deletedClusters = 0;
    
    // Delete all blog posts and related content
    for (const pillar of strategy.pillars) {
      // Delete pillar blog post
      if (pillar.blogPostId) {
        await prisma.blogPost.delete({
          where: { id: pillar.blogPostId },
        });
        deletedBlogPosts++;
      }
      
      // Delete cluster blog posts
      for (const cluster of pillar.clusters) {
        if (cluster.blogPostId) {
          await prisma.blogPost.delete({
            where: { id: cluster.blogPostId },
          });
          deletedBlogPosts++;
        }
        deletedClusters++;
      }
      
      deletedPillars++;
    }
    
    // Delete the strategy (cascades to pillars and clusters)
    await prisma.contentStrategy.delete({
      where: { id: strategyId },
    });
    
    console.log(`✅ Deleted strategy: ${strategy.mainTopic}`);
    console.log(`   - Blog posts: ${deletedBlogPosts}`);
    console.log(`   - Pillars: ${deletedPillars}`);
    console.log(`   - Clusters: ${deletedClusters}`);
    
    return NextResponse.json({
      success: true,
      deleted: {
        strategy: strategy.mainTopic,
        blogPosts: deletedBlogPosts,
        pillars: deletedPillars,
        clusters: deletedClusters,
      },
    });
  } catch (error: any) {
    console.error('Delete strategy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete strategy' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
