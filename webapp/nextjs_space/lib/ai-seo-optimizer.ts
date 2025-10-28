/**
 * AI SEO Optimizer with Retry Logic
 * 
 * Uses Google Ads + Search grounding to achieve 95% SEO score
 * Retries up to 5 times with progressively refined prompts
 */

import { generateAIResponse } from './ai';
import { researchSEOData, generateSEOImprovementPrompt } from './seo-research';
import { scanBlogSEO } from './blog-seo-scanner';
import { ensureHTML } from './markdown-converter';
import { formatTables, validateAndFixTables } from './table-formatter';
import { polishArticle } from './article-polisher';

export interface SEOOptimizationResult {
  success: boolean;
  optimizedContent: string;
  finalSEOScore: number;
  finalGrade: string;
  attempts: number;
  improvementHistory: Array<{
    attempt: number;
    seoScore: number;
    changes: string;
  }>;
  researchData?: any;
  error?: string;
}

/**
 * Optimize article SEO with retry logic (max 5 attempts)
 * Target: 95% SEO score
 */
export async function optimizeArticleSEO(
  currentContent: string,
  title: string,
  targetKeyword: string,
  metadata: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    slug?: string;
  },
  onProgress?: (message: string, attempt: number, score: number) => void
): Promise<SEOOptimizationResult> {
  const MAX_ATTEMPTS = 5;
  const TARGET_SCORE = 95;
  
  const improvementHistory: Array<{
    attempt: number;
    seoScore: number;
    changes: string;
  }> = [];
  
  try {
    // Step 1: Research SEO data (Google Ads + Search grounding)
    onProgress?.('Researching keyword data and top-ranking content...', 0, 0);
    const researchData = await researchSEOData(targetKeyword);
    
    console.log('📊 SEO Research Complete:', {
      keyword: researchData.primaryKeyword,
      volume: researchData.keywordVolume,
      competition: researchData.competition,
      relatedKeywords: researchData.relatedKeywords.length,
      topResults: researchData.topRankingContent.length,
    });
    
    let currentContentVersion = currentContent;
    let currentScore = 0;
    
    // Initial scan (exclude internal links for Phase 1 & 2)
    const initialScan = scanBlogSEO(currentContentVersion, title, 'temp', {
      ...metadata,
      targetKeyword,
      includeInternalLinks: false, // Phase 1 & 2: Focus on keywords + technical SEO
    });
    currentScore = initialScan.seoScore;
    
    console.log(`📈 Initial SEO Score: ${currentScore}% (Target: ${TARGET_SCORE}%)`);
    
    // If already at target, return
    if (currentScore >= TARGET_SCORE) {
      onProgress?.('Already at target SEO score!', 0, currentScore);
      return {
        success: true,
        optimizedContent: currentContentVersion,
        finalSEOScore: currentScore,
        finalGrade: initialScan.grade,
        attempts: 0,
        improvementHistory: [],
        researchData,
      };
    }
    
    // Retry loop: Up to 5 attempts
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      onProgress?.(
        `Optimization attempt ${attempt}/${MAX_ATTEMPTS} (Current: ${currentScore}%)...`,
        attempt,
        currentScore
      );
      
      console.log(`\n🔄 Attempt ${attempt}/${MAX_ATTEMPTS} - Current Score: ${currentScore}%`);
      
      // Generate improvement prompt using research data
      const improvementPrompt = await generateSEOImprovementPrompt(
        currentContentVersion,
        title,
        researchData,
        currentScore,
        attempt
      );
      
      console.log('📝 Generated improvement prompt');
      
      // Execute SEO optimization
      const optimizedContent = await executeSEOOptimization(
        currentContentVersion,
        title,
        targetKeyword,
        improvementPrompt,
        metadata
      );
      
      // Re-scan to check improvement
      const newScan = scanBlogSEO(optimizedContent, title, 'temp', {
        ...metadata,
        targetKeyword,
        includeInternalLinks: false, // Phase 1 & 2
      });
      
      const newScore = newScan.seoScore;
      const improvement = newScore - currentScore;
      
      console.log(`📊 New Score: ${newScore}% (${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%)`);
      
      // Track history
      improvementHistory.push({
        attempt,
        seoScore: newScore,
        changes: `Improved from ${currentScore}% to ${newScore}%`,
      });
      
      // Update current version
      currentContentVersion = optimizedContent;
      currentScore = newScore;
      
      // Check if target reached
      if (newScore >= TARGET_SCORE) {
        onProgress?.(`✅ Target achieved: ${newScore}%!`, attempt, newScore);
        console.log(`\n✅ SUCCESS! Reached ${newScore}% in ${attempt} attempt(s)`);
        
        return {
          success: true,
          optimizedContent: currentContentVersion,
          finalSEOScore: newScore,
          finalGrade: newScan.grade,
          attempts: attempt,
          improvementHistory,
          researchData,
        };
      }
      
      // If score didn't improve or got worse, log warning
      if (improvement <= 0) {
        console.log(`⚠️ Warning: Score did not improve (${improvement.toFixed(1)}%)`);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Max attempts reached
    onProgress?.(
      `Completed ${MAX_ATTEMPTS} attempts. Final score: ${currentScore}%`,
      MAX_ATTEMPTS,
      currentScore
    );
    
    console.log(`\n⚠️ Max attempts reached. Final score: ${currentScore}%`);
    
    return {
      success: currentScore >= 90, // Consider 90%+ a partial success
      optimizedContent: currentContentVersion,
      finalSEOScore: currentScore,
      finalGrade: scanBlogSEO(currentContentVersion, title, 'temp', {
        ...metadata,
        targetKeyword,
        includeInternalLinks: false,
      }).grade,
      attempts: MAX_ATTEMPTS,
      improvementHistory,
      researchData,
    };
    
  } catch (error: any) {
    console.error('SEO optimization error:', error);
    return {
      success: false,
      optimizedContent: currentContent,
      finalSEOScore: 0,
      finalGrade: 'F',
      attempts: 0,
      improvementHistory,
      error: error.message || 'SEO optimization failed',
    };
  }
}

/**
 * Execute single SEO optimization pass
 */
async function executeSEOOptimization(
  content: string,
  title: string,
  targetKeyword: string,
  improvementPrompt: string,
  metadata: any
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are an expert SEO content optimizer for Sun Direct Power, a solar company in Perth, Western Australia.

Your task is to optimize article content for SEO while maintaining quality and readability.

CRITICAL REQUIREMENTS:
1. Return ONLY the optimized HTML content
2. NO markdown code blocks
3. NO explanations or commentary
4. Maintain the article's core value and message
5. Use Australian spelling
6. Natural keyword integration (avoid stuffing)
7. Preserve existing CTAs and structure
8. Focus on keyword optimization and content depth

TARGET: 95% SEO score through:
- Optimal keyword placement and density
- Comprehensive topic coverage
- Proper heading structure
- Natural language flow`,
    },
    {
      role: 'user' as const,
      content: `Optimize this article for SEO:

**Article Title:** ${title}
**Target Keyword:** ${targetKeyword}

**IMPROVEMENT INSTRUCTIONS:**
${improvementPrompt}

**CURRENT CONTENT:**
${content}

**TASK:**
Apply the improvements above. Return ONLY the optimized HTML content.`,
    },
  ];
  
  const response = await generateAIResponse(messages, {
    // No token limit - allow full content
    temperature: 0.7,
  });
  
  let optimizedContent = response.content.trim();
  
  // Remove markdown code blocks if present
  if (optimizedContent.startsWith('```html')) {
    optimizedContent = optimizedContent.replace(/^```html\n?/i, '').replace(/\n?```$/i, '');
  } else if (optimizedContent.startsWith('```')) {
    optimizedContent = optimizedContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }
  
  // Ensure HTML formatting
  optimizedContent = ensureHTML(optimizedContent);
  
  // Format tables
  optimizedContent = validateAndFixTables(optimizedContent);
  optimizedContent = formatTables(optimizedContent);
  
  // Polish
  const polished = polishArticle(optimizedContent);
  
  return polished.content;
}
