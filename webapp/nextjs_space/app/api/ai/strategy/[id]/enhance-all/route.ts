import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enhanceArticle } from '@/lib/article-enhancer';
import { generateAndUploadArticleImages } from '@/lib/image-generator';
import { researchKeywords, validateEEAT } from '@/lib/gemini-grounding';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Enhance All Articles with SSE Progress Updates
 * POST /api/ai/strategy/[id]/enhance-all
 * 
 * Steps:
 * 1. Clean & Format (remove HTML tags, fix lists/headings)
 * 2. Generate Images (hero + infographic)
 * 3. Embed Images in content
 * 4. Analyze Keywords
 * 5. Add Compliance (credentials, disclaimers, schema)
 * 6. Final validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id;

  // Set up SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Get strategy with all articles
        const strategy = await prisma.contentStrategy.findUnique({
          where: { id: strategyId },
          include: {
            pillars: {
              include: {
                blogPost: true,
              },
            },
          },
        });

        if (!strategy) {
          sendEvent({ error: 'Strategy not found' });
          controller.close();
          return;
        }

        // Get all blog posts from pillars and clusters
        const allPillars = strategy.pillars;
        const allClusters = strategy.pillars.flatMap((p: any) => p.clusters || []);
        
        // Get blog post IDs
        const blogPostIds = [
          ...allPillars.map((p: any) => p.blogPostId).filter(Boolean),
          ...allClusters.map((c: any) => c.blogPostId).filter(Boolean),
        ];

        const totalArticles = blogPostIds.length;

        if (totalArticles === 0) {
          sendEvent({
            error: 'No articles found to enhance',
            completed: true,
          });
          controller.close();
          return;
        }

        sendEvent({
          progress: 0,
          step: `Found ${totalArticles} articles to enhance`,
          totalArticles,
        });

        let completedCount = 0;
        const errors: string[] = [];

        // Process each article
        for (const blogPostId of blogPostIds) {
          try {
            const article = await prisma.blogPost.findUnique({
              where: { id: blogPostId },
            });

            if (!article) continue;

            // Skip if already enhanced
            if (article.status === 'ENHANCED' || article.status === 'PUBLISHED') {
              sendEvent({
                progress: Math.round((completedCount / totalArticles) * 100),
                step: `Skipping (already enhanced): ${article.title}`,
                article: {
                  title: article.title,
                  status: 'skipped',
                },
              });
              completedCount++;
              continue;
            }

            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Enhancing: ${article.title}`,
              article: {
                title: article.title,
                status: 'processing',
              },
            });

            // Step 1: Clean & Format
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Cleaning & formatting: ${article.title}`,
            });

            const enhancementResult = await enhanceArticle(
              article.id,
              article.content,
              {
                title: article.title,
                description: article.metaDescription || '',
                author: 'Sun Direct Power',
                datePublished: article.createdAt,
                dateModified: new Date(),
                keywords: article.keywords || [], // Pass keywords for smoothing
              },
              [] // Sources - could be extracted from article metadata
            );

            let enhancedContent = enhancementResult.content;

            // Step 2: Generate Images
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Generating images: ${article.title}`,
            });

            try {
              const { heroImageUrl, infographicUrl } = await generateAndUploadArticleImages(
                article.id,
                article.title,
                article.title, // Use title as topic
                undefined, // Use default hero prompt
                undefined  // Use default infographic prompt
              );

              // Step 3: Embed images in content
              // Insert hero image at the top
              const heroImageHtml = `\n\n<img src="${heroImageUrl}" alt="${article.title}" class="hero-image" style="width: 100%; max-width: 1200px; height: auto; border-radius: 12px; margin: 2rem 0;" />\n\n`;
              
              // Insert infographic in the middle (after first H2)
              const h2Index = enhancedContent.indexOf('<h2>');
              const infographicHtml = `\n\n<div class="infographic-container" style="text-align: center; margin: 3rem 0;">\n  <img src="${infographicUrl}" alt="${article.title} Infographic" style="max-width: 800px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />\n</div>\n\n`;
              
              if (h2Index > 0) {
                const beforeH2 = enhancedContent.substring(0, h2Index);
                const afterH2 = enhancedContent.substring(h2Index);
                
                // Find the end of the first section (next H2 or H3)
                const nextHeadingMatch = afterH2.match(/<h[23]>/);
                if (nextHeadingMatch && nextHeadingMatch.index) {
                  const insertPoint = h2Index + nextHeadingMatch.index;
                  enhancedContent = 
                    heroImageHtml +
                    enhancedContent.substring(0, insertPoint) +
                    infographicHtml +
                    enhancedContent.substring(insertPoint);
                } else {
                  enhancedContent = heroImageHtml + enhancedContent + infographicHtml;
                }
              } else {
                enhancedContent = heroImageHtml + enhancedContent + infographicHtml;
              }

              // Update article with images
              await prisma.blogPost.update({
                where: { id: article.id },
                data: {
                  featuredImage: heroImageUrl,
                },
              });

            } catch (imageError) {
              console.error(`Image generation failed for ${article.title}:`, imageError);
              errors.push(`Image generation failed: ${article.title}`);
              // Continue without images
            }

            // Step 4: Keyword Analysis (optional - can be slow)
            // Uncomment if you want keyword analysis
            /*
            try {
              const keywordData = await researchKeywords(article.title, 'Perth, Western Australia');
              sendEvent({
                progress: Math.round((completedCount / totalArticles) * 100),
                step: `Analyzed ${keywordData.keywords.length} keywords for: ${article.title}`,
              });
            } catch (keywordError) {
              console.error(`Keyword analysis failed for ${article.title}:`, keywordError);
            }
            */

            // Step 5: Update article with enhanced content and set status to ENHANCED
            await prisma.blogPost.update({
              where: { id: article.id },
              data: {
                content: enhancedContent,
                status: 'ENHANCED',
                updatedAt: new Date(),
              },
            });

            completedCount++;
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              article: {
                title: article.title,
                status: 'completed',
                changes: enhancementResult.changes,
                eeatScore: enhancementResult.eeatScore,
              },
            });

          } catch (error: any) {
            console.error(`Error enhancing article:`, error);
            errors.push(`Failed to enhance article`);
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              article: {
                title: 'Unknown',
                status: 'error',
                error: error.message,
              },
            });
          }
        }

        // Send completion
        sendEvent({
          progress: 100,
          step: 'Enhancement complete!',
          completed: true,
          successCount: completedCount,
          errorCount: errors.length,
          errors,
        });

        controller.close();
      } catch (error: any) {
        console.error('Enhancement error:', error);
        sendEvent({ error: error.message });
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
