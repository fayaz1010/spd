/**
 * Strategy Link Builder
 * 
 * Orchestrates AI-powered link building for entire content strategy
 * Builds 240+ contextual internal links across all articles
 */

import { prisma } from '@/lib/prisma';
import {
  generateAILinkStrategy,
  insertLinksWithAI,
  validateLinkStrategy,
  type Article,
  type LinkStrategy,
} from '@/lib/ai-link-builder';

export interface LinkBuildingResult {
  success: boolean;
  totalLinks: number;
  linksInserted: number;
  linksFailed: number;
  articlesUpdated: number;
  strategy: LinkStrategy | null;
  errors: Array<{ article: string; error: string }>;
}

/**
 * Build internal links for all articles in a strategy
 */
export async function buildInternalLinksForStrategy(
  strategyId: string,
  onProgress?: (progress: number, step: string) => void
): Promise<LinkBuildingResult> {
  console.log(`🔗 Building internal links for strategy ${strategyId}...`);

  const result: LinkBuildingResult = {
    success: false,
    totalLinks: 0,
    linksInserted: 0,
    linksFailed: 0,
    articlesUpdated: 0,
    strategy: null,
    errors: [],
  };

  try {
    // ============================================
    // STEP 1: Fetch all articles
    // ============================================
    if (onProgress) {
      onProgress(5, 'Fetching articles...');
    }

    const articles = await fetchStrategyArticles(strategyId);

    if (articles.length === 0) {
      throw new Error('No articles found for strategy');
    }

    console.log(`   Found ${articles.length} articles`);

    // ============================================
    // STEP 2: Generate link strategy with AI
    // ============================================
    if (onProgress) {
      onProgress(10, 'Analyzing content and generating link strategy...');
    }

    const strategy = await generateAILinkStrategy(
      articles,
      (current, total, step) => {
        const progress = 10 + Math.round((current / total) * 30);
        if (onProgress) {
          onProgress(progress, `Analyzing: ${step}`);
        }
      }
    );

    result.strategy = strategy;
    result.totalLinks = strategy.totalLinks;

    console.log(`   Generated strategy with ${strategy.totalLinks} link opportunities`);

    // Validate strategy
    const validation = validateLinkStrategy(strategy);
    if (!validation.valid) {
      console.warn('   ⚠️ Link strategy validation issues:', validation.issues);
    }
    if (validation.warnings.length > 0) {
      console.warn('   ⚠️ Link strategy warnings:', validation.warnings);
    }

    // ============================================
    // STEP 3: Group opportunities by source article
    // ============================================
    if (onProgress) {
      onProgress(40, 'Preparing link insertion...');
    }

    const opportunitiesByArticle = new Map<string, typeof strategy.opportunities>();
    
    for (const opp of strategy.opportunities) {
      const existing = opportunitiesByArticle.get(opp.fromArticleId) || [];
      existing.push(opp);
      opportunitiesByArticle.set(opp.fromArticleId, existing);
    }

    console.log(`   Grouped opportunities across ${opportunitiesByArticle.size} articles`);

    // ============================================
    // STEP 4: Insert links into each article
    // ============================================
    let processedArticles = 0;
    const totalArticlesToUpdate = opportunitiesByArticle.size;

    for (const [articleId, opportunities] of opportunitiesByArticle.entries()) {
      try {
        const article = articles.find(a => a.id === articleId);
        if (!article) {
          console.warn(`   ⚠️ Article ${articleId} not found, skipping`);
          continue;
        }

        if (onProgress) {
          const progress = 40 + Math.round((processedArticles / totalArticlesToUpdate) * 50);
          onProgress(progress, `Inserting links into: ${article.title}`);
        }

        // Get blog post
        const blogPost = await prisma.blogPost.findFirst({
          where: {
            OR: [
              { id: articleId },
              { slug: article.slug },
            ],
          },
        });

        if (!blogPost) {
          console.warn(`   ⚠️ Blog post not found for ${article.title}, skipping`);
          continue;
        }

        // Insert links with AI
        const updatedContent = await insertLinksWithAI(
          blogPost.content,
          article.title,
          opportunities,
          (current, total, targetTitle) => {
            if (onProgress) {
              const articleProgress = 40 + Math.round((processedArticles / totalArticlesToUpdate) * 50);
              const linkProgress = Math.round((current / total) * 100);
              onProgress(
                articleProgress,
                `${article.title}: ${current}/${total} links (${linkProgress}%)`
              );
            }
          }
        );

        // Update blog post
        await prisma.blogPost.update({
          where: { id: blogPost.id },
          data: {
            content: updatedContent,
            updatedAt: new Date(),
          },
        });

        result.linksInserted += opportunities.length;
        result.articlesUpdated++;
        processedArticles++;

        console.log(`   ✅ Updated ${article.title} with ${opportunities.length} links`);
      } catch (error: any) {
        console.error(`   ❌ Failed to update article ${articleId}:`, error);
        result.linksFailed += opportunities.length;
        result.errors.push({
          article: articles.find(a => a.id === articleId)?.title || articleId,
          error: error.message || 'Unknown error',
        });
      }
    }

    // ============================================
    // STEP 5: Save link records to database
    // ============================================
    if (onProgress) {
      onProgress(90, 'Saving link records...');
    }

    await saveLinkRecords(strategyId, strategy.opportunities);

    // ============================================
    // STEP 6: Update strategy status
    // ============================================
    if (onProgress) {
      onProgress(95, 'Updating strategy status...');
    }

    await prisma.contentStrategy.update({
      where: { id: strategyId },
      data: {
        totalLinks: result.linksInserted,
        linkBuildingComplete: true,
        updatedAt: new Date(),
      },
    });

    result.success = result.linksInserted > 0;

    if (onProgress) {
      onProgress(100, `✅ Complete! ${result.linksInserted} links built`);
    }

    console.log(`✅ Link building complete:`);
    console.log(`   Total opportunities: ${result.totalLinks}`);
    console.log(`   Links inserted: ${result.linksInserted}`);
    console.log(`   Links failed: ${result.linksFailed}`);
    console.log(`   Articles updated: ${result.articlesUpdated}`);

    return result;
  } catch (error: any) {
    console.error('Link building error:', error);
    result.errors.push({
      article: 'Strategy',
      error: error.message || 'Unknown error',
    });
    return result;
  }
}

