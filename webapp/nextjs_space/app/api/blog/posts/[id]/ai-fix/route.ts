import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scanBlogPost } from '@/lib/blog-quality-scanner';
import { scanBlogSEO } from '@/lib/blog-seo-scanner';
import { optimizeArticleSEO } from '@/lib/ai-seo-optimizer';
import { ensureHTML } from '@/lib/markdown-converter';
import { formatTables, validateAndFixTables } from '@/lib/table-formatter';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';
import { polishArticle } from '@/lib/article-polisher';
import { applyAllQualityFixes } from '@/lib/content-quality-fixer';
import { generateAndUploadArticleImages } from '@/lib/image-generator';

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
export const maxDuration = 120; // 2 minutes for AI fix

/**
 * AI-powered article fix
 * POST /api/blog/posts/[id]/ai-fix
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const postId = params.id;

        // Fetch post with strategy info
        const post = await prisma.blogPost.findUnique({
          where: { id: postId },
          include: {
            pillar: {
              include: {
                strategy: true,
              },
            },
            cluster: {
              include: {
                pillar: {
                  include: {
                    strategy: true,
                  },
                },
              },
            },
          },
        });

        if (!post) {
          throw new Error('Post not found');
        }

        sendEvent({
          progress: 5,
          step: 'Scanning article for issues...',
        });

        // Get target keyword
        let targetKeyword = post.keywords?.[0] || '';
        let strategyName = null;

        if (post.pillar) {
          targetKeyword = post.pillar.targetKeyword || targetKeyword;
          strategyName = post.pillar.strategy?.name;
        } else if (post.cluster) {
          targetKeyword = post.cluster.targetKeyword || targetKeyword;
          strategyName = post.cluster.pillar?.strategy?.name;
        }

        // Scan quality
        const qualityReport = scanBlogPost(post.content, post.title, post.id);

        // Scan SEO
        const seoReport = scanBlogSEO(post.content, post.title, post.id, {
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: post.keywords,
          targetKeyword,
          slug: post.slug,
        });

        sendEvent({
          progress: 10,
          step: `Found ${qualityReport.issues.length} quality issues and ${seoReport.issues.length} SEO issues`,
          analysis: {
            qualityScore: qualityReport.overallScore,
            seoScore: seoReport.seoScore,
            qualityIssues: qualityReport.issues.length,
            seoIssues: seoReport.issues.length,
          },
        });

        // Execute AI SEO Optimization (with retry logic)
        const result = await optimizeArticleSEO(
          post.content,
          post.title,
          targetKeyword,
          {
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            keywords: post.keywords,
            slug: post.slug,
          },
          (message, attempt, score) => {
            const progress = 10 + (attempt / 5) * 75; // 10-85%
            sendEvent({ 
              progress, 
              step: message,
              analysis: { attempt, currentScore: score }
            });
          }
        );

        if (!result.success || !result.optimizedContent || result.optimizedContent.trim().length < 100) {
          throw new Error(result.error || 'SEO optimization failed - content too short or empty');
        }

        sendEvent({
          progress: 87,
          step: `SEO optimization complete! Score: ${result.finalSEOScore}% (${result.attempts} attempts)`,
        });

        // Validate optimized content
        if (result.optimizedContent.length < post.content.length * 0.5) {
          throw new Error('Optimized content is significantly shorter than original - aborting to prevent data loss');
        }

        sendEvent({
          progress: 90,
          step: 'Applying technical SEO enhancements...',
        });

        // TECHNICAL SEO FIXES (code-based, not AI)
        let enhancedContent = result.optimizedContent;
        
        // 1. Convert markdown to HTML if needed
        enhancedContent = ensureHTML(enhancedContent);
        
        // 2. Format and validate tables
        enhancedContent = validateAndFixTables(enhancedContent);
        enhancedContent = formatTables(enhancedContent);

        // 3. Add CTAs/funnels if not present
        const hasCTAs = enhancedContent.includes('Discover Your Solar Potential') || 
                        enhancedContent.includes('Calculate My Savings') ||
                        enhancedContent.includes('bg-gradient-to-br from-red-500');
        
        if (!hasCTAs) {
          console.log('Adding funnel placements...');
          const isPillar = !!post.pillar;
          const funnelPlacements = await generateFunnelPlacements(
            post.title,
            targetKeyword,
            'COMMERCIAL',
            isPillar ? 'PILLAR' : 'CLUSTER',
            strategyName || 'Perth homeowners'
          );
          enhancedContent = insertFunnelElements(enhancedContent, funnelPlacements);
        }

        // 4. Add schema markup if not present
        if (!enhancedContent.includes('application/ld+json')) {
          console.log('Adding schema markup...');
          const isPillar = !!post.pillar;
          enhancedContent = addSchemaMarkup(enhancedContent, post.title, isPillar ? 'pillar' : 'cluster');
        }

        // 5. Final polish
        const polished = polishArticle(enhancedContent);
        enhancedContent = polished.content;

        // 6. Apply quality fixes (HTML entities, contact info, sources)
        sendEvent({
          progress: 85,
          step: 'Applying quality fixes...',
        });
        
        enhancedContent = await applyAllQualityFixes(enhancedContent);

        // 7. Generate images if missing
        sendEvent({
          progress: 88,
          step: 'Generating images...',
        });

        try {
          // Check if images already exist
          if (!(post as any).heroImageUrl || !(post as any).infographicUrl) {
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

            sendEvent({
              progress: 90,
              step: '✅ Images generated successfully',
            });
          } else {
            sendEvent({
              progress: 90,
              step: 'Images already exist',
            });
          }
        } catch (imageError) {
          console.error('Image generation error:', imageError);
          sendEvent({
            progress: 90,
            step: '⚠️ Image generation failed (continuing...)',
          });
        }

        sendEvent({
          progress: 92,
          step: 'Re-scanning to verify improvements...',
        });

        // Re-scan the enhanced content to get new scores
        const newQualityReport = scanBlogPost(enhancedContent, post.title, post.id);
        const newSeoReport = scanBlogSEO(enhancedContent, post.title, post.id, {
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          keywords: post.keywords,
          targetKeyword,
          slug: post.slug,
        });

        sendEvent({
          progress: 97,
          step: 'Saving fixed article with analysis...',
        });

        // Update post with enhanced content AND save analysis results
        await prisma.blogPost.update({
          where: { id: postId },
          data: {
            content: enhancedContent, // Use enhanced content with all technical fixes
            // status: Keep unchanged - don't auto-publish
            qualityScore: newQualityReport.overallScore,
            qualityIssues: newQualityReport.issues as any,
            seoScore: newSeoReport.seoScore,
            seoGrade: newSeoReport.grade,
            seoIssues: newSeoReport.issues as any,
            keywordDensity: newSeoReport.keywordDensity,
            lastScannedAt: new Date(),
            requiredActions: newQualityReport.requiredActions,
            updatedAt: new Date(),
          } as any,
        });

        sendEvent({
          progress: 100,
          step: 'Article fixed successfully!',
          complete: true,
          result: {
            attempts: result.attempts,
            improvementHistory: result.improvementHistory,
            researchData: result.researchData,
            newQualityScore: newQualityReport.overallScore,
            newSeoScore: newSeoReport.seoScore,
            newSeoGrade: newSeoReport.grade,
            finalSEOScore: result.finalSEOScore,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('AI fix error:', error);
        sendEvent({
          error: error.message || 'Failed to fix article',
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
