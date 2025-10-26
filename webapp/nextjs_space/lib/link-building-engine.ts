/**
 * Link Building Engine
 * 
 * Automatically builds internal links between pillar and cluster articles
 * according to the content strategy
 */

export interface LinkStrategy {
  pillarId: string;
  pillarSlug: string;
  pillarTitle: string;
  clusters: Array<{
    clusterId: string;
    clusterSlug: string;
    clusterTitle: string;
    linksToParent: number; // How many times to link to pillar
    linksToSiblings: string[]; // Which sibling clusters to link to
  }>;
}

export interface LinkPlacement {
  fromPostId: string;
  toPostId: string;
  toSlug: string;
  anchorText: string;
  placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION';
  context: string;
}

export interface LinkBuildingResult {
  totalLinks: number;
  pillarToClusters: number;
  clustersToPillar: number;
  clusterToCluster: number;
  linkPlacements: LinkPlacement[];
}

/**
 * Generate complete link strategy for pillar/cluster content
 */
export function generateLinkStrategy(
  pillar: {
    id: string;
    slug: string;
    title: string;
    keyword: string;
  },
  clusters: Array<{
    id: string;
    slug: string;
    title: string;
    keyword: string;
  }>
): LinkStrategy {
  return {
    pillarId: pillar.id,
    pillarSlug: pillar.slug,
    pillarTitle: pillar.title,
    clusters: clusters.map((cluster, index) => ({
      clusterId: cluster.id,
      clusterSlug: cluster.slug,
      clusterTitle: cluster.title,
      linksToParent: 3, // Each cluster links to pillar 3 times
      linksToSiblings: getSiblingLinks(index, clusters.length),
    })),
  };
}

/**
 * Determine which sibling clusters to link to
 */
function getSiblingLinks(currentIndex: number, totalClusters: number): string[] {
  const siblings: string[] = [];
  
  // Link to previous cluster (if exists)
  if (currentIndex > 0) {
    siblings.push(`cluster-${currentIndex - 1}`);
  }
  
  // Link to next cluster (if exists)
  if (currentIndex < totalClusters - 1) {
    siblings.push(`cluster-${currentIndex + 1}`);
  }
  
  // Link to one related cluster (skip 1 or 2)
  if (currentIndex + 2 < totalClusters) {
    siblings.push(`cluster-${currentIndex + 2}`);
  } else if (currentIndex - 2 >= 0) {
    siblings.push(`cluster-${currentIndex - 2}`);
  }
  
  return siblings;
}

/**
 * Build all internal links for a content strategy
 */
export async function buildInternalLinks(
  strategy: LinkStrategy,
  pillarContent: string,
  clusterContents: Map<string, string>
): Promise<LinkBuildingResult> {
  const linkPlacements: LinkPlacement[] = [];
  let pillarToClusters = 0;
  let clustersToPillar = 0;
  let clusterToCluster = 0;

  // 1. Add links from PILLAR to CLUSTERS
  let updatedPillarContent = pillarContent;
  
  for (const cluster of strategy.clusters) {
    const anchorTexts = generateAnchorTexts(cluster.clusterTitle, 'pillar-to-cluster');
    
    // Add 1-2 links from pillar to each cluster
    for (let i = 0; i < 2; i++) {
      const anchorText = anchorTexts[i % anchorTexts.length];
      const placement = i === 0 ? 'MIDDLE' : 'CONCLUSION';
      
      linkPlacements.push({
        fromPostId: strategy.pillarId,
        toPostId: cluster.clusterId,
        toSlug: cluster.clusterSlug,
        anchorText,
        placement,
        context: `Link to cluster article about ${cluster.clusterTitle}`,
      });
      
      pillarToClusters++;
    }
  }

  // 2. Add links from CLUSTERS to PILLAR
  for (const cluster of strategy.clusters) {
    const clusterContent = clusterContents.get(cluster.clusterId);
    if (!clusterContent) continue;

    const anchorTexts = generateAnchorTexts(strategy.pillarTitle, 'cluster-to-pillar');
    
    // Add 3 links from cluster to pillar
    for (let i = 0; i < cluster.linksToParent; i++) {
      const anchorText = anchorTexts[i % anchorTexts.length];
      const placement = i === 0 ? 'INTRO' : i === 1 ? 'MIDDLE' : 'CONCLUSION';
      
      linkPlacements.push({
        fromPostId: cluster.clusterId,
        toPostId: strategy.pillarId,
        toSlug: strategy.pillarSlug,
        anchorText,
        placement,
        context: `Link back to main pillar article`,
      });
      
      clustersToPillar++;
    }
  }

  // 3. Add links between SIBLING CLUSTERS
  for (let i = 0; i < strategy.clusters.length; i++) {
    const currentCluster = strategy.clusters[i];
    
    for (const siblingIndex of currentCluster.linksToSiblings) {
      const siblingCluster = strategy.clusters[parseInt(siblingIndex.split('-')[1])];
      if (!siblingCluster) continue;

      const anchorTexts = generateAnchorTexts(siblingCluster.clusterTitle, 'cluster-to-cluster');
      
      linkPlacements.push({
        fromPostId: currentCluster.clusterId,
        toPostId: siblingCluster.clusterId,
        toSlug: siblingCluster.clusterSlug,
        anchorText: anchorTexts[0],
        placement: 'MIDDLE',
        context: `Link to related cluster article`,
      });
      
      clusterToCluster++;
    }
  }

  return {
    totalLinks: linkPlacements.length,
    pillarToClusters,
    clustersToPillar,
    clusterToCluster,
    linkPlacements,
  };
}

