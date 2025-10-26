/**
 * Generation Recovery System
 * 
 * Analyzes current state of content generation and identifies:
 * - Which articles are at what stage
 * - Which articles are corrupted
 * - Which articles need regeneration
 * - What actions to take next
 */

import { prisma } from './db';

export interface ArticleStatus {
  id: string;
  type: 'PILLAR' | 'CLUSTER';
  title: string;
  targetKeyword: string;
  stage: 'PLANNED' | 'GENERATING' | 'GENERATED' | 'CORRUPTED' | 'PUBLISHED';
  blogPostId?: string;
  wordCount?: number;
  seoScore?: number;
  hasImages: boolean;
  hasFunnels: boolean;
  issues: string[];
  needsRegeneration: boolean;
  pillarTitle?: string; // For clusters
}

export interface StrategyAnalysis {
  strategyId: string;
  strategyName: string;
  strategyStatus: string;
  totalArticles: number;
  planned: number;
  generating: number;
  generated: number;
  corrupted: number;
  published: number;
  articles: ArticleStatus[];
  nextActions: string[];
  summary: {
    needsRegeneration: number;
    readyForReview: number;
    readyForPublish: number;
  };
}

/**
 * Analyze current state of all articles in strategy
 */
export async function analyzeStrategyProgress(
  strategyId: string
): Promise<StrategyAnalysis> {
  const strategy = await prisma.contentStrategy.findUnique({
    where: { id: strategyId },
    include: {
      pillars: {
        include: {
          blogPost: true,
          clusters: {
            include: {
              blogPost: true,
            },
          },
        },
      },
    },
  });

  if (!strategy) {
    throw new Error('Strategy not found');
  }

  const articles: ArticleStatus[] = [];

  // Analyze pillars
  for (const pillar of strategy.pillars) {
    const status = analyzeArticle(pillar, 'PILLAR');
    articles.push(status);

    // Analyze clusters
    for (const cluster of pillar.clusters) {
      const clusterStatus = analyzeArticle(cluster, 'CLUSTER', pillar.title);
      articles.push(clusterStatus);
    }
  }

  // Count by stage
  const planned = articles.filter(a => a.stage === 'PLANNED').length;
  const generating = articles.filter(a => a.stage === 'GENERATING').length;
  const generated = articles.filter(a => a.stage === 'GENERATED').length;
  const corrupted = articles.filter(a => a.stage === 'CORRUPTED').length;
  const published = articles.filter(a => a.stage === 'PUBLISHED').length;

  // Summary stats
  const needsRegeneration = articles.filter(a => a.needsRegeneration).length;
  const readyForReview = articles.filter(a => a.stage === 'GENERATED' && !a.needsRegeneration).length;
  const readyForPublish = articles.filter(a => a.stage === 'GENERATED' && a.seoScore && a.seoScore >= 90).length;

  // Determine next actions
  const nextActions = determineNextActions(articles);

  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    strategyStatus: strategy.status,
    totalArticles: articles.length,
    planned,
    generating,
    generated,
    corrupted,
    published,
    articles,
    nextActions,
    summary: {
      needsRegeneration,
      readyForReview,
      readyForPublish,
    },
  };
}

/**
 * Analyze individual article status
 */
function analyzeArticle(
  article: any,
  type: 'PILLAR' | 'CLUSTER',
  pillarTitle?: string
): ArticleStatus {
  const issues: string[] = [];
  let stage: ArticleStatus['stage'] = 'PLANNED';
  let needsRegeneration = false;

  // Check if blog post exists
  if (article.blogPostId && article.blogPost) {
    const content = article.blogPost.content;

    // Check for corruption
    if (isContentCorrupted(content)) {
      stage = 'CORRUPTED';
      issues.push('Content is corrupted (malformed HTML)');
      needsRegeneration = true;
    } else if (article.blogPost.published) {
      stage = 'PUBLISHED';
    } else {
      stage = 'GENERATED';
    }

    // Check for missing images
    if (!article.heroImageUrl) {
      issues.push('Missing hero image');
    }
    if (!article.infographicUrl && type === 'PILLAR') {
      issues.push('Missing infographic (pillar should have one)');
    }

    // Check for low word count
    const minWordCount = type === 'PILLAR' ? 2000 : 1000;
    if (article.wordCount && article.wordCount < minWordCount) {
      issues.push(`Low word count: ${article.wordCount} (min: ${minWordCount})`);
      needsRegeneration = true;
    }

    // Check for very low word count (likely failed generation)
    if (article.wordCount && article.wordCount < 500) {
      issues.push(`Very low word count: ${article.wordCount} - likely failed`);
      needsRegeneration = true;
      stage = 'CORRUPTED';
    }

    // Check for low SEO score
    if (article.seoScore && article.seoScore < 80) {
      issues.push(`Low SEO score: ${article.seoScore}/100`);
    }

    // Check for missing funnels
    if (article.calculatorCtas === 0) {
      issues.push('No calculator CTAs');
    }

    // Check for empty or minimal content
    if (content.length < 1000) {
      issues.push('Content too short (< 1000 chars)');
      needsRegeneration = true;
      stage = 'CORRUPTED';
    }
  } else if (article.status === 'GENERATING') {
    stage = 'GENERATING';
    issues.push('Generation in progress (may be stuck)');
    needsRegeneration = true; // Reset and retry stuck articles
  } else {
    stage = 'PLANNED';
    issues.push('Not started');
    needsRegeneration = true;
  }

  return {
    id: article.id,
    type,
    title: article.title,
    targetKeyword: article.targetKeyword,
    stage,
    blogPostId: article.blogPostId,
    wordCount: article.wordCount,
    seoScore: article.seoScore,
    hasImages: !!(article.heroImageUrl || article.infographicUrl),
    hasFunnels: article.calculatorCtas > 0,
    issues,
    needsRegeneration,
    pillarTitle,
  };
}

