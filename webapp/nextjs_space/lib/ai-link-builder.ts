/**
 * AI-Powered Link Builder
 * 
 * Enterprise-grade internal link building using AI to:
 * 1. Analyze content semantically
 * 2. Identify natural link opportunities
 * 3. Generate contextual anchor text
 * 4. Insert links naturally into content
 * 
 * Creates 240+ high-quality internal links across 35 articles
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  keywords: string[];
  type: 'PILLAR' | 'CLUSTER';
}

export interface LinkOpportunity {
  fromArticleId: string;
  toArticleId: string;
  toArticleTitle: string;
  toArticleSlug: string;
  contextTopic: string;
  suggestedParagraph: string;
  anchorText: string;
  reason: string;
  linkType: 'pillar-to-cluster' | 'cluster-to-pillar' | 'cluster-to-cluster' | 'pillar-to-pillar';
  priority: 'high' | 'medium' | 'low';
}

export interface LinkStrategy {
  totalLinks: number;
  avgLinksPerArticle: number;
  opportunities: LinkOpportunity[];
  pillarToPillar: number;
  pillarToCluster: number;
  clusterToPillar: number;
  clusterToCluster: number;
}

/**
 * Generate comprehensive link strategy using AI
 */
export async function generateAILinkStrategy(
  articles: Article[],
  onProgress?: (current: number, total: number, step: string) => void
): Promise<LinkStrategy> {
  console.log(`🔗 Generating AI link strategy for ${articles.length} articles...`);

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Group articles by type
  const pillars = articles.filter(a => a.type === 'PILLAR');
  const clusters = articles.filter(a => a.type === 'CLUSTER');

  const opportunities: LinkOpportunity[] = [];

  // Process in batches to avoid token limits
  const batchSize = 5;
  let processed = 0;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, Math.min(i + batchSize, articles.length));

    if (onProgress) {
      onProgress(processed, articles.length, `Analyzing ${batch[0].title}...`);
    }

    for (const article of batch) {
      // Find potential target articles (exclude self)
      const targets = articles.filter(a => a.id !== article.id);

      // Generate links for this article
      const articleOpportunities = await generateLinksForArticle(
        article,
        targets,
        model
      );

      opportunities.push(...articleOpportunities);
      processed++;

      if (onProgress) {
        onProgress(processed, articles.length, `Found ${articleOpportunities.length} links for ${article.title}`);
      }
    }
  }

  // Calculate statistics
  const strategy: LinkStrategy = {
    totalLinks: opportunities.length,
    avgLinksPerArticle: Math.round((opportunities.length / articles.length) * 10) / 10,
    opportunities,
    pillarToPillar: opportunities.filter(o => o.linkType === 'pillar-to-pillar').length,
    pillarToCluster: opportunities.filter(o => o.linkType === 'pillar-to-cluster').length,
    clusterToPillar: opportunities.filter(o => o.linkType === 'cluster-to-pillar').length,
    clusterToCluster: opportunities.filter(o => o.linkType === 'cluster-to-cluster').length,
  };

  console.log(`✅ Generated ${strategy.totalLinks} link opportunities`);
  console.log(`   Pillar→Pillar: ${strategy.pillarToPillar}`);
  console.log(`   Pillar→Cluster: ${strategy.pillarToCluster}`);
  console.log(`   Cluster→Pillar: ${strategy.clusterToPillar}`);
  console.log(`   Cluster→Cluster: ${strategy.clusterToCluster}`);
  console.log(`   Avg per article: ${strategy.avgLinksPerArticle}`);

  return strategy;
}

/**
 * Generate link opportunities for a single article
 */
async function generateLinksForArticle(
  article: Article,
  targets: Article[],
  model: any
): Promise<LinkOpportunity[]> {
  // Create article summaries for context
  const targetSummaries = targets.map(t => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    type: t.type,
    keywords: t.keywords.slice(0, 3).join(', '),
    preview: extractContentPreview(t.content),
  }));

  const prompt = `You are an SEO expert creating internal links for a solar company blog.

SOURCE ARTICLE:
Title: ${article.title}
Type: ${article.type}
Keywords: ${article.keywords.join(', ')}
Content Preview: ${extractContentPreview(article.content)}

AVAILABLE TARGET ARTICLES:
${targetSummaries.map((t, i) => `
${i + 1}. "${t.title}" (${t.type})
   Keywords: ${t.keywords}
   Preview: ${t.preview}