/**
 * Generate natural anchor text variations
 */
function generateAnchorTexts(targetTitle: string, linkType: string): string[] {
  const anchorTexts: string[] = [];
  
  // Extract main topic from title
  const mainTopic = targetTitle.toLowerCase()
    .replace(/\b(complete|guide|ultimate|best|top)\b/gi, '')
    .trim();

  if (linkType === 'pillar-to-cluster') {
    anchorTexts.push(
      `learn more about ${mainTopic}`,
      `read our guide on ${mainTopic}`,
      `${targetTitle}`,
      `detailed information about ${mainTopic}`,
      `everything you need to know about ${mainTopic}`
    );
  } else if (linkType === 'cluster-to-pillar') {
    anchorTexts.push(
      `complete guide to ${mainTopic}`,
      `${targetTitle}`,
      `comprehensive ${mainTopic} guide`,
      `main ${mainTopic} article`,
      `full ${mainTopic} overview`
    );
  } else if (linkType === 'cluster-to-cluster') {
    anchorTexts.push(
      `${targetTitle}`,
      `related article on ${mainTopic}`,
      `more about ${mainTopic}`,
      `${mainTopic} explained`
    );
  }

  return anchorTexts;
}

/**
 * Insert links into content at specified placements
 */
export function insertLinksIntoContent(
  content: string,
  links: LinkPlacement[]
): string {
  let updatedContent = content;

  // Group links by placement
  const linksByPlacement = {
    INTRO: links.filter(l => l.placement === 'INTRO'),
    MIDDLE: links.filter(l => l.placement === 'MIDDLE'),
    CONCLUSION: links.filter(l => l.placement === 'CONCLUSION'),
  };

  // Insert intro links (after first 2 paragraphs)
  if (linksByPlacement.INTRO.length > 0) {
    const paragraphs = updatedContent.match(/<p>.*?<\/p>/gs) || [];
    if (paragraphs.length >= 2) {
      const secondPEnd = updatedContent.indexOf(paragraphs[1]) + paragraphs[1].length;
      
      linksByPlacement.INTRO.forEach(link => {
        const linkHtml = createInlineLink(link);
        updatedContent = insertLinkNearPosition(updatedContent, linkHtml, secondPEnd, link.anchorText);
      });
    }
  }

  // Insert middle links (around 40-60% of content)
  if (linksByPlacement.MIDDLE.length > 0) {
    const middlePosition = Math.floor(updatedContent.length * 0.5);
    
    linksByPlacement.MIDDLE.forEach(link => {
      const linkHtml = createInlineLink(link);
      updatedContent = insertLinkNearPosition(updatedContent, linkHtml, middlePosition, link.anchorText);
    });
  }

  // Insert conclusion links (last 20% of content)
  if (linksByPlacement.CONCLUSION.length > 0) {
    const conclusionPosition = Math.floor(updatedContent.length * 0.8);
    
    linksByPlacement.CONCLUSION.forEach(link => {
      const linkHtml = createInlineLink(link);
      updatedContent = insertLinkNearPosition(updatedContent, linkHtml, conclusionPosition, link.anchorText);
    });
  }

  return updatedContent;
}

/**
 * Create inline link HTML
 */
function createInlineLink(link: LinkPlacement): string {
  return `<a href="/blog/${link.toSlug}" class="internal-link">${link.anchorText}</a>`;
}

/**
 * Insert link near a specific position in content
 */
function insertLinkNearPosition(
  content: string,
  linkHtml: string,
  targetPosition: number,
  anchorText: string
): string {
  // Find a natural place to insert the link (end of sentence near target position)
  const searchStart = Math.max(0, targetPosition - 200);
  const searchEnd = Math.min(content.length, targetPosition + 200);
  const searchArea = content.substring(searchStart, searchEnd);

  // Look for sentence endings
  const sentenceEnd = searchArea.search(/[.!?]\s+[A-Z]/);
  
  if (sentenceEnd !== -1) {
    const insertPosition = searchStart + sentenceEnd + 2; // After punctuation and space
    
    // Create a natural sentence with the link
    const linkSentence = ` For more details, check out our ${linkHtml}.`;
    
    return content.slice(0, insertPosition) + linkSentence + content.slice(insertPosition);
  }

  // Fallback: insert at nearest paragraph end
  const nearestPEnd = content.indexOf('</p>', targetPosition);
  if (nearestPEnd !== -1) {
    const linkParagraph = `\n\n<p>Related: ${linkHtml}</p>\n\n`;
    return content.slice(0, nearestPEnd + 4) + linkParagraph + content.slice(nearestPEnd + 4);
  }

  return content;
}

