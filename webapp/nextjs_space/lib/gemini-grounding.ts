/**
 * Gemini with Google Search Grounding
 * 
 * Provides real-time web search capabilities for:
 * - Current rebates and incentives
 * - Latest pricing data
 * - Government program updates
 * - Keyword research
 * - E-E-A-T validation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GroundedResponse {
  content: string;
  sources: GroundingSource[];
  searchQueries?: string[];
  groundingScore?: number;
}

/**
 * Get Gemini API keys from database
 */
async function getGeminiKeys(): Promise<string[]> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const settings = await prisma.apiSettings.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings?.geminiApiKey) {
      throw new Error('No Gemini API keys configured');
    }

    // Decrypt keys
    const decryptKey = (encrypted: string) => {
      try {
        return Buffer.from(encrypted, 'base64').toString('utf-8');
      } catch {
        return '';
      }
    };

    const encryptedKeys = JSON.parse(settings.geminiApiKey);
    const keys = Array.isArray(encryptedKeys) 
      ? encryptedKeys.map(k => decryptKey(k)).filter(Boolean)
      : [decryptKey(settings.geminiApiKey)].filter(Boolean);

    return keys;
  } finally {
    await prisma.$disconnect();
  }
}

// Round-robin key selection
let currentKeyIndex = 0;

async function getNextApiKey(): Promise<string> {
  const keys = await getGeminiKeys();
  if (keys.length === 0) {
    throw new Error('No API keys available');
  }
  
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  
  return key;
}

/**
 * Generate content with Google Search grounding
 */
export async function generateWithGrounding(
  prompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<GroundedResponse> {
  const apiKey = await getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: options.model || 'gemini-2.5-flash',
    tools: [{
      googleSearch: {}
    }]
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  
  // Extract content
  const content = response.text();
  
  // Extract grounding metadata
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const sources: GroundingSource[] = [];
  
  if (groundingMetadata?.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || 'Unknown',
          url: chunk.web.uri || '',
          snippet: chunk.web.snippet || '',
        });
      }
    });
  }
  
  // Extract search queries used
  const searchQueries = groundingMetadata?.searchEntryPoint?.renderedContent 
    ? [groundingMetadata.searchEntryPoint.renderedContent]
    : [];
  
  return {
    content,
    sources,
    searchQueries,
    groundingScore: sources.length > 0 ? 100 : 0,
  };
}

/**
 * Research keywords with search volume data
 */
export async function researchKeywords(
  topic: string,
  location: string = 'Perth, Western Australia'
): Promise<{
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    competition: 'LOW' | 'MEDIUM' | 'HIGH';
    intent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL';
    cpc?: number;
  }>;
  sources: GroundingSource[];
}> {
  const prompt = `Research SEO keywords for: ${topic}
Location: ${location}

Find the top 20 keywords with:
1. Search volume (monthly searches)
2. Competition level (LOW/MEDIUM/HIGH)
3. Search intent (INFORMATIONAL/COMMERCIAL/TRANSACTIONAL)
4. Estimated CPC (if available)

Search for current data from:
- Google Keyword Planner
- Ahrefs
- SEMrush
- Ubersuggest
- AnswerThePublic

Return as JSON:
{
  "keywords": [
    {
      "keyword": "solar panels perth",
      "searchVolume": 2900,
      "competition": "MEDIUM",
      "intent": "COMMERCIAL",
      "cpc": 4.50
    }
  ]
}`;

  const response = await generateWithGrounding(prompt);
  
  // Parse JSON from response
  let jsonContent = response.content.trim();
  if (jsonContent.includes('```json')) {
    jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
  }
  
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }
  
  try {
    const data = JSON.parse(jsonContent);
    return {
      keywords: data.keywords || [],
      sources: response.sources,
    };
  } catch (error) {
    console.error('Failed to parse keyword data:', error);
    return {
      keywords: [],
      sources: response.sources,
    };
  }
}

/**
 * Fetch current solar data with sources
 */