/**
 * Fetch all articles for a strategy
 */
async function fetchStrategyArticles(strategyId: string): Promise<Article[]> {
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

  const articles: Article[] = [];

  // Get pillar articles
  for (const pillar of strategy.pillars) {
    if (pillar.blogPostId) {
      const post = await prisma.blogPost.findUnique({
        where: { id: pillar.blogPostId },
      });

      if (post) {
        articles.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          keywords: post.keywords || [pillar.targetKeyword],
          type: 'PILLAR',
        });
      }
    }
  }

  // Get cluster articles
  for (const pillar of strategy.pillars) {
    for (const cluster of pillar.clusters) {
      if (cluster.blogPostId) {
        const post = await prisma.blogPost.findUnique({
          where: { id: cluster.blogPostId },
        });

        if (post) {
          articles.push({
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            keywords: post.keywords || [cluster.targetKeyword],
            type: 'CLUSTER',
          });
        }
      }
    }
  }

  return articles;
}

/**
 * Save link records to database
 */
async function saveLinkRecords(
  strategyId: string,
  opportunities: Array<{
    fromArticleId: string;
    toArticleId: string;
    anchorText: string;
    linkType: string;
  }>
): Promise<void> {
  console.log(`   Saving ${opportunities.length} link records...`);

  // Delete existing links for this strategy
  await prisma.internalLink.deleteMany({
    where: { strategyId },
  });

  // Create new link records
  const linkRecords = opportunities.map(opp => ({
    strategyId,
    fromPostId: opp.fromArticleId,
    toPostId: opp.toArticleId,
    anchorText: opp.anchorText,
    linkType: opp.linkType,
    createdAt: new Date(),
  }));

  // Insert in batches to avoid query limits
  const batchSize = 100;
  for (let i = 0; i < linkRecords.length; i += batchSize) {
    const batch = linkRecords.slice(i, i + batchSize);
    await prisma.internalLink.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`   ✅ Saved ${linkRecords.length} link records`);
}

/**
 * Get link building statistics for a strategy
 */
export async function getLinkBuildingStats(strategyId: string): Promise<{
  totalLinks: number;
  linksByType: Record<string, number>;
  avgLinksPerArticle: number;
  topLinkedArticles: Array<{ title: string; inboundLinks: number }>;
}> {
  const links = await prisma.internalLink.findMany({
    where: { strategyId },
    include: {
      fromPost: { select: { title: true } },
      toPost: { select: { title: true } },
    },
  });

  const linksByType: Record<string, number> = {};
  const inboundCounts = new Map<string, { title: string; count: number }>();

  for (const link of links) {
    // Count by type
    linksByType[link.linkType] = (linksByType[link.linkType] || 0) + 1;

    // Count inbound links
    const existing = inboundCounts.get(link.toPostId) || { title: link.toPost.title, count: 0 };
    existing.count++;
    inboundCounts.set(link.toPostId, existing);
  }

  // Get top linked articles
  const topLinkedArticles = Array.from(inboundCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(item => ({ title: item.title, inboundLinks: item.count }));

  // Calculate average
  const uniqueArticles = new Set([
    ...links.map(l => l.fromPostId),
    ...links.map(l => l.toPostId),
  ]).size;

  return {
    totalLinks: links.length,
    linksByType,
    avgLinksPerArticle: uniqueArticles > 0 ? Math.round((links.length / uniqueArticles) * 10) / 10 : 0,
    topLinkedArticles,
  };
}
