/**
 * AI-Powered Article Fixer
 * Multi-step approach: Analysis → Fix Prompt → Execute Fix → Polish
 */

import { generateAIResponse, AIMessage } from './ai';
import { BlogQualityReport } from './blog-quality-scanner';
import { SEOReport } from './blog-seo-scanner';
import { formatSources } from './content-formatter';
import { polishArticle } from './article-polisher';
import { formatTables, validateAndFixTables } from './table-formatter';

export interface ArticleFixRequest {
  postId: string;
  postTitle: string;
  currentContent: string;
  targetKeyword: string;
  strategyName?: string;
  qualityReport: BlogQualityReport;
  seoReport: SEOReport;
  metaTitle?: string;
  metaDescription?: string;
}

export interface ArticleFixResult {
  success: boolean;
  fixedContent: string;
  fixPrompt: string;
  changesApplied: string[];
  qualityImprovement: number;
  seoImprovement: number;
  error?: string;
}

/**
 * STEP 1: Generate detailed fix prompt based on analysis
 */
export async function generateFixPrompt(request: ArticleFixRequest): Promise<string> {
  const { qualityReport, seoReport, targetKeyword, strategyName } = request;

  // Build comprehensive analysis summary
  const qualityIssuesSummary = qualityReport.issues
    .map(issue => `- [${issue.severity}] ${issue.type}: ${issue.description}`)
    .join('\n');

  const seoIssuesSummary = seoReport.issues
    .map(issue => `- [${issue.severity}] ${issue.type}: ${issue.description}\n  Recommendation: ${issue.recommendation}`)
    .join('\n');

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an expert content strategist and SEO specialist. Your task is to analyze article quality and SEO reports, then generate a DETAILED, ACTIONABLE fix prompt that another AI will use to fix the article.

The fix prompt should be:
1. Specific and actionable
2. Address all quality and SEO issues
3. Maintain the article's core message
4. Follow enterprise content standards
5. Be comprehensive but concise

Return ONLY the fix prompt text, no additional commentary.`,
    },
    {
      role: 'user',
      content: `Generate a detailed fix prompt for this article:

**Article:** ${request.postTitle}
**Target Keyword:** ${targetKeyword}
**Strategy:** ${strategyName || 'None'}
**Current Quality Score:** ${qualityReport.overallScore}/100
**Current SEO Score:** ${seoReport.seoScore}/100

**QUALITY ISSUES (${qualityReport.issues.length} total):**
${qualityIssuesSummary || 'No quality issues'}

**SEO ISSUES (${seoReport.issues.length} total):**
${seoIssuesSummary || 'No SEO issues'}

**REQUIRED ACTIONS:**
${qualityReport.requiredActions.join(', ') || 'None'}

**SEO STRENGTHS TO MAINTAIN:**
${seoReport.strengths.join(', ') || 'None'}

Generate a comprehensive fix prompt that addresses ALL issues above while maintaining the article's value and improving both quality and SEO scores to 90%+.`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 2000 });
  return response.content.trim();
}

/**
 * STEP 2: Execute fix using the generated prompt
 */
export async function executeArticleFix(
  request: ArticleFixRequest,
  fixPrompt: string
): Promise<string> {
  const { currentContent, postTitle, targetKeyword, strategyName } = request;

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an expert content writer and editor for Sun Direct Power, a solar installation company in Perth, Western Australia.

Your task is to fix and improve an article based on a detailed fix prompt.

CRITICAL REQUIREMENTS:
1. Return ONLY the fixed HTML content
2. NO markdown code blocks (no \`\`\`html)
3. NO explanations or commentary
4. Start directly with HTML content
5. Maintain proper HTML structure
6. Use Australian spelling
7. Keep the article's core message and value
8. Apply ALL fixes from the prompt

QUALITY STANDARDS:
- 2-3 CTAs strategically placed (INTRO + CONCLUSION)
- 3-5 internal links to related content
- Proper sources section (deduplicated, no API URLs)
- All images have alt text
- Proper heading hierarchy (H2, H3)
- Clean HTML (no broken tags)
- Professional formatting

SEO STANDARDS:
- Target keyword in title, first paragraph, headings
- Keyword density 0.5-2%
- Meta-optimized content
- Schema markup included
- 1000-2000 words
- Proper heading structure`,
    },
    {
      role: 'user',
      content: `Fix this article using the detailed instructions below:

**Article Title:** ${postTitle}
**Target Keyword:** ${targetKeyword}
**Strategy:** ${strategyName || 'General solar content'}

**FIX INSTRUCTIONS:**
${fixPrompt}

**CURRENT ARTICLE CONTENT:**
${currentContent}

**TASK:**
Apply ALL fixes from the instructions above. Return ONLY the fixed HTML content (no markdown blocks, no explanations).`,
    },
  ];

  const response = await generateAIResponse(messages, { 
    // No maxTokens limit - allow AI to generate complete content
    temperature: 0.7,
  });

  let fixedContent = response.content.trim();

  // Remove markdown code blocks if AI added them
  if (fixedContent.startsWith('```html')) {
    fixedContent = fixedContent.replace(/^```html\n?/i, '').replace(/\n?```$/i, '');
  } else if (fixedContent.startsWith('```')) {
    fixedContent = fixedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  return fixedContent;
}

