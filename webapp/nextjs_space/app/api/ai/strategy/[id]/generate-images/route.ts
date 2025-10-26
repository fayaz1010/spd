import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAndUploadArticleImages } from '@/lib/image-generator';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Generate and embed images for all articles in a strategy
 * Run this AFTER content generation is complete
 * 
 * POST /api/ai/strategy/[id]/generate-images
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
          throw new Error('Strategy not found');
        }

        sendEvent({
          progress: 0,
          step: 'Starting image generation...',
        });

        const totalArticles = strategy.pillars.length + 
          strategy.pillars.reduce((sum, p) => sum + p.clusters.length, 0);
        
        let completedCount = 0;

        // Generate images for pillars
        for (const pillar of strategy.pillars) {
          try {
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

            // Update blog post with images
            if (pillar.blogPostId) {
              await prisma.blogPost.update({
                where: { id: pillar.blogPostId },
                data: {
                  heroImageUrl: images.heroUrl || null,
                  infographicUrl: images.infographicUrl || null,
                },
              });
            }

            // Update pillar record
            await prisma.pillar.update({
              where: { id: pillar.id },
              data: {
                heroImageUrl: images.heroUrl || null,
                infographicUrl: images.infographicUrl || null,
              },
            });

            completedCount++;
            sendEvent({
              progress: Math.round((completedCount / totalArticles) * 100),
              step: `✅ Images generated for: ${pillar.title}`,
            });

          } catch (error: any) {
            console.error(`Image generation error (${pillar.title}):`, error);
            sendEvent({
              warning: {
                article: pillar.title,
                message: `Failed to generate images: ${error.message}`,
              },
            });
            completedCount++;
          }

          // Generate images for clusters
          for (const cluster of pillar.clusters) {
            try {
              sendEvent({
                progress: Math.round((completedCount / totalArticles) * 100),
                step: `Generating images for: ${cluster.title}`,
              });

              const clusterImages = await generateAndUploadArticleImages(
                cluster.id,
                cluster.title,
                cluster.title,
                cluster.heroImagePrompt || undefined,
                cluster.infographicPrompt || undefined
              );

              // Update blog post with images
              if (cluster.blogPostId) {
                await prisma.blogPost.update({
                  where: { id: cluster.blogPostId },
                  data: {
                    heroImageUrl: clusterImages.heroUrl || null,
                    infographicUrl: clusterImages.infographicUrl || null,
                  },
                });
              }

              // Update cluster record
              await prisma.cluster.update({
                where: { id: cluster.id },
                data: {
                  heroImageUrl: clusterImages.heroUrl || null,
                  infographicUrl: clusterImages.infographicUrl || null,
                },
              });

              completedCount++;
              sendEvent({
                progress: Math.round((completedCount / totalArticles) * 100),
                step: `✅ Images generated for: ${cluster.title}`,
              });

            } catch (error: any) {
              console.error(`Image generation error (${cluster.title}):`, error);
              sendEvent({
                warning: {
                  article: cluster.title,
                  message: `Failed to generate images: ${error.message}`,
                },
              });
              completedCount++;
            }
          }
        }

        sendEvent({
          completed: true,
          progress: 100,
          step: 'All images generated successfully!',
          summary: {
            total: totalArticles,
            completed: completedCount,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('Image generation error:', error);
        sendEvent({
          error: error.message || 'Failed to generate images',
        });
        controller.close();
      } finally {
        await prisma.$disconnect();
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