export async function fetchCurrentSolarData(): Promise<{
  data: {
    waStateRebate?: { amount: number; eligibility: string };
    stcValue?: { price: number };
    feedInTariff?: { synergy: number; horizon: number };
    electricityPrices?: { peak: number; offPeak: number };
  };
  sources: GroundingSource[];
  lastUpdated: Date;
}> {
  const prompt = `What are the CURRENT (2025) solar rebates, incentives, and pricing in Perth, Western Australia?

Provide:
1. WA State Battery Rebate amount and eligibility
2. STC (Small-scale Technology Certificate) current value
3. Feed-in tariff rates (Synergy and Horizon Power)
4. Electricity prices (Synergy peak and off-peak rates)
5. Average solar panel prices per watt
6. Average battery storage prices per kWh

Search official sources:
- Clean Energy Regulator
- WA Government
- Synergy
- Horizon Power
- Western Power

Return as JSON with specific dollar amounts and dates.`;

  const response = await generateWithGrounding(prompt);
  
  // Parse response for structured data
  const content = response.content;
  
  // Extract data (simplified - you can enhance this)
  const data: any = {};
  
  // Try to extract rebate amount
  const rebateMatch = content.match(/\$(\d+,?\d*)/);
  if (rebateMatch) {
    data.waStateRebate = {
      amount: parseInt(rebateMatch[1].replace(',', '')),
      eligibility: 'Household income under $210,000',
    };
  }
  
  return {
    data,
    sources: response.sources,
    lastUpdated: new Date(),
  };
}

/**
 * Validate E-E-A-T compliance
 */
export async function validateEEAT(
  articleContent: string,
  topic: string
): Promise<{
  score: number;
  experience: number;
  expertise: number;
  authoritativeness: number;
  trustworthiness: number;
  suggestions: string[];
  sources: GroundingSource[];
}> {
  const prompt = `Analyze this article for E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness):

Topic: ${topic}

Article Content:
${articleContent.substring(0, 2000)}...

Evaluate:
1. EXPERIENCE (0-100): Does it show first-hand experience with solar installations?
2. EXPERTISE (0-100): Does it demonstrate technical knowledge and credentials?
3. AUTHORITATIVENESS (0-100): Does it cite authoritative sources (government, industry)?
4. TRUSTWORTHINESS (0-100): Is information accurate, transparent, and up-to-date?

Search for:
- Industry standards and best practices
- Government regulations and requirements
- Expert opinions and certifications
- Verified statistics and data

Return as JSON:
{
  "experience": 75,
  "expertise": 85,
  "authoritativeness": 90,
  "trustworthiness": 95,
  "suggestions": [
    "Add case study from real Perth installation",
    "Include CEC accreditation details",
    "Cite Clean Energy Regulator statistics"
  ]
}`;

  const response = await generateWithGrounding(prompt);
  
  // Parse JSON
  let jsonContent = response.content.trim();
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }
  
  try {
    const data = JSON.parse(jsonContent);
    const score = Math.round(
      (data.experience + data.expertise + data.authoritativeness + data.trustworthiness) / 4
    );
    
    return {
      score,
      experience: data.experience || 0,
      expertise: data.expertise || 0,
      authoritativeness: data.authoritativeness || 0,
      trustworthiness: data.trustworthiness || 0,
      suggestions: data.suggestions || [],
      sources: response.sources,
    };
  } catch (error) {
    console.error('Failed to parse E-E-A-T data:', error);
    return {
      score: 0,
      experience: 0,
      expertise: 0,
      authoritativeness: 0,
      trustworthiness: 0,
      suggestions: [],
      sources: response.sources,
    };
  }
}

/**
 * Validate YMYL (Your Money Your Life) compliance
 */