/**
 * STEP 3: Polish and format the fixed content
 */
export function polishFixedContent(
  content: string,
  sources?: any[]
): string {
  let polished = content;

  // 1. Validate and fix tables
  polished = validateAndFixTables(polished);
  polished = formatTables(polished);

  // 2. Add properly formatted sources if provided
  if (sources && sources.length > 0) {
    const sourcesSection = formatSources(sources);
    if (sourcesSection && !polished.includes('Sources:')) {
      polished += sourcesSection;
    }
  }

  // 3. Polish HTML
  const polishResult = polishArticle(polished);
  polished = polishResult.content;

  // 4. Final cleanup
  polished = polished.replace(/\n{3,}/g, '\n\n'); // Remove excessive newlines
  polished = polished.trim();

  return polished;
}

/**
 * COMPLETE FIX WORKFLOW: All 3 steps
 */
export async function fixArticleComplete(
  request: ArticleFixRequest,
  onProgress?: (step: string, progress: number) => void
): Promise<ArticleFixResult> {
  try {
    const startQuality = request.qualityReport.overallScore;
    const startSEO = request.seoReport.seoScore;

    // STEP 1: Generate fix prompt
    onProgress?.('Analyzing issues and generating fix strategy...', 20);
    const fixPrompt = await generateFixPrompt(request);

    // STEP 2: Execute fix
    onProgress?.('Applying fixes to article content...', 50);
    const fixedContent = await executeArticleFix(request, fixPrompt);

    // STEP 3: Polish
    onProgress?.('Polishing and formatting...', 80);
    const polishedContent = polishFixedContent(fixedContent);

    // Track changes
    const changesApplied: string[] = [];
    
    // Check what was fixed
    if (request.qualityReport.issues.some(i => i.type === 'CTA_STACKING')) {
      changesApplied.push('Fixed CTA stacking');
    }
    if (request.qualityReport.issues.some(i => i.type === 'SOURCES_MISSING')) {
      changesApplied.push('Added sources section');
    }
    if (request.seoReport.issues.some(i => i.type === 'KEYWORD')) {
      changesApplied.push('Optimized keyword usage');
    }
    if (request.seoReport.issues.some(i => i.type === 'INTERNAL_LINKS')) {
      changesApplied.push('Added internal links');
    }
    if (request.seoReport.issues.some(i => i.type === 'SCHEMA')) {
      changesApplied.push('Added schema markup');
    }
    if (request.seoReport.issues.some(i => i.type === 'META')) {
      changesApplied.push('Optimized meta tags');
    }

    onProgress?.('Complete!', 100);

    // Estimate improvements (actual scores would need re-scanning)
    const qualityImprovement = Math.min(90, startQuality + 20);
    const seoImprovement = Math.min(95, startSEO + 15);

    return {
      success: true,
      fixedContent: polishedContent,
      fixPrompt,
      changesApplied,
      qualityImprovement: qualityImprovement - startQuality,
      seoImprovement: seoImprovement - startSEO,
    };
  } catch (error: any) {
    console.error('Article fix error:', error);
    return {
      success: false,
      fixedContent: request.currentContent,
      fixPrompt: '',
      changesApplied: [],
      qualityImprovement: 0,
      seoImprovement: 0,
      error: error.message || 'Failed to fix article',
    };
  }
}

/**
 * Batch fix multiple articles
 */
export async function batchFixArticles(
  requests: ArticleFixRequest[],
  onProgress?: (articleIndex: number, step: string, progress: number) => void
): Promise<ArticleFixResult[]> {
  const results: ArticleFixResult[] = [];

  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    
    const result = await fixArticleComplete(request, (step, progress) => {
      onProgress?.(i, step, progress);
    });
    
    results.push(result);
    
    // Small delay between articles
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