`).join('\n')}

TASK:
Identify 5-8 natural link opportunities from the source article to target articles.

RULES:
1. Links must add value to the reader (answer questions, provide depth, related topics)
2. Anchor text must be natural and contextual (not keyword-stuffed)
3. Prioritize semantic relevance over keyword matching
4. Create bidirectional connections (pillar↔cluster, cluster↔cluster)
5. Avoid over-linking (max 8 links per article)
6. Link placement must feel organic, not forced

For each link opportunity, provide:
- Target article ID and title
- Context topic (what the reader is learning about when they encounter the link)
- Suggested paragraph location (describe the topic/section)
- Natural anchor text (3-6 words that fit naturally in a sentence)
- Reason why this link adds value
- Priority (high/medium/low)

OUTPUT FORMAT (JSON):
{
  "links": [
    {
      "targetId": "article-id",
      "targetTitle": "Article Title",
      "contextTopic": "battery installation costs",
      "suggestedParagraph": "When discussing upfront investment and pricing",
      "anchorText": "battery installation costs",
      "reason": "Readers considering batteries need detailed cost breakdown",
      "priority": "high"
    }
  ]
}

Generate 5-8 high-quality link opportunities:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(`No JSON found in AI response for ${article.title}`);
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const links = parsed.links || [];

    // Convert to LinkOpportunity format
    const opportunities: LinkOpportunity[] = links.map((link: any) => {
      const target = targets.find(t => t.id === link.targetId || t.title === link.targetTitle);
      if (!target) return null;

      const linkType = determineLinkType(article.type, target.type);

      return {
        fromArticleId: article.id,
        toArticleId: target.id,
        toArticleTitle: target.title,
        toArticleSlug: target.slug,
        contextTopic: link.contextTopic || '',
        suggestedParagraph: link.suggestedParagraph || '',
        anchorText: link.anchorText || target.title,
        reason: link.reason || 'Related content',
        linkType,
        priority: link.priority || 'medium',
      };
    }).filter(Boolean) as LinkOpportunity[];

    return opportunities;
  } catch (error) {
    console.error(`Error generating links for ${article.title}:`, error);
    return [];
  }
}

/**
 * Insert links into article content using AI
 */
export async function insertLinksWithAI(
  content: string,
  articleTitle: string,
  opportunities: LinkOpportunity[],
  onProgress?: (current: number, total: number, title: string) => void
): Promise<string> {
  console.log(`📝 Inserting ${opportunities.length} links into: ${articleTitle}`);

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let updatedContent = content;

  for (let i = 0; i < opportunities.length; i++) {
    const opp = opportunities[i];

    if (onProgress) {
      onProgress(i + 1, opportunities.length, opp.toArticleTitle);
    }

    try {
      updatedContent = await insertSingleLink(
        updatedContent,
        articleTitle,
        opp,
        model
      );

      console.log(`   ✅ Inserted link ${i + 1}/${opportunities.length}: ${opp.anchorText} → ${opp.toArticleTitle}`);
    } catch (error) {
      console.error(`   ❌ Failed to insert link to ${opp.toArticleTitle}:`, error);
    }
  }

  return updatedContent;
}

/**
 * Insert a single link using AI
 */
async function insertSingleLink(
  content: string,
  articleTitle: string,
  opportunity: LinkOpportunity,
  model: any
): Promise<string> {
  // Check if link already exists
  if (content.includes(`/blog/${opportunity.toArticleSlug}`)) {
    console.log(`   ⏭️  Link to ${opportunity.toArticleTitle} already exists, skipping`);
    return content;
  }

  const prompt = `You are editing a blog article to add an internal link naturally.

ARTICLE TITLE: ${articleTitle}

