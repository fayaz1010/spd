import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateArticleWithCompliance } from '@/lib/gemini-grounding';
import { ensureHTML } from '@/lib/markdown-converter';
import { formatTables, validateAndFixTables } from '@/lib/table-formatter';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';
import { formatSources } from '@/lib/content-formatter';
import { polishArticle } from '@/lib/article-polisher';
import { scanBlogPost } from '@/lib/blog-quality-scanner';
import { scanBlogSEO } from '@/lib/blog-seo-scanner';

// Helper function to add schema markup
function addSchemaMarkup(content: string, title: string, type: 'pillar' | 'cluster'): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    articleSection: type === 'pillar' ? 'Solar Energy Guide' : 'Solar Information',
  };
  return content + `\n\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for generation

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
    const title = pillar ? pillar.title : cluster!.title;
    const targetKeyword = pillar ? pillar.targetKeyword : cluster!.targetKeyword;
    const targetWordCount = pillar ? (pillar.wordCount || 3000) : (cluster!.wordCount || 1500);
    const isPillar = !!pillar;

    // Regenerate using the SAME method as strategy wizard
    console.log(`Regenerating ${isPillar ? 'pillar' : 'cluster'}: ${title}`);

    const article = await generateArticleWithCompliance(
      title,
      targetKeyword,
      targetWordCount,
      {
        location: strategy.location || 'Perth, Western Australia',
        targetAudience: strategy.targetAudience || 'Perth homeowners',
      }
    );

    // FORMATTING PIPELINE (same as strategy wizard)
    
    // 1. Convert markdown to HTML if needed
    let content = ensureHTML(article.content);
    
    // 2. Format and validate tables
    content = validateAndFixTables(content);
    content = formatTables(content);

    // 3. Generate and insert funnel placements
    const funnelPlacements = await generateFunnelPlacements(
      title,
      targetKeyword,
      'COMMERCIAL',
      isPillar ? 'PILLAR' : 'CLUSTER',
      strategy.targetAudience || 'Perth homeowners'
    );
    content = insertFunnelElements(content, funnelPlacements);

    // 4. Add properly formatted sources (deduplicated, no API URLs)
    const sourcesSection = formatSources(article.sources || []);
    if (sourcesSection) {
      content += sourcesSection;
    }

    // 5. Add schema markup
    content = addSchemaMarkup(content, title, isPillar ? 'pillar' : 'cluster');

    // 6. Polish HTML
    const polished = polishArticle(content);
    const finalContent = polished.content;

    // Generate slug from title (same as strategy wizard)
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Generate excerpt from content (same as strategy wizard)
    const excerpt = article.content.substring(0, 200) + '...';
    
    // Generate meta description from content (same as strategy wizard)
    const metaDescription = article.content.substring(0, 160);

    // Calculate reading time and word count
    const wordCount = finalContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Scan the generated content
    const qualityReport = scanBlogPost(finalContent, title, postId);
    const seoReport = scanBlogSEO(finalContent, title, postId, {
      metaTitle: title,
      metaDescription,
      keywords: [targetKeyword],
      targetKeyword,
      slug,
    });

    // Update the blog post with new content AND analysis data
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title,
        slug,
        content: finalContent,
        excerpt,
        metaTitle: title,
        metaDescription,
        keywords: [targetKeyword],
        tags: [],
        readingTime,
        qualityScore: qualityReport.overallScore,
        qualityIssues: qualityReport.issues as any,
        seoScore: seoReport.seoScore,
        seoGrade: seoReport.grade,
        seoIssues: seoReport.issues as any,
        keywordDensity: seoReport.keywordDensity,
        lastScannedAt: new Date(),
        requiredActions: qualityReport.requiredActions,
        // status: Keep unchanged - user will publish manually after review
        featuredImage: null, // Clear old image
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article regenerated successfully',
      article: {
        id: postId,
        title,
        wordCount,
        readingTime,
        qualityScore: qualityReport.overallScore,
        seoScore: seoReport.seoScore,
        seoGrade: seoReport.grade,
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
