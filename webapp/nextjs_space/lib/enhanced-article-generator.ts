/**
 * Enhanced Article Generator with SEO Research
 * 
 * Generates articles with:
 * - Google Ads keyword research
 * - Google Search SERP analysis
 * - Data-driven prompts
 * - First-attempt 95% SEO score
 */

import { researchSEOData, SEOResearchData } from './seo-research';
import { generateWithGrounding, GroundingSource } from './gemini-grounding';
import { ensureHTML } from './markdown-converter';
import { formatTables, validateAndFixTables } from './table-formatter';
import { generateFunnelPlacements, insertFunnelElements } from './ai-funnel-placement';
import { formatSources } from './content-formatter';
import { polishArticle } from './article-polisher';
import { scanBlogPost } from './blog-quality-scanner';
import { scanBlogSEO } from './blog-seo-scanner';

export interface EnhancedArticleInput {
  topic: string;
  targetKeyword: string;
  wordCount: number;
  articleType: 'PILLAR' | 'CLUSTER';
  location?: string;
  targetAudience?: string;
  pillarTopic?: string; // For clusters
  strategyName?: string;
}

export interface EnhancedArticleOutput {
  content: string;
  sources: GroundingSource[];
  researchData: SEOResearchData;
  metadata: {
    wordCount: number;
    keywordDensity: number;
    readabilityScore: number;
  };
  qualityScore: number;
  seoScore: number;
  seoGrade: string;
  qualityIssues: any[];
  seoIssues: any[];
}

// Helper function to add schema markup
function addSchemaMarkup(content: string, title: string, type: 'pillar' | 'cluster'): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    articleSection: type === 'pillar' ? 'Solar Energy Guide' : 'Solar Information',
    publisher: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
      url: 'https://sundirectpower.com.au',
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
  };
  return content + `\n\n<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Generate article with comprehensive SEO research
 * Designed to hit 95% SEO score on first attempt
 */
export async function generateArticleWithSEOResearch(
  input: EnhancedArticleInput
): Promise<EnhancedArticleOutput> {
  const location = input.location || 'Perth, Western Australia';
  const audience = input.targetAudience || 'Perth homeowners';
  
  console.log(`\n🔬 Researching SEO data for: "${input.targetKeyword}"`);
  
  // Step 1: Comprehensive SEO Research
  const researchData = await researchSEOData(input.targetKeyword, location);
  
  console.log(`📊 Research Complete:`, {
    primaryKeyword: researchData.primaryKeyword,
    searchVolume: researchData.keywordVolume,
    competition: researchData.competition,
    relatedKeywords: researchData.relatedKeywords.length,
    topResults: researchData.topRankingContent.length,
    commonHeadings: researchData.commonHeadings.length,
    averageWordCount: researchData.averageWordCount,
  });
  
  // Step 2: Build data-driven prompt
  const prompt = buildEnhancedPrompt(input, researchData, location, audience);
  
  console.log(`✍️ Generating article with enhanced prompt...`);
  
  // Step 3: Generate article with grounding
  const response = await generateWithGrounding(prompt, {
    model: 'gemini-2.5-flash',
    // No token limit - allow full content
  });
  
  console.log(`✅ Article generated (${response.content.length} chars)`);
  
  // ═══════════════════════════════════════════════════════════════
  // TECHNICAL SEO & FORMATTING PIPELINE
  // ═══════════════════════════════════════════════════════════════
  
  console.log(`\n🔧 Applying technical SEO and formatting...`);
  
  let finalContent = response.content;
  
  // Step 4: Convert markdown to HTML if needed
  console.log(`  1/7 Converting to HTML...`);
  finalContent = ensureHTML(finalContent);
  
  // Step 5: Format and validate tables
  console.log(`  2/7 Formatting tables...`);
  finalContent = validateAndFixTables(finalContent);
  finalContent = formatTables(finalContent);
  
  // Step 6: Generate and insert funnel placements
  console.log(`  3/7 Adding CTAs and funnels...`);
  const funnelPlacements = await generateFunnelPlacements(
    input.topic,
    input.targetKeyword,
    'COMMERCIAL',
    input.articleType,
    input.strategyName || audience
  );
  finalContent = insertFunnelElements(finalContent, funnelPlacements);
  
  // Step 7: Add properly formatted sources
  console.log(`  4/7 Formatting sources...`);
  const sourcesSection = formatSources(response.sources);
  if (sourcesSection && !finalContent.includes('Sources:')) {
    finalContent += sourcesSection;
  }
  
  // Step 8: Add schema markup
  console.log(`  5/7 Adding schema markup...`);
  const isPillar = input.articleType === 'PILLAR';
  finalContent = addSchemaMarkup(finalContent, input.topic, isPillar ? 'pillar' : 'cluster');
  
  // Step 9: Polish HTML
  console.log(`  6/7 Polishing HTML...`);
  const polished = polishArticle(finalContent);
  finalContent = polished.content;
  
  // Step 10: Scan quality and SEO
  console.log(`  7/7 Scanning quality and SEO...`);
  const qualityReport = scanBlogPost(finalContent, input.topic, 'temp');
  const seoReport = scanBlogSEO(finalContent, input.topic, 'temp', {
    targetKeyword: input.targetKeyword,
    includeInternalLinks: false, // Phase 1 & 2
  });
  
  // Calculate final metadata
  const words = finalContent.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const keywordCount = (finalContent.match(new RegExp(input.targetKeyword, 'gi')) || []).length;
  const keywordDensity = (keywordCount / words) * 100;
  
  console.log(`\n✅ COMPLETE! Final scores:`, {
    wordCount: words,
    qualityScore: qualityReport.overallScore + '%',
    seoScore: seoReport.seoScore + '%',
    seoGrade: seoReport.grade,
    keywordDensity: keywordDensity.toFixed(2) + '%',
  });
  
  return {
    content: finalContent,
    sources: response.sources,
    researchData,
    metadata: {
      wordCount: words,
      keywordDensity,
      readabilityScore: 65, // Placeholder
    },
    qualityScore: qualityReport.overallScore,
    seoScore: seoReport.seoScore,
    seoGrade: seoReport.grade,
    qualityIssues: qualityReport.issues,
    seoIssues: seoReport.issues,
  };
}

/**
 * Build enhanced, data-driven prompt using research data
 */
function buildEnhancedPrompt(
  input: EnhancedArticleInput,
  research: SEOResearchData,
  location: string,
  audience: string
): string {
  const isPillar = input.articleType === 'PILLAR';
  
  return `You are an expert SEO content writer for Sun Direct Power, a solar company in Perth, Western Australia.

