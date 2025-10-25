/**
 * Internal Linking System
 * 
 * Automatically creates internal links between articles
 * - Pillar → Cluster links
 * - Cluster → Pillar links
 * - Related article links
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InternalLink {
  fromPostId: string;
  toPostId: string;
  anchorText: string;
  placement: 'intro' | 'body' | 'conclusion';
  relevanceScore: number;
}

/**
 * Find relevant articles for internal linking
 */
export async function findRelatedArticles(
  articleId: string,
  keyword: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  title: string;
  slug: string;
  keywords: string[];
  relevanceScore: number;
}>> {
  // Get all published articles except current one
  const articles = await prisma.blogPost.findMany({
    where: {
      id: { not: articleId },
      status: { in: ['PUBLISHED', 'DRAFT'] },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      keywords: true,
    },
  });
  
  // Calculate relevance scores
  const scored = articles.map(article => {
    let score = 0;
    
    // Check if keywords overlap
    const articleKeywords = article.keywords || [];
    const keywordLower = keyword.toLowerCase();
    
    for (const kw of articleKeywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === keywordLower) {
        score += 100; // Exact match
      } else if (kwLower.includes(keywordLower) || keywordLower.includes(kwLower)) {
        score += 50; // Partial match
      }
    }
    
    // Check title similarity
    const titleLower = article.title.toLowerCase();
    if (titleLower.includes(keywordLower)) {
      score += 30;
    }
    
    return {
      ...article,
      relevanceScore: score,
    };
  });
  
  // Sort by relevance and return top results
  return scored
    .filter(a => a.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Generate anchor text variations
 */
export function generateAnchorText(
  targetTitle: string,
  targetKeyword: string,
  variation: number = 0
): string {
  const variations = [
    targetKeyword,
    targetTitle,
    `learn more about ${targetKeyword}`,
    `our guide to ${targetKeyword}`,
    `read about ${targetKeyword}`,
    `${targetKeyword} guide`,
    `complete ${targetKeyword} guide`,
  ];
  
  return variations[variation % variations.length];
}

/**
 * Insert internal links into content
 */
export function insertInternalLinks(
  content: string,
  links: Array<{
    anchorText: string;
    url: string;
    placement: 'intro' | 'body' | 'conclusion';
  }>
): string {
  let enhanced = content;
  
  // Split content into sections
  const paragraphs = content.split('\n\n');
  const totalParagraphs = paragraphs.length;
  
  for (const link of links) {
    // Determine target paragraph based on placement
    let targetIndex: number;
    
    switch (link.placement) {
      case 'intro':
        targetIndex = Math.min(2, Math.floor(totalParagraphs * 0.1));
        break;
      case 'conclusion':
        targetIndex = Math.max(totalParagraphs - 3, Math.floor(totalParagraphs * 0.9));
        break;
      case 'body':
      default:
        targetIndex = Math.floor(totalParagraphs * 0.5);
        break;
    }
    
    // Find first occurrence of anchor text in target section
    const targetParagraph = paragraphs[targetIndex];
    if (!targetParagraph) continue;
    
    // Check if anchor text exists in paragraph
    const anchorIndex = targetParagraph.toLowerCase().indexOf(link.anchorText.toLowerCase());
    if (anchorIndex === -1) continue;
    
    // Replace with link
    const before = targetParagraph.substring(0, anchorIndex);
    const after = targetParagraph.substring(anchorIndex + link.anchorText.length);
    const linkedText = `<a href="${link.url}" class="internal-link">${link.anchorText}</a>`;
    
    paragraphs[targetIndex] = before + linkedText + after;
  }
  
  return paragraphs.join('\n\n');
}

/**
 * Generate internal linking strategy for pillar
 */
export async function generatePillarInternalLinks(
  pillarId: string
): Promise<InternalLink[]> {
  const pillar = await prisma.pillar.findUnique({
    where: { id: pillarId },
    include: {
      blogPost: true,
      clusters: {
        include: {
          blogPost: true,
        },
      },
    },
  });
  
  if (!pillar || !pillar.blogPost) return [];
  
  const links: InternalLink[] = [];
  
  // Link pillar to all its clusters
  pillar.clusters.forEach((cluster, index) => {
    if (!cluster.blogPost) return;
    
    links.push({
      fromPostId: pillar.blogPost!.id,
      toPostId: cluster.blogPost.id,
      anchorText: generateAnchorText(cluster.title, cluster.targetKeyword, index),
      placement: index < 3 ? 'body' : 'conclusion',
      relevanceScore: 100,
    });
  });
  
  return links;
}

/**
 * Generate internal linking strategy for cluster
 */
export async function generateClusterInternalLinks(
  clusterId: string
): Promise<InternalLink[]> {
  const cluster = await prisma.cluster.findUnique({
    where: { id: clusterId },
    include: {
      blogPost: true,
      pillar: {
        include: {
          blogPost: true,
          clusters: {
            where: {
              id: { not: clusterId },
            },
            include: {
              blogPost: true,
            },
          },
        },
      },
    },
  });
  
  if (!cluster || !cluster.blogPost) return [];
  
  const links: InternalLink[] = [];
  
  // Link cluster to its pillar
  if (cluster.pillar.blogPost) {
    links.push({
      fromPostId: cluster.blogPost.id,
      toPostId: cluster.pillar.blogPost.id,
      anchorText: generateAnchorText(cluster.pillar.title, cluster.pillar.targetKeyword, 0),
      placement: 'intro',
      relevanceScore: 100,
    });
  }
  
  // Link to 2-3 related clusters
  const relatedClusters = cluster.pillar.clusters.slice(0, 3);
  relatedClusters.forEach((related, index) => {
    if (!related.blogPost) return;
    
    links.push({
      fromPostId: cluster.blogPost!.id,
      toPostId: related.blogPost.id,
      anchorText: generateAnchorText(related.title, related.targetKeyword, index),
      placement: 'body',
      relevanceScore: 80,
    });
  });
  
  return links;
}

/**
 * Apply internal links to all articles in strategy
 */
export async function applyInternalLinksToStrategy(
  strategyId: string
): Promise<{
  totalLinks: number;
  pillarLinks: number;
  clusterLinks: number;
}> {
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
  
  let totalLinks = 0;
  let pillarLinks = 0;
  let clusterLinks = 0;
  
  // Process each pillar
  for (const pillar of strategy.pillars) {
    if (!pillar.blogPost) continue;
    
    // Generate links for pillar
    const links = await generatePillarInternalLinks(pillar.id);
    pillarLinks += links.length;
    
    // Apply links to pillar content
    const linkData = links.map(link => ({
      anchorText: link.anchorText,
      url: `/blog/${link.toPostId}`, // Adjust based on your routing
      placement: link.placement,
    }));
    
    const enhancedContent = insertInternalLinks(pillar.blogPost.content, linkData);
    
    await prisma.blogPost.update({
      where: { id: pillar.blogPost.id },
      data: { content: enhancedContent },
    });
    
    // Save links to database
    for (const link of links) {
      await prisma.internalLink.upsert({
        where: {
          fromPostId_toPostId_anchorText: {
            fromPostId: link.fromPostId,
            toPostId: link.toPostId,
            anchorText: link.anchorText,
          },
        },
        create: link,
        update: link,
      });
    }
    
    // Process clusters
    for (const cluster of pillar.clusters) {
      if (!cluster.blogPost) continue;
      
      const clusterLinksData = await generateClusterInternalLinks(cluster.id);
      clusterLinks += clusterLinksData.length;
      
      const clusterLinkData = clusterLinksData.map(link => ({
        anchorText: link.anchorText,
        url: `/blog/${link.toPostId}`,
        placement: link.placement,
      }));
      
      const enhancedClusterContent = insertInternalLinks(cluster.blogPost.content, clusterLinkData);
      
      await prisma.blogPost.update({
        where: { id: cluster.blogPost.id },
        data: { content: enhancedClusterContent },
      });
      
      // Save cluster links
      for (const link of clusterLinksData) {
        await prisma.internalLink.upsert({
          where: {
            fromPostId_toPostId_anchorText: {
              fromPostId: link.fromPostId,
              toPostId: link.toPostId,
              anchorText: link.anchorText,
            },
          },
          create: link,
          update: link,
        });
      }
    }
  }
  
  totalLinks = pillarLinks + clusterLinks;
  
  return {
    totalLinks,
    pillarLinks,
    clusterLinks,
  };
}
