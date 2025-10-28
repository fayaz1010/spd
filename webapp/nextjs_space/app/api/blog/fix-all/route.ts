import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { batchScanBlogPosts, getRecommendedAction } from '@/lib/blog-quality-scanner';
import { optimizeArticleSEO } from '@/lib/ai-seo-optimizer';
import { ensureHTML } from '@/lib/markdown-converter';
import { formatTables, validateAndFixTables } from '@/lib/table-formatter';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';
import { polishArticle } from '@/lib/article-polisher';
import { scanBlogPost } from '@/lib/blog-quality-scanner';
import { scanBlogSEO } from '@/lib/blog-seo-scanner';
import { applyAllQualityFixes } from '@/lib/content-quality-fixer';

// Helper function to add schema markup
function addSchemaMarkup(content: string, title: string): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
  };
  return content + `\n\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch operations

/**
 * Fix all blog posts with issues
 * POST /api/blog/fix-all
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Get all blog posts
        const posts = await prisma.blogPost.findMany({
          select: {
            id: true,
            title: true,
            content: true,
            status: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        sendEvent({
          progress: 5,
          step: `Scanning ${posts.length} blog posts...`,
        });

        // Scan all posts
        const reports = await batchScanBlogPosts(posts);

        // Filter posts that need fixing
        const postsNeedingFix = reports.filter(r => 
          r.needsRegeneration || r.needsEnhancement
        );

        sendEvent({
          progress: 10,
          step: `Found ${postsNeedingFix.length} posts needing fixes`,
          summary: {
            total: posts.length,
            needsFix: postsNeedingFix.length,
            needsRegeneration: reports.filter(r => r.needsRegeneration).length,
            needsEnhancement: reports.filter(r => r.needsEnhancement).length,
          },
        });

        if (postsNeedingFix.length === 0) {
          sendEvent({
            progress: 100,
            step: 'No posts need fixing!',
            complete: true,
          });
          controller.close();
          return;
        }

        // Process each post
        let completed = 0;
        const results = {
          regenerated: [] as string[],
          enhanced: [] as string[],
          failed: [] as { id: string; error: string }[],
        };

        for (const report of postsNeedingFix) {
          const action = getRecommendedAction(report);
          const progressPercent = 10 + Math.round((completed / postsNeedingFix.length) * 85);

          try {
            // Try AI SEO optimization first for all articles
            if (report.needsEnhancement || action === 'ENHANCE') {
              sendEvent({
                progress: progressPercent,
                step: `AI Optimizing: ${report.postTitle}`,
              });

              // Get the post
              const post = await prisma.blogPost.findUnique({
                where: { id: report.postId },
              });

              if (!post) {
                throw new Error('Post not found');
              }

              const targetKeyword = post.keywords?.[0] || '';

              // Run AI SEO Optimizer (5 retries to reach 95%)
              const seoResult = await optimizeArticleSEO(
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
                  sendEvent({
                    progress: progressPercent,
                    step: `${report.postTitle} - Attempt ${attempt}/5 (${score}%)`,
                  });
                }
              );

              let enhancedContent = seoResult.optimizedContent;

              // Apply technical SEO enhancements
              enhancedContent = ensureHTML(enhancedContent);
              enhancedContent = validateAndFixTables(enhancedContent);
              enhancedContent = formatTables(enhancedContent);

              // Add CTAs if missing
              const hasCTAs = enhancedContent.includes('Discover Your Solar Potential') || 
                              enhancedContent.includes('Calculate My Savings');
              
              if (!hasCTAs) {
                const funnelPlacements = await generateFunnelPlacements(
                  post.title,
                  targetKeyword,
                  'COMMERCIAL',
                  'CLUSTER',
                  'Perth homeowners'
                );
                enhancedContent = insertFunnelElements(enhancedContent, funnelPlacements);
              }

              // Add schema markup if missing
              if (!enhancedContent.includes('application/ld+json')) {
                enhancedContent = addSchemaMarkup(enhancedContent, post.title);
              }

              // Final polish
              const polished = polishArticle(enhancedContent);
              enhancedContent = polished.content;

              // Apply quality fixes (HTML entities, contact info, sources)
              enhancedContent = await applyAllQualityFixes(enhancedContent);

              // Generate images if missing
              sendEvent({
                progress: progressPercent + 2,
                step: `${report.postTitle} - Generating images...`,
              });

              try {
                const { generateAndUploadArticleImages } = await import('@/lib/image-generator');
                
                // Check if images already exist
                if (!(post as any).heroImageUrl || !(post as any).infographicUrl) {
                  const images = await generateAndUploadArticleImages(
                    post.id,
                    post.title,
                    post.title
                  );

                  // Update post with images
                  await prisma.blogPost.update({
                    where: { id: post.id },
                    data: {
                      heroImageUrl: images.heroImageUrl || (post as any).heroImageUrl,
                      infographicUrl: images.infographicUrl || (post as any).infographicUrl,
                    } as any,
                  });

                  sendEvent({
                    progress: progressPercent + 3,
                    step: `${report.postTitle} - ✅ Images generated`,
                  });
                } else {
                  sendEvent({
                    progress: progressPercent + 3,
                    step: `${report.postTitle} - Images already exist`,
                  });
                }
              } catch (imageError) {
                console.error('Image generation error:', imageError);
                sendEvent({
                  progress: progressPercent + 3,
                  step: `${report.postTitle} - ⚠️ Image generation failed`,
                });
              }

              // Re-scan the enhanced content
              const qualityReport = scanBlogPost(enhancedContent, post.title, post.id);
              const seoReport = scanBlogSEO(enhancedContent, post.title, post.id, {
                metaTitle: post.metaTitle,
                metaDescription: post.metaDescription,
                keywords: post.keywords,
                targetKeyword,
                slug: post.slug,
                includeInternalLinks: false, // Phase 1 & 2
              });

              // Update the post (keep current status - don't auto-publish)
              await prisma.blogPost.update({
                where: { id: report.postId },
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
                } as any,
              });

              results.enhanced.push(report.postTitle);
              
            } else if (action === 'REGENERATE') {
              // Skip regeneration in batch - too resource intensive
              sendEvent({
                progress: progressPercent,
                step: `${report.postTitle} needs regeneration - use individual button`,
              });
              
              results.failed.push({
                id: report.postId,
                error: 'Needs full regeneration - use individual regenerate button',
              });
            }

            completed++;
          } catch (error: any) {
            console.error(`Error fixing ${report.postTitle}:`, error);
            results.failed.push({
              id: report.postId,
              error: error.message,
            });
            completed++;
          }

          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        sendEvent({
          progress: 100,
          step: 'All fixes complete!',
          complete: true,
          results: {
            regenerated: results.regenerated.length,
            enhanced: results.enhanced.length,
            failed: results.failed.length,
          },
          details: results,
        });

        controller.close();
      } catch (error: any) {
        console.error('Fix all error:', error);
        sendEvent({
          error: error.message || 'Failed to fix posts',
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
