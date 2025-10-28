/**
 * Strategy Image Generator
 * 
 * Generates and embeds images for all articles in a strategy
 * Wraps the existing image generation functionality
 */

import { prisma } from '@/lib/prisma';
import { generateAndUploadArticleImages } from '@/lib/image-generator';

export interface ImageGenerationResult {
  success: boolean;
  totalImages: number;
  successCount: number;
  failedCount: number;
  failedArticles: Array<{ title: string; error: string }>;
}

/**
 * Generate images for all articles in a strategy
 */
export async function generateAllImages(
  strategyId: string,
  onProgress?: (progress: number, step: string) => void
): Promise<ImageGenerationResult> {
  console.log(`🖼️  Generating images for strategy ${strategyId}...`);

  const result: ImageGenerationResult = {
    success: true,
    totalImages: 0,
    successCount: 0,
    failedCount: 0,
    failedArticles: [],
  };

  try {
    // Get strategy with pillars and clusters
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

    const totalArticles =
      strategy.pillars.length +
      strategy.pillars.reduce((sum, p) => sum + p.clusters.length, 0);

    result.totalImages = totalArticles * 2; // Hero + infographic per article

    let completedCount = 0;

    // Generate images for pillars
    for (const pillar of strategy.pillars) {
      try {
        if (onProgress) {
          onProgress(
            (completedCount / totalArticles) * 100,
            `Generating images for: ${pillar.title}`
          );
        }

        // Generate images
        const images = await generateAndUploadArticleImages(
          pillar.id,
          pillar.title,
          pillar.title,
          pillar.heroImagePrompt || undefined,
          pillar.infographicPrompt || undefined
        );

        // Update blog post
        if (pillar.blogPostId) {
          await prisma.blogPost.update({
            where: { id: pillar.blogPostId },
            data: {
              heroImageUrl: images.heroUrl || null,
              infographicUrl: images.infographicUrl || null,
            },
          });
        }

        // Update pillar
        await prisma.pillar.update({
          where: { id: pillar.id },
          data: {
            heroImageUrl: images.heroUrl || null,
            infographicUrl: images.infographicUrl || null,
          },
        });

        result.successCount += 2; // Hero + infographic
        completedCount++;

        if (onProgress) {
          onProgress(
            (completedCount / totalArticles) * 100,
            `✅ Images for: ${pillar.title}`
          );
        }

        console.log(`   ✅ Generated images for pillar: ${pillar.title}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to generate images for pillar ${pillar.title}:`, error);
        result.failedCount += 2;
        result.failedArticles.push({
          title: pillar.title,
          error: error.message || 'Unknown error',
        });
        completedCount++;
      }
    }

    // Generate images for clusters
    for (const pillar of strategy.pillars) {
      for (const cluster of pillar.clusters) {
        try {
          if (onProgress) {
            onProgress(
              (completedCount / totalArticles) * 100,
              `Generating images for: ${cluster.title}`
            );
          }

          // Generate images
          const images = await generateAndUploadArticleImages(
            cluster.id,
            cluster.title,
            cluster.title,
            cluster.heroImagePrompt || undefined,
            cluster.infographicPrompt || undefined
          );

          // Update blog post
          if (cluster.blogPostId) {
            await prisma.blogPost.update({
              where: { id: cluster.blogPostId },
              data: {
                heroImageUrl: images.heroUrl || null,
                infographicUrl: images.infographicUrl || null,
              },
            });
          }

          // Update cluster
          await prisma.cluster.update({
            where: { id: cluster.id },
            data: {
              heroImageUrl: images.heroUrl || null,
              infographicUrl: images.infographicUrl || null,
            },
          });

          result.successCount += 2; // Hero + infographic
          completedCount++;

          if (onProgress) {
            onProgress(
              (completedCount / totalArticles) * 100,
              `✅ Images for: ${cluster.title}`
            );
          }

          console.log(`   ✅ Generated images for cluster: ${cluster.title}`);
        } catch (error: any) {
          console.error(`   ❌ Failed to generate images for cluster ${cluster.title}:`, error);
          result.failedCount += 2;
          result.failedArticles.push({
            title: cluster.title,
            error: error.message || 'Unknown error',
          });
          completedCount++;
        }
      }
    }

    result.success = result.failedCount === 0;

    console.log(`✅ Image generation complete: ${result.successCount}/${result.totalImages} images generated`);

    if (result.failedCount > 0) {
      console.log(`⚠️  ${result.failedCount} images failed to generate`);
    }

    return result;
  } catch (error: any) {
    console.error('Image generation error:', error);
    result.success = false;
    return result;
  }
}

/**
 * Check if all articles in a strategy have images
 */
export async function checkImagesComplete(strategyId: string): Promise<{
  complete: boolean;
  totalArticles: number;
  withImages: number;
  missingImages: Array<{ title: string; missing: string[] }>;
}> {
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

  const result = {
    complete: true,
    totalArticles: 0,
    withImages: 0,
    missingImages: [] as Array<{ title: string; missing: string[] }>,
  };

  // Check pillars
  for (const pillar of strategy.pillars) {
    result.totalArticles++;

    const missing: string[] = [];
    if (!pillar.heroImageUrl) missing.push('hero');
    if (!pillar.infographicUrl) missing.push('infographic');

    if (missing.length === 0) {
      result.withImages++;
    } else {
      result.complete = false;
      result.missingImages.push({
        title: pillar.title,
        missing,
      });
    }
  }

  // Check clusters
  for (const pillar of strategy.pillars) {
    for (const cluster of pillar.clusters) {
      result.totalArticles++;

      const missing: string[] = [];
      if (!cluster.heroImageUrl) missing.push('hero');
      if (!cluster.infographicUrl) missing.push('infographic');

      if (missing.length === 0) {
        result.withImages++;
      } else {
        result.complete = false;
        result.missingImages.push({
          title: cluster.title,
          missing,
        });
      }
    }
  }

  return result;
}
