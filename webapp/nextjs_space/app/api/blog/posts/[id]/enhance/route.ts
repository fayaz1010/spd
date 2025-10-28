import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureHTML } from '@/lib/markdown-converter';
import { formatTables, validateAndFixTables } from '@/lib/table-formatter';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';
import { formatSources } from '@/lib/content-formatter';
import { polishArticle } from '@/lib/article-polisher';
import { scanBlogPost } from '@/lib/blog-quality-scanner';
import { scanBlogSEO } from '@/lib/blog-seo-scanner';
import { applyAllQualityFixes } from '@/lib/content-quality-fixer';
import { generateAndUploadArticleImages } from '@/lib/image-generator';

// Helper function to add schema markup
function addSchemaMarkup(content: string, title: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
  };
  return content + `\n\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

/**
 * Enhance Single Blog Post - Apply Complete Formatting Pipeline
 * POST /api/blog/posts/[id]/enhance
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // Get the blog post
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    console.log(`✨ Enhancing article: ${post.title}`);

    // COMPLETE FORMATTING PIPELINE (same as strategy wizard)
    
    // 1. Convert markdown to HTML if needed
    let content = ensureHTML(post.content);
    
    // 2. Format and validate tables
    content = validateAndFixTables(content);
    content = formatTables(content);

    // 3. Generate and insert funnel placements (if not already present)
    const hasCTAs = content.includes('Discover Your Solar Potential') || 
                    content.includes('Calculate My Savings') ||
                    content.includes('Get Started Now') ||
                    content.includes('calculator-widget') || 
                    content.includes('package-link') ||
                    content.includes('bg-gradient-to-br from-red-500');
    
    if (!hasCTAs) {
      console.log('Adding funnel placements...');
      const targetKeyword = post.keywords?.[0] || '';
      const funnelPlacements = await generateFunnelPlacements(
        post.title,
        targetKeyword,
        'COMMERCIAL',
        'CLUSTER',
        'Perth homeowners'
      );
      content = insertFunnelElements(content, funnelPlacements);
    } else {
      console.log('✓ CTAs already present, skipping funnel generation');
    }

    // 4. Add schema markup if not present
    if (!content.includes('application/ld+json')) {
      console.log('Adding schema markup...');
      content = addSchemaMarkup(content, post.title);
    }

    // 5. Polish HTML
    const polished = polishArticle(content);
    let enhancedContent = polished.content;

    // 6. Apply quality fixes (HTML entities, contact info, sources)
    console.log('Applying quality fixes...');
    enhancedContent = await applyAllQualityFixes(enhancedContent);

    // 7. Generate images if missing
    console.log('Checking images...');
    try {
      // Check if images already exist
      if (!(post as any).heroImageUrl || !(post as any).infographicUrl) {
        console.log('Generating images...');
        const images = await generateAndUploadArticleImages(
          post.id,
          post.title,
          post.title
        );

        // Update post with images
        await prisma.blogPost.update({
          where: { id: postId },
          data: {
            heroImageUrl: images.heroImageUrl || (post as any).heroImageUrl,
            infographicUrl: images.infographicUrl || (post as any).infographicUrl,
          } as any,
        });

        console.log('✅ Images generated');
      } else {
        console.log('✓ Images already exist');
      }
    } catch (imageError) {
      console.error('Image generation error:', imageError);
      console.log('⚠️ Continuing without images...');
    }

    console.log('✅ Enhancement complete');

    // Scan the enhanced content to get analysis scores
    const targetKeyword = post.keywords?.[0] || '';
    const qualityReport = scanBlogPost(enhancedContent, post.title, post.id);
    const seoReport = scanBlogSEO(enhancedContent, post.title, post.id, {
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      keywords: post.keywords,
      targetKeyword,
      slug: post.slug,
    });

    // Step 3: Update the blog post with analysis data (keep current status)
    await prisma.blogPost.update({
      where: { id: postId },
      data: {
        content: enhancedContent,
        // status: Keep unchanged - user will publish manually after review
        qualityScore: qualityReport.overallScore,
        qualityIssues: qualityReport.issues as any,
        seoScore: seoReport.seoScore,
        seoGrade: seoReport.grade,
        seoIssues: seoReport.issues as any,
        keywordDensity: seoReport.keywordDensity,
        lastScannedAt: new Date(),
        requiredActions: qualityReport.requiredActions,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Article enhanced successfully - complete formatting pipeline applied',
      changes: polished.changes || [],
      qualityScore: qualityReport.overallScore,
      seoScore: seoReport.seoScore,
      seoGrade: seoReport.grade,
    });
  } catch (error: any) {
    console.error('Error enhancing article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enhance article' },
      { status: 500 }
    );
  }
}