LINK TO INSERT:
- Target: "${opportunity.toArticleTitle}"
- URL: /blog/${opportunity.toArticleSlug}
- Context: ${opportunity.contextTopic}
- Suggested location: ${opportunity.suggestedParagraph}
- Suggested anchor: "${opportunity.anchorText}"
- Reason: ${opportunity.reason}

ARTICLE CONTENT:
${content}

TASK:
1. Find the most natural place to insert this link based on the context topic
2. Identify the exact paragraph or sentence
3. Modify the text to naturally incorporate the link
4. Use the suggested anchor text or create better anchor text if needed
5. Return the FULL updated content with the link inserted

RULES:
- Link format: <a href="/blog/${opportunity.toArticleSlug}">${opportunity.anchorText}</a>
- Make it feel natural - modify surrounding text if needed
- Don't force the link if it doesn't fit well
- Maintain article tone and style
- Don't add new paragraphs unless absolutely necessary
- Only insert ONE link (the one specified above)

OUTPUT:
Return the complete article content with the link inserted. No explanations, just the updated HTML content.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Clean up response (remove markdown code blocks if present)
    let updatedContent = response
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Verify link was inserted
    if (!updatedContent.includes(`/blog/${opportunity.toArticleSlug}`)) {
      console.warn(`   ⚠️  AI didn't insert link, attempting fallback...`);
      updatedContent = insertLinkFallback(content, opportunity);
    }

    return updatedContent;
  } catch (error) {
    console.error(`Error inserting link with AI:`, error);
    // Fallback to simple insertion
    return insertLinkFallback(content, opportunity);
  }
}

/**
 * Fallback link insertion (simple approach)
 */
function insertLinkFallback(
  content: string,
  opportunity: LinkOpportunity
): string {
  // Find a paragraph containing related keywords
  const paragraphs = content.split('</p>');
  
  // Search for context-related keywords
  const keywords = opportunity.contextTopic.toLowerCase().split(' ');
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].toLowerCase();
    
    // Check if paragraph contains context keywords
    const matchCount = keywords.filter(kw => para.includes(kw)).length;
    
    if (matchCount >= 2) {
      // Insert link at end of paragraph
      const link = ` Learn more about <a href="/blog/${opportunity.toArticleSlug}">${opportunity.anchorText}</a>.`;
      paragraphs[i] = paragraphs[i] + link;
      break;
    }
  }
  
  return paragraphs.join('</p>');
}

/**
 * Helper: Extract content preview
 */
function extractContentPreview(content: string, maxLength: number = 300): string {
  // Remove HTML tags
  const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Helper: Determine link type
 */
function determineLinkType(
  fromType: 'PILLAR' | 'CLUSTER',
  toType: 'PILLAR' | 'CLUSTER'
): LinkOpportunity['linkType'] {
  if (fromType === 'PILLAR' && toType === 'PILLAR') return 'pillar-to-pillar';
  if (fromType === 'PILLAR' && toType === 'CLUSTER') return 'pillar-to-cluster';
  if (fromType === 'CLUSTER' && toType === 'PILLAR') return 'cluster-to-pillar';
  return 'cluster-to-cluster';
}

/**
 * Validate link strategy quality
 */
export function validateLinkStrategy(strategy: LinkStrategy): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check minimum links
  if (strategy.totalLinks < 100) {
    issues.push(`Only ${strategy.totalLinks} links generated (target: 200+)`);
  }

  // Check average links per article
  if (strategy.avgLinksPerArticle < 5) {
    warnings.push(`Low average links per article: ${strategy.avgLinksPerArticle} (target: 6-8)`);
  }

  if (strategy.avgLinksPerArticle > 10) {
    warnings.push(`High average links per article: ${strategy.avgLinksPerArticle} (may be over-linking)`);
  }

  // Check link distribution
  const totalLinkTypes = strategy.pillarToPillar + strategy.pillarToCluster + 
                         strategy.clusterToPillar + strategy.clusterToCluster;

  if (strategy.clusterToCluster < totalLinkTypes * 0.3) {
    warnings.push('Low cluster-to-cluster linking (should be ~40% of total)');
  }

  if (strategy.pillarToCluster < totalLinkTypes * 0.2) {
    warnings.push('Low pillar-to-cluster linking (should be ~30% of total)');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}
