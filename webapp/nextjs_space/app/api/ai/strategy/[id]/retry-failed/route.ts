import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateBlogPostWorkflow } from '@/lib/ai-blog-workflow';
import { generateFunnelPlacements, insertFunnelElements } from '@/lib/ai-funnel-placement';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * Retry Failed Articles with SSE Progress Updates
 * POST /api/ai/strategy/[id]/retry-failed
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
        // Get strategy with failed articles
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

        // Find failed articles (no blogPostId)
        const failedPillars = strategy.pillars.filter(p => !p.blogPostId);
        const failedClusters = strategy.pillars.flatMap(p => 
          p.clusters.filter(c => !c.blogPostId)
        );

        const totalFailed = failedPillars.length + failedClusters.length;

        if (totalFailed === 0) {
          sendEvent({
            progress: 100,
            step: 'No failed articles to retry',
            completed: true,
          });
          controller.close();
          return;
        }

        sendEvent({
          progress: 0,
          step: `Found ${totalFailed} failed articles to retry`,
          totalFailed,
        });

        let completedCount = 0;
        const errors: string[] = [];

        // Retry failed pillars
        for (const pillar of failedPillars) {
          try {
            sendEvent({
              progress: Math.round((completedCount / totalFailed) * 100),
              step: `Retrying pillar: ${pillar.title}`,
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

            // Generate funnel placements
            const funnelPlacements = await generateFunnelPlacements(
              pillar.title,
              pillar.targetKeyword,
              (pillar.intent as any) || 'COMMERCIAL',
              'PILLAR',
              strategy.targetAudience || 'Perth homeowners'
            );

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
                status: 'DRAFT',
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
              progress: Math.round((completedCount / totalFailed) * 100),
              article: {
                title: pillar.title,
                type: 'pillar',
                success: true,
              },
            });
          } catch (error: any) {
            console.error(`Error retrying pillar ${pillar.title}:`, error);
            errors.push(`Failed to retry: ${pillar.title}`);
            sendEvent({
              progress: Math.round((completedCount / totalFailed) * 100),
              article: {
                title: pillar.title,
                type: 'pillar',
                success: false,
                error: error.message,
              },
            });
          }
        }

        // Retry failed clusters
        for (const cluster of failedClusters) {
          try {
            sendEvent({
              progress: Math.round((completedCount / totalFailed) * 100),
              step: `Retrying cluster: ${cluster.title}`,
            });

            // Generate blog post
            const blogData = await generateBlogPostWorkflow({
              topic: cluster.title,
              keywords: [cluster.targetKeyword],
              targetLength: cluster.wordCount || 1500,
              tone: 'marketing',
              includePackages: true,
              targetAudience: strategy.targetAudience || 'Perth homeowners',
            });

            // Generate funnel placements
            const funnelPlacements = await generateFunnelPlacements(
              cluster.title,
              cluster.targetKeyword,
              (cluster.intent as any) || 'INFORMATIONAL',
              'CLUSTER',
              strategy.targetAudience || 'Perth homeowners'
            );

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
                status: 'DRAFT',
                author: 'Sun Direct Power',
              },
            });

            // Link cluster to blog post
            await prisma.cluster.update({
              where: { id: cluster.id },
              data: {
                blogPostId: blogPost.id,
                status: 'GENERATED',
                seoScore: blogData.seoScore,
                wordCount: blogData.content.split(' ').length,
              },
            });

            completedCount++;
            sendEvent({
              progress: Math.round((completedCount / totalFailed) * 100),
              article: {
                title: cluster.title,
                type: 'cluster',
                success: true,
              },
            });
          } catch (error: any) {
            console.error(`Error retrying cluster ${cluster.title}:`, error);
            errors.push(`Failed to retry: ${cluster.title}`);
            sendEvent({
              progress: Math.round((completedCount / totalFailed) * 100),
              article: {
                title: cluster.title,
                type: 'cluster',
                success: false,
                error: error.message,
              },
            });
          }
        }

        // Send completion
        sendEvent({
          progress: 100,
          step: 'Retry complete!',
          completed: true,
          successCount: completedCount,
          errorCount: errors.length,
          errors,
        });

        controller.close();
      } catch (error: any) {
        console.error('Retry error:', error);
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
