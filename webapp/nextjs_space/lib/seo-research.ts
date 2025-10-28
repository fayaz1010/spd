/**
 * SEO Research & Optimization
 * 
 * Combines Google Ads keyword data + Search grounding
 * to generate data-driven SEO improvement prompts
 */

import { researchKeywordsWithGoogleAds } from './google-ads-keywords';
import { generateWithGrounding } from './gemini-grounding';

export interface SEOResearchData {
  // Keyword data from Google Ads
  primaryKeyword: string;
  keywordVolume: number;
  competition: string;
  relatedKeywords: Array<{
    keyword: string;
    volume: number;
    competition: string;
  }>;
  
  // Search data from Google grounding
  topRankingContent: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  commonHeadings: string[];
  commonTopics: string[];
  averageWordCount: number;
  
  // SEO insights
  optimalKeywordDensity: number;
  recommendedHeadings: string[];
  missingTopics: string[];
}

/**
 * Research SEO data for a keyword using both Ads API and Search grounding
 */
export async function researchSEOData(
  keyword: string,
  location: string = 'Perth, Western Australia'
): Promise<SEOResearchData> {
  console.log(`🔍 Researching SEO data for: "${keyword}"`);
  
  // Step 1: Get keyword data from Google Ads
  console.log('📊 Fetching keyword data from Google Ads...');
  const keywordData = await researchKeywordsWithGoogleAds(keyword, location, [keyword]);
  
  // Step 2: Analyze top-ranking content using Google Search grounding
  console.log('🌐 Analyzing top-ranking content...');
  const searchAnalysis = await analyzeTopRankingContent(keyword);
  
  // Step 3: Combine data
  const primaryKeywordData = keywordData.keywords.find(k => 
    k.keyword.toLowerCase() === keyword.toLowerCase()
  ) || keywordData.keywords[0];
  
  const relatedKeywords = keywordData.keywords
    .filter(k => k.keyword.toLowerCase() !== keyword.toLowerCase())
    .slice(0, 10)
    .map(k => ({
      keyword: k.keyword,
      volume: k.searchVolume,
      competition: k.competition,
    }));
  
  return {
    primaryKeyword: keyword,
    keywordVolume: primaryKeywordData?.searchVolume || 0,
    competition: primaryKeywordData?.competition || 'MEDIUM',
    relatedKeywords,
    topRankingContent: searchAnalysis.topResults,
    commonHeadings: searchAnalysis.commonHeadings,
    commonTopics: searchAnalysis.commonTopics,
    averageWordCount: searchAnalysis.averageWordCount,
    optimalKeywordDensity: calculateOptimalDensity(keyword, searchAnalysis.averageWordCount),
    recommendedHeadings: searchAnalysis.commonHeadings.slice(0, 8),
    missingTopics: [], // Will be filled by comparing with current article
  };
}

/**
 * Analyze top-ranking content structure using Google Search grounding
 */
async function analyzeTopRankingContent(keyword: string): Promise<{
  topResults: Array<{ title: string; url: string; snippet: string }>;
  commonHeadings: string[];
  commonTopics: string[];
  averageWordCount: number;
}> {
  const prompt = `Analyze the top 10 Google search results for "${keyword}".

For each result, extract:
1. Title
2. URL
3. Snippet/description
4. Common heading patterns (H2, H3)
5. Main topics covered
6. Estimated word count

Return a JSON object with:
{
  "topResults": [{ "title": "", "url": "", "snippet": "" }],
  "commonHeadings": ["heading1", "heading2", ...],
  "commonTopics": ["topic1", "topic2", ...],
  "averageWordCount": 2000
}`;

  const response = await generateWithGrounding(prompt, {
    model: 'gemini-2.5-flash',
    jsonMode: true,
  });
  
  try {
    const data = JSON.parse(response.content);
    return {
      topResults: data.topResults || [],
      commonHeadings: data.commonHeadings || [],
      commonTopics: data.commonTopics || [],
      averageWordCount: data.averageWordCount || 2000,
    };
  } catch (error) {
    console.error('Failed to parse search analysis:', error);
    return {
      topResults: [],
      commonHeadings: [],
      commonTopics: [],
      averageWordCount: 2000,
    };
  }
}

/**
 * Calculate optimal keyword density based on word count
 */
function calculateOptimalDensity(keyword: string, wordCount: number): number {
  // Optimal density: 0.5-2% for most keywords
  // Longer content can have lower density
  if (wordCount > 3000) return 0.8;
  if (wordCount > 2000) return 1.0;
  if (wordCount > 1000) return 1.2;
  return 1.5;
}

/**
 * Generate SEO improvement prompt using research data
 */
export async function generateSEOImprovementPrompt(
  currentContent: string,
  currentTitle: string,
  researchData: SEOResearchData,
  currentSEOScore: number,
  attempt: number = 1
): Promise<string> {
  // Analyze what's missing in current content
  const missingTopics = researchData.commonTopics.filter(topic => 
    !currentContent.toLowerCase().includes(topic.toLowerCase())
  );
  
  const missingHeadings = researchData.recommendedHeadings.filter(heading =>
    !currentContent.toLowerCase().includes(heading.toLowerCase())
  );
  
  const prompt = `You are an SEO expert. Generate a detailed improvement prompt for optimizing this article.

**CURRENT ARTICLE:**
Title: ${currentTitle}
SEO Score: ${currentSEOScore}%
Word Count: ${currentContent.split(/\s+/).length}

**TARGET KEYWORD:** ${researchData.primaryKeyword}
- Search Volume: ${researchData.keywordVolume.toLocaleString()}/month
- Competition: ${researchData.competition}
- Optimal Density: ${researchData.optimalKeywordDensity}%

**RELATED KEYWORDS TO INCLUDE:**
${researchData.relatedKeywords.slice(0, 5).map(k => 
  `- ${k.keyword} (${k.volume.toLocaleString()}/month, ${k.competition})`
).join('\n')}

**TOP-RANKING CONTENT ANALYSIS:**
Average Word Count: ${researchData.averageWordCount}
Common Headings: ${researchData.commonHeadings.join(', ')}
Common Topics: ${researchData.commonTopics.join(', ')}

**MISSING FROM CURRENT ARTICLE:**
Topics: ${missingTopics.length > 0 ? missingTopics.join(', ') : 'None'}
Headings: ${missingHeadings.length > 0 ? missingHeadings.join(', ') : 'None'}

**IMPROVEMENT ATTEMPT:** ${attempt}/5
${attempt > 1 ? `Previous attempt achieved ${currentSEOScore}%. Need to reach 95%.` : ''}

**TASK:**
Generate a detailed, actionable prompt that will improve this article's SEO to 95%+.
Focus on:
1. Keyword placement and density
2. Heading structure (match top-ranking patterns)
3. Content depth (cover missing topics)
4. Natural language (avoid keyword stuffing)
5. User intent alignment

Return ONLY the improvement prompt text.`;

  const response = await generateWithGrounding(prompt, {
    model: 'gemini-2.5-flash',
    maxTokens: 2000,
  });
  
  return response.content.trim();
}