Write a ${isPillar ? 'comprehensive pillar' : 'detailed cluster'} article that will rank #1 on Google.

═══════════════════════════════════════════════════════════════
📊 KEYWORD RESEARCH DATA (Google Ads)
═══════════════════════════════════════════════════════════════

PRIMARY KEYWORD: "${research.primaryKeyword}"
- Search Volume: ${research.keywordVolume.toLocaleString()} searches/month
- Competition: ${research.competition}
- Optimal Keyword Density: ${research.optimalKeywordDensity}%

RELATED KEYWORDS TO NATURALLY INCLUDE:
${research.relatedKeywords.slice(0, 8).map((k, i) => 
  `${i + 1}. "${k.keyword}" (${k.volume.toLocaleString()}/month, ${k.competition} competition)`
).join('\n')}

═══════════════════════════════════════════════════════════════
🔍 TOP-RANKING CONTENT ANALYSIS (Google Search)
═══════════════════════════════════════════════════════════════

AVERAGE WORD COUNT: ${research.averageWordCount} words
TARGET WORD COUNT: ${input.wordCount} words

COMMON HEADINGS IN TOP 10 RESULTS:
${research.commonHeadings.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n')}

COMMON TOPICS COVERED:
${research.commonTopics.slice(0, 8).map((t, i) => `${i + 1}. ${t}`).join('\n')}

TOP RANKING ARTICLES:
${research.topRankingContent.slice(0, 5).map((r, i) => 
  `${i + 1}. "${r.title}"\n   ${r.snippet}`
).join('\n\n')}

═══════════════════════════════════════════════════════════════
🎯 ARTICLE REQUIREMENTS
═══════════════════════════════════════════════════════════════

**TOPIC:** ${input.topic}
**ARTICLE TYPE:** ${isPillar ? 'PILLAR (Comprehensive Guide)' : 'CLUSTER (Focused Topic)'}
**TARGET AUDIENCE:** ${audience}
**LOCATION:** ${location}
${input.pillarTopic ? `**PILLAR CONTEXT:** ${input.pillarTopic}` : ''}

**SEO OPTIMIZATION (Target: 95%+ Score):**

1. **Keyword Placement:**
   - Primary keyword "${research.primaryKeyword}" in:
     * Title (at the beginning)
     * First paragraph (within first 100 words)
     * At least 3 H2 headings
     * Throughout content (${research.optimalKeywordDensity}% density)
     * Meta description
   - Related keywords naturally distributed
   - Avoid keyword stuffing - use synonyms and variations

2. **Content Structure (Match Top-Ranking Patterns):**
   - Use the common headings identified above
   - Cover all common topics from top results
   - Match or exceed average word count (${research.averageWordCount} words)
   - Add unique insights and local Perth examples
   
3. **Heading Hierarchy:**
   - H1: Article title (include primary keyword)
   - H2: Main sections (${research.commonHeadings.slice(0, 5).join(', ')})
   - H3: Subsections within each H2
   - Use question-based headings for featured snippets

4. **E-E-A-T Compliance:**
   - Include real Perth installation examples with specific addresses/suburbs
   - Show technical expertise with calculations and data
   - Cite authoritative sources (government, industry bodies)
   - Add expert credentials (CEC accreditation, years of experience)
   - Use current 2025 data only

5. **YMYL Compliance (Financial Content):**
   - Add disclaimers for cost estimates
   - Provide transparent pricing with ranges
   - Include contact information
   - Cite official government rebate sources
   - Show ROI calculations with assumptions

6. **Content Depth:**
   - Answer all related questions users might have
   - Include practical examples and case studies
   - Add actionable advice and step-by-step guidance
   - Cover objections and concerns
   - Provide comparison tables where relevant

7. **User Intent Alignment:**
   - Address the specific intent behind "${research.primaryKeyword}"
   - Provide immediate value in the introduction
   - Include FAQ section for common questions
   - Add clear next steps and CTAs

8. **Featured Snippet Optimization:**
   - Start with a concise definition/answer (40-60 words)
   - Use numbered lists for "how to" content
   - Use bullet points for "what is" content
   - Include comparison tables for "vs" queries

═══════════════════════════════════════════════════════════════
📝 CONTENT STRUCTURE
═══════════════════════════════════════════════════════════════

1. **Introduction (150-200 words)**
   - Hook with a compelling statistic or question
   - Include primary keyword in first 100 words
   - Preview what the article will cover
   - Establish credibility

2. **Main Content (${input.wordCount - 400} words)**
   - Follow the common heading structure from top results
   - Cover all common topics identified
   - Add unique Perth-specific insights
   - Include data, statistics, and examples
   - Use tables for comparisons
   - Add internal linking opportunities [LINK: relevant topic]

3. **FAQ Section (200-300 words)**
   - Answer 5-7 common questions
   - Use question-based H3 headings
   - Optimize for featured snippets

4. **Conclusion (100-150 words)**
   - Summarize key points
   - Include call-to-action
   - Reinforce primary keyword

5. **Sources & Disclaimers**
   - List all sources used
   - Add financial disclaimers
   - Include contact information

═══════════════════════════════════════════════════════════════
🚀 GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════

Search for and include:
- Latest 2025 government rebates and programs
- Current electricity tariff rates in Perth
- Recent industry statistics and trends
- Expert opinions from solar industry bodies
- Real customer testimonials and case studies

Write the article now in HTML format with:
- Proper heading tags (H1, H2, H3)
- Paragraph tags
- Lists (ul/ol)
- Tables for comparisons
- Bold/italic for emphasis
- Citations [Source Name, 2025] throughout

Target: 95%+ SEO score on first generation!`;
}
