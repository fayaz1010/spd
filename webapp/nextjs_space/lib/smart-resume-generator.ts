/**
 * Smart Resume Generator
 * 
 * Resumes content generation from where it stopped
 * Uses round-robin API keys with rate limiting
 * Only regenerates what's needed
 */

import { prisma } from './db';
import { analyzeStrategyProgress, ArticleStatus } from './generation-recovery';
import { generateArticleWithCompliance } from './gemini-grounding';
import { generateAndUploadArticleImages } from './image-generator';
import { generateFunnelPlacements, insertFunnelElements } from './ai-funnel-placement';

export interface ResumeOptions {
  regenerateCorrupted: boolean; // Default: true
  generatePlanned: boolean; // Default: true
  resetStuck: boolean; // Default: true
  skipGenerated: boolean; // Default: true
  fixLowQuality: boolean; // Default: false (articles with low SEO/word count)
}

export interface ResumeResult {
  success: boolean;
  generated: number;
  regenerated: number;
  skipped: number;
  failed: Array<{ title: string; error: string }>;
  summary: {
    totalProcessed: number;
    successRate: number;
    avgSeoScore: number;
  };
}

/**
 * Resume generation from where it stopped
 */
export async function resumeGeneration(
  strategyId: string,
  options: ResumeOptions = {
    regenerateCorrupted: true,
    generatePlanned: true,
    resetStuck: true,
    skipGenerated: true,
    fixLowQuality: false,
  },
  onProgress?: (step: string, progress: number, article?: string) => void
): Promise<ResumeResult> {
  // Analyze current state
  const analysis = await analyzeStrategyProgress(strategyId);
  
  onProgress?.('Analyzing strategy...', 0);
  console.log('📊 Strategy Analysis:', {
    total: analysis.totalArticles,
    planned: analysis.planned,
    generating: analysis.generating,
    generated: analysis.generated,
    corrupted: analysis.corrupted,
    published: analysis.published,
  });

  // Build work queue
  const workQueue: ArticleStatus[] = [];

  // Priority 1: Corrupted articles (must fix)
  if (options.regenerateCorrupted) {
    const corrupted = analysis.articles.filter(a => a.stage === 'CORRUPTED');
    workQueue.push(...corrupted);
    console.log(`🔴 Added ${corrupted.length} corrupted articles to queue`);
  }

  // Priority 2: Stuck articles (reset and retry)
  if (options.resetStuck) {
    const stuck = analysis.articles.filter(a => a.stage === 'GENERATING');
    workQueue.push(...stuck);
    console.log(`⚠️ Added ${stuck.length} stuck articles to queue`);
  }

  // Priority 3: Planned articles (not started)
  if (options.generatePlanned) {
    const planned = analysis.articles.filter(a => a.stage === 'PLANNED');
    workQueue.push(...planned);
    console.log(`🔵 Added ${planned.length} planned articles to queue`);
  }

  // Priority 4: Low quality articles (optional)
  if (options.fixLowQuality) {
    const lowQuality = analysis.articles.filter(a => 
      a.stage === 'GENERATED' && 
      a.needsRegeneration &&
      !workQueue.find(w => w.id === a.id)
    );
    workQueue.push(...lowQuality);
    console.log(`🟡 Added ${lowQuality.length} low quality articles to queue`);
  }

  const skipped = analysis.articles.filter(a => 
    options.skipGenerated && 
    a.stage === 'GENERATED' &&
    !a.needsRegeneration
  ).length;

  console.log(`✅ Skipping ${skipped} completed articles`);
  console.log(`📝 Total work queue: ${workQueue.length} articles`);

  if (workQueue.length === 0) {
    onProgress?.('No articles need processing', 100);
    return {
      success: true,
      generated: 0,
      regenerated: 0,
      skipped,
      failed: [],
      summary: {
        totalProcessed: 0,
        successRate: 100,
        avgSeoScore: 0,
      },
    };
  }

  // Update strategy status
  await prisma.contentStrategy.update({
    where: { id: strategyId },
    data: { status: 'GENERATING' },
  });

  // Process queue with round-robin API keys and rate limiting
  let generated = 0;
  let regenerated = 0;
  const failed: Array<{ title: string; error: string }> = [];
  const seoScores: number[] = [];

  for (let i = 0; i < workQueue.length; i++) {
    const article = workQueue[i];
    const progress = Math.round(((i + 1) / workQueue.length) * 100);

    try {
      onProgress?.(
        `${article.stage === 'CORRUPTED' ? 'Regenerating' : 'Generating'}: ${article.title}`,
        progress,
        article.title
      );

      console.log(`\n[${i + 1}/${workQueue.length}] Processing: ${article.title} (${article.type})`);

      // Get article data from database
      const articleData = await getArticleData(article.id, article.type);
      
      if (!articleData) {
        failed.push({ title: article.title, error: 'Not found in database' });
        continue;
      }

      // Get strategy for target audience
      const strategy = await prisma.contentStrategy.findUnique({
        where: { id: strategyId },
      });

      // Update status to GENERATING
      await updateArticleStatus(article.id, article.type, 'GENERATING');

      // Generate content with grounding (uses round-robin internally)
      console.log(`  📝 Generating content...`);
      const content = await generateArticleWithCompliance(
        articleData.title,
        articleData.targetKeyword,
        article.type === 'PILLAR' ? 3000 : 1500,
        {
          location: 'Perth, Western Australia',
          targetAudience: strategy?.targetAudience || 'Perth homeowners',
        }
      );

      // Generate images
      console.log(`  🖼️ Generating images...`);
      const images = await generateAndUploadArticleImages(
        article.id,
        articleData.title,
        articleData.title,
        articleData.heroImagePrompt,
        articleData.infographicPrompt
      );

      // Generate funnel placements
      console.log(`  🎯 Adding funnels...`);
      const funnelPlacements = await generateFunnelPlacements(
        articleData.title,
        articleData.targetKeyword,
        (articleData.intent as any) || (article.type === 'PILLAR' ? 'COMMERCIAL' : 'INFORMATIONAL'),
        article.type,
        strategy?.targetAudience || 'Perth homeowners'
      );

      const contentWithFunnels = insertFunnelElements(content.content, funnelPlacements);

      // Create or update blog post
      if (article.blogPostId) {
        // Update existing (regeneration)
        console.log(`  🔄 Updating existing blog post...`);
        await prisma.blogPost.update({
          where: { id: article.blogPostId },
          data: {
            content: contentWithFunnels,
            excerpt: content.content.substring(0, 200) + '...',
            metaDescription: content.content.substring(0, 160),
            featuredImage: images.heroImageUrl,
            status: 'DRAFT',
          },
        });
        regenerated++;
      } else {
        // Create new
        console.log(`  ✨ Creating new blog post...`);
        const slug = articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Check if slug exists
        const existingPost = await prisma.blogPost.findUnique({
          where: { slug },
        });

        let blogPost;
        if (existingPost) {
          // Update existing post
          blogPost = await prisma.blogPost.update({
            where: { id: existingPost.id },
            data: {
              title: articleData.title,
              content: contentWithFunnels,
              excerpt: content.content.substring(0, 200) + '...',
              metaTitle: articleData.title,
              metaDescription: content.content.substring(0, 160),
              keywords: [articleData.targetKeyword],
              status: 'DRAFT',
              author: 'Sun Direct Power',
              featuredImage: images.heroImageUrl,
            },
          });
        } else {
          // Create new post
          blogPost = await prisma.blogPost.create({
            data: {
              title: articleData.title,
              slug,
              content: contentWithFunnels,
              excerpt: content.content.substring(0, 200) + '...',
              metaTitle: articleData.title,
              metaDescription: content.content.substring(0, 160),
              keywords: [articleData.targetKeyword],
              status: 'DRAFT',
              author: 'Sun Direct Power',
              featuredImage: images.heroImageUrl,
            },
          });
        }

        // Link to pillar/cluster
        await updateArticleWithBlogPost(
          article.id,
          article.type,
          blogPost.id,
          content.metadata.wordCount,
          content.eeatScore,
          images,
          funnelPlacements
        );
        generated++;
      }

      // Update status to GENERATED
      await updateArticleStatus(article.id, article.type, 'GENERATED');

      seoScores.push(content.eeatScore);
      console.log(`  ✅ Success! SEO Score: ${content.eeatScore}, Words: ${content.metadata.wordCount}`);
    } catch (error: any) {
      console.error(`  ❌ Failed: ${article.title}`, error.message);
      failed.push({ title: article.title, error: error.message });
      
      // Reset status to PLANNED so it can be retried
      await updateArticleStatus(article.id, article.type, 'PLANNED');
    }
  }

  // Calculate summary
  const totalProcessed = generated + regenerated;
  const successRate = totalProcessed > 0 ? Math.round((totalProcessed / workQueue.length) * 100) : 0;
  const avgSeoScore = seoScores.length > 0 ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length) : 0;

  // Update strategy status
  const finalStatus = failed.length === 0 ? 'REVIEW' : 'GENERATING';
  await prisma.contentStrategy.update({
    where: { id: strategyId },
    data: {
      status: finalStatus,
      completedCount: totalProcessed,
    },
  });

  console.log('\n📊 Resume Summary:');
  console.log(`  Generated: ${generated}`);
  console.log(`  Regenerated: ${regenerated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Success Rate: ${successRate}%`);
  console.log(`  Avg SEO Score: ${avgSeoScore}`);

  return {
    success: failed.length === 0,
    generated,
    regenerated,
    skipped,
    failed,
    summary: {
      totalProcessed,
      successRate,
      avgSeoScore,
    },
  };
}

