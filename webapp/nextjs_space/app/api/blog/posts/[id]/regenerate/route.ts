import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBlogContent } from '@/lib/ai-blog-workflow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 1 minute timeout

/**
 * Regenerate a blog post from its strategy
 * POST /api/blog/posts/[id]/regenerate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Find the blog post
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    // Find which pillar or cluster this belongs to
    const pillar = await prisma.pillar.findFirst({
      where: { blogPostId: postId },
      include: {
        strategy: true,
      },
    });

    const cluster = await prisma.cluster.findFirst({
      where: { blogPostId: postId },
      include: {
        pillar: {
          include: {
            strategy: true,
          },
        },
      },
    });

    if (!pillar && !cluster) {
      return NextResponse.json(
        { success: false, error: 'This article is not part of a content strategy' },
        { status: 400 }
      );
    }

    const strategy = pillar ? pillar.strategy : cluster!.pillar.strategy;
    const topic = pillar ? pillar.topic : cluster!.topic;
    const isPillar = !!pillar;

    // Regenerate the content
    console.log(`Regenerating ${isPillar ? 'pillar' : 'cluster'}: ${topic}`);

    const result = await generateBlogContent({
      topic,
      isPillar,
      strategyName: strategy.name,
      targetAudience: strategy.targetAudience,
      tone: strategy.tone,
      location: strategy.location,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate content');
    }

    // Update the blog post with new content
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title: result.title,
        slug: result.slug,
        content: result.content,
        excerpt: result.excerpt,
        metaTitle: result.metaTitle,
        metaDescription: result.metaDescription,
        keywords: result.keywords,
        tags: result.tags || [],
        readingTime: result.readingTime,
        status: 'DRAFT', // Reset to DRAFT after regeneration
        featuredImage: null, // Clear old image
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article regenerated successfully',
      article: {
        id: postId,
        title: result.title,
        wordCount: result.wordCount,
        readingTime: result.readingTime,
      },
    });

  } catch (error: any) {
    console.error('Error regenerating article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to regenerate article' },
      { status: 500 }
    );
  }
}
