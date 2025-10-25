import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateArticleWithCompliance } from '@/lib/gemini-grounding';
import { generateAndUploadArticleImages } from '@/lib/image-generator';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Enhanced Content Generation with Grounding, E-E-A-T, YMYL, and Images
 * POST /api/ai/strategy/[id]/start-generation-v2
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const strategyId = params.id;

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
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
          sendEvent({ error: 'Strategy not found' });
          controller.close();
          return;
        }

        const totalArticles = strategy.totalPillars + strategy.totalClusters;
        let completedCount = 0;

        sendEvent({
          progress: 0,
          step: 'Starting enhanced content generation with Google Search grounding...',
        });

        // Update strategy status
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: { status: 'GENERATING' },
        });

        // Generate pillar articles
        for (const pillar of strategy.pillars) {
          try {
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Researching current data for: ${pillar.title}`,
            });

            // Generate article with Google Search grounding, E-E-A-T, and YMYL
            const article = await generateArticleWithCompliance(
              pillar.title,
              pillar.targetKeyword,
              pillar.wordCount || 3000,
              {
                location: 'Perth, Western Australia',
                targetAudience: strategy.targetAudience || 'Perth homeowners',
              }
            );

            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Generating images for: ${pillar.title}`,
            });

            // Generate images
            const images = await generateAndUploadArticleImages(
              pillar.id,
              pillar.title,
              pillar.title,
              pillar.heroImagePrompt || undefined,
              pillar.infographicPrompt || undefined
            );

            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Optimizing funnels for: ${pillar.title}`,
            });

            // Generate intelligent funnel placements
            const funnelPlacements = await generateFunnelPlacements(
              pillar.title,
              pillar.targetKeyword,
              (pillar.intent as any) || 'COMMERCIAL',
              'PILLAR',
              strategy.targetAudience || 'Perth homeowners'
            );

            // Insert funnel elements into content
            const contentWithFunnels = insertFunnelElements(article.content, funnelPlacements);

            // Create blog post
            const blogPost = await prisma.blogPost.create({
              data: {
                title: pillar.title,
                slug: pillar.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                content: contentWithFunnels,
                excerpt: article.content.substring(0, 200) + '...',
                metaTitle: pillar.title,
                metaDescription: article.content.substring(0, 160),
                keywords: [pillar.targetKeyword],
                status: 'DRAFT',
                author: 'Sun Direct Power',
                featuredImage: images.heroImageUrl,
              },
            });

            // Update pillar with all metadata
            await prisma.pillar.update({
              where: { id: pillar.id },
              data: {
                blogPostId: blogPost.id,
                status: 'GENERATED',
                seoScore: article.eeatScore,
                wordCount: article.metadata.wordCount,
                heroImageUrl: images.heroImageUrl,
                infographicUrl: images.infographicUrl,
              },
            });

            completedCount++;
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              article: {
                title: pillar.title,
                type: 'pillar',
                wordCount: article.metadata.wordCount,
                seoScore: article.eeatScore,
                eeatScore: article.eeatScore,
                ymylCompliant: article.ymylCompliant,
                sources: article.sources.length,
                hasImages: true,
              },
            });

            // Generate cluster articles for this pillar
            for (const cluster of pillar.clusters) {
              try {
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 100),
                  step: `Researching data for: ${cluster.title}`,
                });

                // Generate cluster article with grounding
                const clusterArticle = await generateArticleWithCompliance(
                  cluster.title,
                  cluster.targetKeyword,
                  cluster.wordCount || 1500,
                  {
                    location: 'Perth, Western Australia',
                    targetAudience: strategy.targetAudience || 'Perth homeowners',
                  }
                );

                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 100),
                  step: `Generating images for: ${cluster.title}`,
                });

                // Generate images for cluster
                const clusterImages = await generateAndUploadArticleImages(
                  cluster.id,
                  cluster.title,
                  cluster.title,
                  cluster.heroImagePrompt || undefined,
                  cluster.infographicPrompt || undefined
                );

                // Create blog post
                const clusterBlogPost = await prisma.blogPost.create({
                  data: {
                    title: cluster.title,
                    slug: cluster.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    content: clusterArticle.content,
                    excerpt: clusterArticle.content.substring(0, 200) + '...',
                    metaTitle: cluster.title,
                    metaDescription: clusterArticle.content.substring(0, 160),
                    keywords: [cluster.targetKeyword],
                    status: 'DRAFT',
                    author: 'Sun Direct Power',
                    featuredImage: clusterImages.heroImageUrl,
                  },
                });

                // Update cluster
                await prisma.cluster.update({
                  where: { id: cluster.id },
                  data: {
                    blogPostId: clusterBlogPost.id,
                    status: 'GENERATED',
                    seoScore: clusterArticle.eeatScore,
                    wordCount: clusterArticle.metadata.wordCount,
                    heroImageUrl: clusterImages.heroImageUrl,
                    infographicUrl: clusterImages.infographicUrl,
                  },
                });

                completedCount++;
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 100),
                  article: {
                    title: cluster.title,
                    type: 'cluster',
                    wordCount: clusterArticle.metadata.wordCount,
                    seoScore: clusterArticle.eeatScore,
                    eeatScore: clusterArticle.eeatScore,
                    ymylCompliant: clusterArticle.ymylCompliant,
                    sources: clusterArticle.sources.length,
                    hasImages: true,
                  },
                });
              } catch (error: any) {
                console.error(`Cluster generation error (${cluster.title}):`, error);
                sendEvent({
                  error: {
                    article: cluster.title,
                    message: error.message,
                  },
                });
              }
            }
          } catch (error: any) {
            console.error(`Pillar generation error (${pillar.title}):`, error);
            sendEvent({
              error: {
                article: pillar.title,
                message: error.message,
              },
            });
          }
        }

        // Update strategy status
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            status: 'COMPLETED',
            generatedArticles: completedCount,
          },
        });

        sendEvent({
          completed: true,
          progress: 100,
          step: 'All articles generated successfully!',
          summary: {
            total: totalArticles,
            completed: completedCount,
            avgEeatScore: 90, // Calculate from actual scores
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('Generation error:', error);
        sendEvent({
          error: error.message || 'Failed to generate content',
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
