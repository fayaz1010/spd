import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateBlogPostWorkflow } from '@/lib/ai-blog-workflow';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Start Batch Content Generation with SSE Progress Updates
 * POST /api/ai/strategy/[id]/start-generation
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
          step: 'Starting content generation...',
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
              step: `Generating pillar: ${pillar.title}`,
            });

            // Generate blog post
            const blogData = await generateBlogPostWorkflow({
              topic: pillar.title,
              keywords: [pillar.targetKeyword],
              targetLength: pillar.wordCount || 3000,
              tone: 'marketing',
              includePackages: true,
              targetAudience: strategy.targetAudience || 'Perth homeowners',
            });

            // Generate intelligent funnel placements
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `Optimizing funnels for: ${pillar.title}`,
            });

            const funnelPlacements = await generateFunnelPlacements(
              pillar.title,
              pillar.targetKeyword,
              (pillar.intent as any) || 'COMMERCIAL',
              'PILLAR',
              strategy.targetAudience || 'Perth homeowners'
            );

            // Insert funnel elements into content
            const contentWithFunnels = insertFunnelElements(blogData.content, funnelPlacements);

            // Create blog post
            const blogPost = await prisma.blogPost.create({
              data: {
                title: blogData.title,
                slug: blogData.slug,
                content: contentWithFunnels,
                excerpt: blogData.excerpt,
                metaTitle: blogData.title,
                metaDescription: blogData.metaDescription,
                keywords: blogData.keywords,
                status: 'DRAFT', // Save as draft initially
                author: 'Sun Direct Power',
              },
            });

            // Link pillar to blog post
            await prisma.pillar.update({
              where: { id: pillar.id },
              data: {
                blogPostId: blogPost.id,
                status: 'GENERATED',
                seoScore: blogData.seoScore,
                wordCount: blogData.content.split(' ').length,
              },
            });

            completedCount++;
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              article: {
                title: blogData.title,
                type: 'pillar',
                wordCount: blogData.content.split(' ').length,
                seoScore: blogData.seoScore,
              },
            });

            // Generate cluster articles for this pillar
            for (const cluster of pillar.clusters) {
              try {
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 100),
                  step: `Generating cluster: ${cluster.title}`,
                });

                const clusterBlogData = await generateBlogPostWorkflow({
                  topic: cluster.title,
                  keywords: [cluster.targetKeyword],
                  targetLength: cluster.wordCount || 1500,
                  tone: 'marketing',
                  includePackages: true,
                  targetAudience: strategy.targetAudience || 'Perth homeowners',
                });

                // Create blog post
                const clusterBlogPost = await prisma.blogPost.create({
                  data: {
                    title: clusterBlogData.title,
                    slug: clusterBlogData.slug,
                    content: clusterBlogData.content,
                    excerpt: clusterBlogData.excerpt,
                    metaTitle: clusterBlogData.title,
                    metaDescription: clusterBlogData.metaDescription,
                    keywords: clusterBlogData.keywords,
                    status: 'DRAFT',
                    author: 'Sun Direct Power',
                  },
                });

                // Link cluster to blog post
                await prisma.cluster.update({
                  where: { id: cluster.id },
                  data: {
                    blogPostId: clusterBlogPost.id,
                    status: 'GENERATED',
                    seoScore: clusterBlogData.seoScore,
                    wordCount: clusterBlogData.content.split(' ').length,
                  },
                });

                completedCount++;
                sendEvent({
                  progress: Math.round((completedCount / totalArticles) * 100),
                  article: {
                    title: clusterBlogData.title,
                    type: 'cluster',
                    wordCount: clusterBlogData.content.split(' ').length,
                    seoScore: clusterBlogData.seoScore,
                  },
                });
              } catch (error: any) {
                console.error(`Error generating cluster ${cluster.title}:`, error);
                sendEvent({
                  error: `Failed to generate: ${cluster.title}`,
                });
                completedCount++;
              }
            }
          } catch (error: any) {
            console.error(`Error generating pillar ${pillar.title}:`, error);
            sendEvent({
              error: `Failed to generate: ${pillar.title}`,
            });
            completedCount++;
          }
        }

        // Add internal links
        sendEvent({
          progress: 95,
          step: 'Adding internal links...',
        });

        await addInternalLinks(strategy);

        // Update strategy status
        await prisma.contentStrategy.update({
          where: { id: strategyId },
          data: {
            status: 'REVIEW',
            completedCount: totalArticles,
          },
        });

        sendEvent({
          progress: 100,
          step: 'Generation complete!',
          completed: true,
        });

        controller.close();
      } catch (error: any) {
        console.error('Generation error:', error);
        sendEvent({
          error: error.message || 'Generation failed',
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

/**
 * Add internal links between articles
 */
async function addInternalLinks(strategy: any) {
  for (const pillar of strategy.pillars) {
    if (!pillar.blogPostId) continue;

    // Link pillar to its clusters
    for (const cluster of pillar.clusters) {
      if (!cluster.blogPostId) continue;

      // Add link from cluster to pillar
      await prisma.internalLink.create({
        data: {
          fromPostId: cluster.blogPostId,
          toPostId: pillar.blogPostId,
          anchorText: pillar.title,
          placement: 'INTRO',
          linkType: 'CONTEXTUAL',
        },
      });

      // Update cluster's internal links JSON
      await prisma.cluster.update({
        where: { id: cluster.id },
        data: {
          internalLinks: [
            {
              toPostId: pillar.blogPostId,
              anchorText: pillar.title,
              placement: 'INTRO',
            },
          ],
        },
      });
    }
  }
}