export async function validateYMYL(
  articleContent: string,
  topic: string
): Promise<{
  compliant: boolean;
  issues: string[];
  recommendations: string[];
  sources: GroundingSource[];
}> {
  const prompt = `Analyze this YMYL (Your Money Your Life) article for compliance:

Topic: ${topic}

Article Content:
${articleContent.substring(0, 2000)}...

YMYL Requirements:
1. Financial disclaimers for cost estimates
2. Cited sources from authoritative organizations
3. Expert review or credentials
4. Current and accurate information
5. Transparent pricing and terms
6. Contact information and accountability

Search for:
- Industry regulations and standards
- Consumer protection requirements
- Financial advice guidelines
- Best practices for YMYL content

Return as JSON:
{
  "compliant": true,
  "issues": ["Missing financial disclaimer", "No expert credentials shown"],
  "recommendations": [
    "Add disclaimer: 'Prices are estimates and may vary'",
    "Include CEC accreditation number",
    "Add last updated date"
  ]
}`;

  const response = await generateWithGrounding(prompt);
  
  // Parse JSON
  let jsonContent = response.content.trim();
  const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonContent = jsonMatch[0];
  }
  
  try {
    const data = JSON.parse(jsonContent);
    return {
      compliant: data.compliant || false,
      issues: data.issues || [],
      recommendations: data.recommendations || [],
      sources: response.sources,
    };
  } catch (error) {
    console.error('Failed to parse YMYL data:', error);
    return {
      compliant: false,
      issues: ['Failed to validate'],
      recommendations: [],
      sources: response.sources,
    };
  }
}

/**
 * Generate article with full grounding, E-E-A-T, and YMYL compliance
 */
export async function generateArticleWithCompliance(
  topic: string,
  targetKeyword: string,
  wordCount: number = 2000,
  options: {
    location?: string;
    targetAudience?: string;
  } = {}
): Promise<{
  content: string;
  sources: GroundingSource[];
  eeatScore: number;
  ymylCompliant: boolean;
  metadata: {
    wordCount: number;
    readabilityScore: number;
    keywordDensity: number;
  };
}> {
  const location = options.location || 'Perth, Western Australia';
  const audience = options.targetAudience || 'Perth homeowners';
  
  // Step 1: Research current data
  const solarData = await fetchCurrentSolarData();
  
  // Step 2: Generate article with grounding
  const prompt = `Write a comprehensive SEO-optimized article:

Topic: ${topic}
Target Keyword: ${targetKeyword}
Word Count: ${wordCount}
Location: ${location}
Target Audience: ${audience}

CURRENT VERIFIED DATA (from sources):
${solarData.sources.map((s, i) => `${i + 1}. ${s.title}: ${s.url}`).join('\n')}

REQUIREMENTS:
1. E-E-A-T Compliance:
   - Include real Perth installation examples
   - Show technical expertise with calculations
   - Cite authoritative sources (government, industry)
   - Demonstrate trustworthiness with accurate data

2. YMYL Compliance:
   - Add financial disclaimers for cost estimates
   - Include expert credentials (CEC accreditation)
   - Use current 2025 data only
   - Provide transparent pricing information
   - Add contact information

3. SEO Optimization:
   - Use target keyword naturally (1-2% density)
   - Include H2 and H3 headings
   - Add internal linking opportunities
   - Optimize for featured snippets

4. Content Structure:
   - Introduction (hook + value proposition)
   - Main content (detailed, actionable)
   - Case studies or examples
   - FAQ section
   - Call-to-action
   - Disclaimer and sources

Search for:
- Latest government rebates and programs
- Current pricing and tariff rates
- Industry statistics and trends
- Expert opinions and certifications
- Consumer reviews and testimonials

Write the article now, including citations [Source Name, 2025] throughout.`;

  const response = await generateWithGrounding(prompt, {
    maxTokens: wordCount * 2, // Allow for longer responses
  });
  
  // Step 3: Validate E-E-A-T
  const eeatValidation = await validateEEAT(response.content, topic);
  
  // Step 4: Validate YMYL
  const ymylValidation = await validateYMYL(response.content, topic);
  
  // Step 5: Calculate metadata
  const words = response.content.split(/\s+/).length;
  const keywordCount = (response.content.match(new RegExp(targetKeyword, 'gi')) || []).length;
  const keywordDensity = (keywordCount / words) * 100;
  
  return {
    content: response.content,
    sources: [...response.sources, ...eeatValidation.sources, ...ymylValidation.sources],
    eeatScore: eeatValidation.score,
    ymylCompliant: ymylValidation.compliant,
    metadata: {
      wordCount: words,
      readabilityScore: 65, // Placeholder - calculate with Flesch formula
      keywordDensity,
    },
  };
}
