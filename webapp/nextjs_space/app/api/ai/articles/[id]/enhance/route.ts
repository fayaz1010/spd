import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { enhanceArticle } from '@/lib/article-enhancer';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Enhance single article
 * POST /api/ai/articles/[id]/enhance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const articleId = params.id;
    
    // Fetch article
    const article = await prisma.blogPost.findUnique({
      where: { id: articleId },
    });
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    console.log(`Enhancing article: ${article.title}`);
    
    // Enhance article
    const result = await enhanceArticle(
      articleId,
      article.content,
      {
        title: article.title,
        description: article.metaDescription || '',
        author: 'Sun Direct Power',
        datePublished: article.createdAt,
        dateModified: new Date(),
      },
      [] // TODO: Get sources from article metadata
    );
    
    // Update article
    await prisma.blogPost.update({
      where: { id: articleId },
      data: {
        content: result.content,
        updatedAt: new Date(),
      },
    });
    
    console.log(`✅ Enhanced article: ${result.changes.length} changes made`);
    
    return NextResponse.json({
      success: true,
      changes: result.changes,
      eeatScore: result.eeatScore,
      ymylCompliant: result.ymylCompliant,
      issues: result.issues,
    });
  } catch (error: any) {
    console.error('Enhancement error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enhance article' },
      { status: 500 }
    );
  }
}