// Helper functions
async function getArticleData(id: string, type: 'PILLAR' | 'CLUSTER') {
  if (type === 'PILLAR') {
    return await prisma.pillar.findUnique({ where: { id } });
  } else {
    return await prisma.cluster.findUnique({ where: { id } });
  }
}

async function updateArticleStatus(
  id: string,
  type: 'PILLAR' | 'CLUSTER',
  status: string
) {
  if (type === 'PILLAR') {
    await prisma.pillar.update({ where: { id }, data: { status } });
  } else {
    await prisma.cluster.update({ where: { id }, data: { status } });
  }
}

async function updateArticleWithBlogPost(
  id: string,
  type: 'PILLAR' | 'CLUSTER',
  blogPostId: string,
  wordCount: number,
  seoScore: number,
  images: any,
  funnelPlacements: any
) {
  const data = {
    blogPostId,
    wordCount,
    seoScore,
    heroImageUrl: images.heroImageUrl,
    infographicUrl: images.infographicUrl,
    calculatorCtas: funnelPlacements.calculatorCtas?.length || 0,
    packageLinks: funnelPlacements.packageLinks?.length || 0,
    productLinks: funnelPlacements.productLinks?.length || 0,
    status: 'GENERATED',
  };

  if (type === 'PILLAR') {
    await prisma.pillar.update({ where: { id }, data });
  } else {
    await prisma.cluster.update({ where: { id }, data });
  }
}