/**
 * Validate link structure matches strategy
 */
export function validateLinkStructure(
  strategy: LinkStrategy,
  actualLinks: LinkPlacement[]
): {
  valid: boolean;
  issues: string[];
  stats: {
    expectedLinks: number;
    actualLinks: number;
    missingLinks: number;
  };
} {
  const issues: string[] = [];
  
  // Calculate expected links
  const expectedPillarToClusters = strategy.clusters.length * 2; // 2 links per cluster
  const expectedClustersToPillar = strategy.clusters.reduce((sum, c) => sum + c.linksToParent, 0);
  const expectedClusterToCluster = strategy.clusters.reduce((sum, c) => sum + c.linksToSiblings.length, 0);
  const expectedTotal = expectedPillarToClusters + expectedClustersToPillar + expectedClusterToCluster;

  // Count actual links
  const actualPillarToClusters = actualLinks.filter(l => l.fromPostId === strategy.pillarId).length;
  const actualClustersToPillar = actualLinks.filter(l => l.toPostId === strategy.pillarId).length;
  const actualClusterToCluster = actualLinks.filter(l => 
    l.fromPostId !== strategy.pillarId && l.toPostId !== strategy.pillarId
  ).length;

  // Check for issues
  if (actualPillarToClusters < expectedPillarToClusters) {
    issues.push(`Missing ${expectedPillarToClusters - actualPillarToClusters} pillar-to-cluster links`);
  }

  if (actualClustersToPillar < expectedClustersToPillar) {
    issues.push(`Missing ${expectedClustersToPillar - actualClustersToPillar} cluster-to-pillar links`);
  }

  if (actualClusterToCluster < expectedClusterToCluster) {
    issues.push(`Missing ${expectedClusterToCluster - actualClusterToCluster} cluster-to-cluster links`);
  }

  // Check for orphaned clusters (no links to pillar)
  for (const cluster of strategy.clusters) {
    const hasLinkToPillar = actualLinks.some(l => 
      l.fromPostId === cluster.clusterId && l.toPostId === strategy.pillarId
    );
    
    if (!hasLinkToPillar) {
      issues.push(`Orphaned cluster: ${cluster.clusterTitle} has no links to pillar`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      expectedLinks: expectedTotal,
      actualLinks: actualLinks.length,
      missingLinks: Math.max(0, expectedTotal - actualLinks.length),
    },
  };
}

/**
 * Generate link map visualization data
 */
export function generateLinkMap(strategy: LinkStrategy, links: LinkPlacement[]): {
  nodes: Array<{ id: string; label: string; type: 'pillar' | 'cluster' }>;
  edges: Array<{ from: string; to: string; label: string }>;
} {
  const nodes = [
    {
      id: strategy.pillarId,
      label: strategy.pillarTitle,
      type: 'pillar' as const,
    },
    ...strategy.clusters.map(c => ({
      id: c.clusterId,
      label: c.clusterTitle,
      type: 'cluster' as const,
    })),
  ];

  const edges = links.map(link => ({
    from: link.fromPostId,
    to: link.toPostId,
    label: link.anchorText.substring(0, 30) + '...',
  }));

  return { nodes, edges };
}

/**
 * Export link building report
 */
export function generateLinkBuildingReport(
  strategy: LinkStrategy,
  result: LinkBuildingResult,
  validation: ReturnType<typeof validateLinkStructure>
): string {
  return `
# Link Building Report

## Strategy Overview
- **Pillar Article**: ${strategy.pillarTitle}
- **Cluster Articles**: ${strategy.clusters.length}
- **Expected Total Links**: ${validation.stats.expectedLinks}

## Link Distribution
- **Pillar → Clusters**: ${result.pillarToClusters} links
- **Clusters → Pillar**: ${result.clustersToPillar} links
- **Cluster ↔ Cluster**: ${result.clusterToCluster} links
- **Total Links Built**: ${result.totalLinks}

## Validation
- **Status**: ${validation.valid ? '✅ VALID' : '⚠️ ISSUES FOUND'}
- **Missing Links**: ${validation.stats.missingLinks}

${validation.issues.length > 0 ? `
## Issues
${validation.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## Link Placements
${result.linkPlacements.map(link => `
- **${link.anchorText}**
  - From: ${link.fromPostId}
  - To: ${link.toSlug}
  - Placement: ${link.placement}
`).join('\n')}

## SEO Impact
- **Internal Link Density**: ${(result.totalLinks / (strategy.clusters.length + 1)).toFixed(1)} links per article
- **Pillar Authority**: ${result.clustersToPillar} incoming links from clusters
- **Content Interconnectivity**: ${validation.valid ? 'Fully connected' : 'Needs improvement'}
- **Link Juice Flow**: ${validation.valid ? 'Optimized' : 'Suboptimal'}

## Recommendations
${validation.valid ? 
  '✅ Link structure is optimal for SEO. All articles are properly interconnected.' :
  '⚠️ Fix missing links to ensure proper link juice flow and content discoverability.'
}
`;
}