/**
 * Check if content is corrupted
 */
function isContentCorrupted(content: string): boolean {
  if (!content || content.length < 100) {
    return true; // Too short to be valid
  }

  const corruptionPatterns = [
    /<p>\s*<h[1-6]>/i, // Paragraph wrapping headings
    /<strong>\s*<strong>/i, // Nested strong tags
    /```html/i, // Markdown code blocks in HTML
    /<p>\s*<div/i, // Paragraph wrapping divs
    /<p>\s*<ul/i, // Paragraph wrapping lists
  ];

  let corruptionCount = 0;
  for (const pattern of corruptionPatterns) {
    if (pattern.test(content)) {
      corruptionCount++;
    }
  }

  // Count excessive empty paragraphs
  const emptyParagraphs = (content.match(/<p>\s*<\/p>/gi) || []).length;
  if (emptyParagraphs > 5) {
    corruptionCount++;
  }

  // If 2+ corruption patterns found, consider it corrupted
  return corruptionCount >= 2;
}

/**
 * Determine next actions based on analysis
 */
function determineNextActions(articles: ArticleStatus[]): string[] {
  const actions: string[] = [];

  const corrupted = articles.filter(a => a.stage === 'CORRUPTED');
  const planned = articles.filter(a => a.stage === 'PLANNED');
  const generating = articles.filter(a => a.stage === 'GENERATING');
  const generated = articles.filter(a => a.stage === 'GENERATED' && !a.needsRegeneration);
  const needsRegen = articles.filter(a => a.needsRegeneration && a.stage !== 'CORRUPTED' && a.stage !== 'PLANNED');

  if (corrupted.length > 0) {
    actions.push(`🔴 Regenerate ${corrupted.length} corrupted article${corrupted.length > 1 ? 's' : ''}`);
  }

  if (generating.length > 0) {
    actions.push(`⚠️ Reset ${generating.length} stuck article${generating.length > 1 ? 's' : ''} and retry`);
  }

  if (needsRegen.length > 0) {
    actions.push(`🟡 Fix ${needsRegen.length} article${needsRegen.length > 1 ? 's' : ''} with issues`);
  }

  if (planned.length > 0) {
    actions.push(`🔵 Generate ${planned.length} planned article${planned.length > 1 ? 's' : ''}`);
  }

  if (generated.length > 0) {
    actions.push(`✅ Review ${generated.length} completed article${generated.length > 1 ? 's' : ''}`);
  }

  if (actions.length === 0) {
    actions.push('✨ All articles are ready for review and publishing!');
  }

  return actions;
}

/**
 * Get articles that need regeneration
 */
export async function getArticlesNeedingRegeneration(
  strategyId: string
): Promise<ArticleStatus[]> {
  const analysis = await analyzeStrategyProgress(strategyId);
  return analysis.articles.filter(a => a.needsRegeneration);
}

/**
 * Get articles ready for review
 */
export async function getArticlesReadyForReview(
  strategyId: string
): Promise<ArticleStatus[]> {
  const analysis = await analyzeStrategyProgress(strategyId);
  return analysis.articles.filter(a => 
    a.stage === 'GENERATED' && !a.needsRegeneration
  );
}

/**
 * Get detailed report for a specific article
 */
export async function getArticleDetailedReport(
  articleId: string,
  type: 'PILLAR' | 'CLUSTER'
): Promise<{
  article: ArticleStatus;
  blogPost?: any;
  recommendations: string[];
}> {
  const article = type === 'PILLAR'
    ? await prisma.pillar.findUnique({
        where: { id: articleId },
        include: { blogPost: true },
      })
    : await prisma.cluster.findUnique({
        where: { id: articleId },
        include: { blogPost: true },
      });

  if (!article) {
    throw new Error('Article not found');
  }

  const status = analyzeArticle(article, type);
  const recommendations: string[] = [];

  // Generate recommendations
  if (status.stage === 'CORRUPTED') {
    recommendations.push('Regenerate this article completely');
    recommendations.push('Check for HTML corruption patterns');
  }

  if (!status.hasImages) {
    recommendations.push('Generate hero image and infographic');
  }

  if (!status.hasFunnels) {
    recommendations.push('Add calculator CTAs and package links');
  }

  if (status.seoScore && status.seoScore < 90) {
    recommendations.push('Improve SEO score (current: ' + status.seoScore + ')');
    recommendations.push('Add more internal links');
    recommendations.push('Optimize meta description');
  }

  if (status.wordCount && status.wordCount < (type === 'PILLAR' ? 2500 : 1200)) {
    recommendations.push('Increase word count for better SEO');
  }

  return {
    article: status,
    blogPost: article.blogPost,
    recommendations,
  };
}

/**
 * Export analysis as CSV
 */
export function exportAnalysisAsCSV(analysis: StrategyAnalysis): string {
  const headers = ['Type', 'Title', 'Stage', 'Word Count', 'SEO Score', 'Has Images', 'Has Funnels', 'Issues', 'Needs Regen'];
  const rows = analysis.articles.map(a => [
    a.type,
    a.title,
    a.stage,
    a.wordCount || 0,
    a.seoScore || 0,
    a.hasImages ? 'Yes' : 'No',
    a.hasFunnels ? 'Yes' : 'No',
    a.issues.join('; '),
    a.needsRegeneration ? 'Yes' : 'No',
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}
