// AI Integration Library - Supports OpenAI and Google Gemini
import { prisma } from './db';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  cost?: number;
}

// Global state for round-robin key selection
let currentKeyIndex = 0;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests

/**
 * Decrypt multiple Gemini API keys from JSON array
 */
function decryptGeminiKeys(encryptedData: string | null): string[] {
  if (!encryptedData) return [];
  try {
    const encryptedKeys = JSON.parse(encryptedData);
    if (!Array.isArray(encryptedKeys)) return [];
    return encryptedKeys.map(key => decryptKey(key)).filter(key => key);
  } catch {
    // Fallback: treat as single key (backward compatibility)
    const singleKey = decryptKey(encryptedData);
    return singleKey ? [singleKey] : [];
  }
}

/**
 * Get AI settings with decrypted Gemini keys array
 */
async function getAISettings() {
  const settings = await prisma.apiSettings.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!settings) {
    throw new Error('No API settings found');
  }

  return settings;
}

/**
 * Get next Gemini API key using round-robin through the keys array
 */
async function getNextGeminiKey(): Promise<string | null> {
  const settings = await getAISettings();
  
  if (!settings.geminiEnabled || !settings.geminiApiKey) {
    return null;
  }
  
  // Decrypt all keys
  const keys = decryptGeminiKeys(settings.geminiApiKey);
  
  if (keys.length === 0) {
    return null;
  }
  
  // Round-robin through available keys
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex++;
  
  console.log(`[Round-Robin] Using Gemini key ${(currentKeyIndex - 1) % keys.length + 1}/${keys.length}`);
  
  return key;
}

/**
 * Rate limiting: Wait if needed to stay within API limits
 */
async function rateLimitWait() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`[Rate Limit] Waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Decrypt API key (simple base64 - replace with proper encryption in production)
 */
function decryptKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    return Buffer.from(encryptedKey, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  messages: AIMessage[],
  apiKey: string,
  model: string = 'gpt-4'
): Promise<AIResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    tokensUsed: data.usage?.total_tokens,
    cost: calculateOpenAICost(data.usage?.total_tokens || 0, model),
  };
}

/**
 * Call Google Gemini API
 * 
 * Model Selection Strategy:
 * - gemini-2.0-flash-exp: Content generation (cheaper, higher quota)
 * - gemini-2.5-flash-exp-0827: Images, enhancement, polishing (better quality)
 */
async function callGemini(
  messages: AIMessage[],
  apiKey: string,
  model: string = 'gemini-2.0-flash-exp',
  maxTokens: number = 8000
): Promise<AIResponse> {
  // Gemini uses a different message format
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const conversationHistory = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const prompt = systemPrompt 
    ? `${systemPrompt}\n\n${conversationHistory[conversationHistory.length - 1]?.parts[0]?.text || ''}`
    : conversationHistory[conversationHistory.length - 1]?.parts[0]?.text || '';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens, // Use dynamic token limit
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  return {
    content,
    model,
    tokensUsed,
    cost: calculateGeminiCost(tokensUsed, model),
  };
}

/**
 * Calculate OpenAI cost (approximate)
 */
function calculateOpenAICost(tokens: number, model: string): number {
  const rates: Record<string, number> = {
    'gpt-4': 0.03 / 1000, // $0.03 per 1K tokens (average input/output)
    'gpt-4-turbo': 0.01 / 1000,
    'gpt-3.5-turbo': 0.002 / 1000,
  };
  return tokens * (rates[model] || rates['gpt-4']);
}

/**
 * Model fallback chain for text generation
 * Try 2.5 models first, then 2.0, then 1.5
 */
const TEXT_MODEL_FALLBACK = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-thinking-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

/**
 * Image generation only works with 2.5 Flash
 */
const IMAGE_MODEL = 'gemini-2.5-flash';

/**
 * Calculate Gemini cost (approximate)
 */
function calculateGeminiCost(tokens: number, model: string): number {
  // Gemini is significantly cheaper
  const rates: Record<string, number> = {
    'gemini-2.5-flash': 0.00015 / 1000,
    'gemini-2.0-flash-exp': 0.00015 / 1000, // ~$0.075 per 1M tokens
    'gemini-1.5-flash': 0.00015 / 1000,
    'gemini-1.5-pro': 0.0035 / 1000,
    'gemini-1.0-pro': 0.0005 / 1000,
  };
  return tokens * (rates[model] || rates['gemini-1.5-flash']);
}

/**
 * Main AI function with retry logic and rate limiting
 */
export async function generateAIResponse(
  messages: AIMessage[],
  options?: {
    preferredProvider?: 'openai' | 'gemini' | 'abacus';
    temperature?: number;
    maxTokens?: number;
    retries?: number;
    model?: string; // Override model selection
  }
): Promise<AIResponse> {
  const maxRetries = options?.retries ?? 3;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Rate limiting
      await rateLimitWait();
      
      // Get settings
      const settings = await getAISettings();
      
      console.log(`[AI Request] Attempt ${attempt + 1}/${maxRetries}`);

      // Priority: Gemini (cheapest) > OpenAI > Abacus
      const preferredProvider = options?.preferredProvider;

      // Try Gemini first (with round-robin key selection and model fallback)
      const geminiKey = await getNextGeminiKey();
      if (geminiKey) {
        // Determine which models to try
        const modelsToTry = options?.model 
          ? [options.model] // If specific model requested, only try that
          : TEXT_MODEL_FALLBACK; // Otherwise try fallback chain
        
        for (const modelToTry of modelsToTry) {
          try {
            console.log(`[AI] Trying Gemini model: ${modelToTry}`);
            const response = await callGemini(
              messages,
              geminiKey,
              modelToTry,
              options?.maxTokens
            );
            console.log(`[AI Success] Generated ${response.tokensUsed} tokens with ${modelToTry}`);
            return response;
          } catch (error: any) {
            console.error(`[AI Error] ${modelToTry} failed:`, error.message);
            lastError = error;
            
            // If quota exceeded, try next model in fallback chain
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
              console.log(`[Fallback] Quota exceeded on ${modelToTry}, trying next model...`);
              continue; // Try next model
            }
            
            // For other errors, break and try next key
            break;
          }
        }
        
        // If all models failed with quota, switch key and retry
        if (lastError?.message.includes('quota')) {
          const backoffTime = Math.min(5000 * Math.pow(2, attempt), 30000);
          console.log(`[Backoff] All models quota exceeded, switching key and waiting ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }

      // Try OpenAI
      if (settings.openaiEnabled && settings.openaiApiKey) {
        try {
          const apiKey = decryptKey(settings.openaiApiKey);
          const response = await callOpenAI(messages, apiKey, settings.openaiModel || 'gpt-4');
          console.log(`[AI Success] Generated ${response.tokensUsed} tokens with OpenAI`);
          return response;
        } catch (error: any) {
          console.error(`[AI Error] OpenAI attempt ${attempt + 1} failed:`, error.message);
          lastError = error;
        }
      }

      
      // If we get here, no provider worked for this attempt
      if (attempt < maxRetries - 1) {
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying...`);
        continue;
      }
    } catch (error: any) {
      console.error(`[AI Error] Unexpected error on attempt ${attempt + 1}:`, error);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const backoffTime = 5000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  // All retries exhausted
  throw new Error(`No AI provider is enabled or available after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

/**
 * Generate email response suggestion
 */
export async function generateEmailSuggestion(
  customerMessage: string,
  context?: string
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a helpful customer service representative for Sun Direct Power, a solar installation company in Australia. 
      Generate professional, friendly, and helpful email responses. Keep responses concise and actionable.
      ${context ? `Context: ${context}` : ''}`,
    },
    {
      role: 'user',
      content: `Customer message: "${customerMessage}"\n\nGenerate a professional response.`,
    },
  ];

  const response = await generateAIResponse(messages);
  return response.content;
}

/**
 * Analyze lead quality and provide scoring
 */
export async function analyzeLeadQuality(leadData: {
  name: string;
  email?: string;
  phone?: string;
  systemSize?: number;
  batterySize?: number;
  message?: string;
  address?: string;
}): Promise<{
  score: number;
  reasoning: string;
  nextActions: string[];
}> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a lead qualification expert for a solar installation company. 
      Analyze lead data and provide a quality score (0-100) with reasoning and recommended next actions.
      Return response as JSON with fields: score (number), reasoning (string), nextActions (array of strings).`,
    },
    {
      role: 'user',
      content: `Analyze this lead:\n${JSON.stringify(leadData, null, 2)}`,
    },
  ];

  const response = await generateAIResponse(messages);
  
  try {
    return JSON.parse(response.content);
  } catch {
    // Fallback if JSON parsing fails
    return {
      score: 50,
      reasoning: response.content,
      nextActions: ['Contact lead within 24 hours', 'Send quote'],
    };
  }
}

/**
 * Generate SMS message
 */
export async function generateSMSMessage(
  purpose: 'follow-up' | 'reminder' | 'confirmation' | 'update',
  customerName: string,
  context: string
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `Generate a brief, professional SMS message (max 160 characters) for Sun Direct Power solar installations.
      Be friendly, clear, and include a call-to-action when appropriate.`,
    },
    {
      role: 'user',
      content: `Purpose: ${purpose}\nCustomer: ${customerName}\nContext: ${context}\n\nGenerate SMS:`,
    },
  ];

  const response = await generateAIResponse(messages);
  // Truncate to SMS length
  return response.content.substring(0, 160);
}

/**
 * Chatbot response for customer inquiries
 */
export async function generateChatbotResponse(
  userMessage: string,
  conversationHistory: AIMessage[] = []
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a helpful AI assistant for Sun Direct Power, a solar installation company in Western Australia.
      
      Key information:
      - We install residential and commercial solar systems
      - We offer battery storage solutions
      - We handle all rebates and approvals (STC, WA State Rebate, Synergy, Western Power)
      - Average installation time: 1-2 days
      - Typical payback period: 3-5 years
      - We provide 25-year panel warranties and 10-year installation warranties
      
      Be helpful, professional, and encourage users to get a free quote or speak with our team.
      If you don't know something, suggest they contact our team directly.`,
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  const response = await generateAIResponse(messages);
  return response.content;
}

/**
 * Generate SEO-optimized blog post
 */
export async function generateBlogPost(input: {
  topic?: string;
  rawContent?: string;
  keywords?: string[];
  targetLength?: number;
}): Promise<{
  title: string;
  slug: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  keywords: string[];
  internalLinks: Array<{ text: string; suggestedUrl: string; context: string }>;
  seoScore: number;
  recommendations: string[];
}> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an expert solar energy content writer and SEO specialist for Australian solar companies.
      
      Your expertise:
      - SEO-optimized content with natural keyword integration
      - Australian solar regulations, rebates (STC, WA State Rebate, Synergy, Horizon Power)
      - Perth/Western Australia climate and solar conditions
      - Technical accuracy about solar panels, inverters, batteries
      - Engaging, conversational writing style
      - Proper HTML formatting with semantic headings
      
      Always include:
      - Compelling title (50-60 characters)
      - Meta description (150-160 characters)
      - H2 and H3 headings for structure
      - Internal linking opportunities
      - Call-to-action
      - Australian-specific information`,
    },
    {
      role: 'user',
      content: input.rawContent 
        ? `Transform this raw content into a professional, SEO-optimized blog post (${input.targetLength || 1000} words):

${input.rawContent}

Target keywords: ${input.keywords?.join(', ') || 'solar panels, solar energy, Perth solar'}

IMPORTANT: Return ONLY valid JSON, no other text. Use this exact structure:
{
  "title": "SEO title (50-60 chars)",
  "slug": "url-friendly-slug",
  "metaDescription": "Meta description (150-160 chars)",
  "content": "Full HTML content with <h2>, <h3>, <p>, <ul>, <strong> tags",
  "excerpt": "Brief excerpt (150 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "internalLinks": [{"text": "anchor text", "suggestedUrl": "/calculator", "context": "why link here"}],
  "seoScore": 85,
  "recommendations": ["Add more internal links", "Include statistics"]
}`
        : `Create a comprehensive, detailed blog post about: ${input.topic}

Target length: ${input.targetLength || 1200} words
Keywords: ${input.keywords?.join(', ') || 'solar panels, solar energy'}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON, no other text before or after
2. Ensure ALL JSON fields are complete before ending response
3. If approaching token limit, prioritize completing the JSON structure over adding more content
4. Close all quotes, brackets, and braces properly

Use this exact JSON structure:
{
  "title": "SEO-optimized title (50-60 chars)",
  "slug": "url-friendly-slug",
  "metaDescription": "Compelling meta description (150-160 chars)",
  "content": "Full HTML content with proper tags",
  "excerpt": "Brief excerpt (150 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "internalLinks": [{"text": "anchor text", "suggestedUrl": "/calculator", "context": "why link"}],
  "seoScore": 85,
  "recommendations": ["tip1", "tip2"]
}`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 8000 }); // Increased to handle longer content
  
  try {
    // Try to extract JSON from the response
    let jsonContent = response.content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find complete JSON object (must have closing brace)
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    // Validate JSON is complete before parsing
    const parsed = JSON.parse(jsonContent);
    
    // Verify required fields exist
    if (!parsed.title || !parsed.content || !parsed.slug) {
      throw new Error('Incomplete JSON response - missing required fields');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', response.content.substring(0, 500) + '...');
    throw new Error('Failed to parse AI response. The content may be incomplete. Please try again with a shorter topic or word count.');
  }
}

/**
 * Generate FAQ content
 */
export async function generateFAQ(input: {
  question?: string;
  topic?: string;
  category?: string;
}): Promise<{
  question: string;
  answer: string;
  category: string;
  tags: string[];
  relatedQuestions: string[];
}> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a solar energy expert creating FAQ content for Australian customers.
      
      Provide clear, accurate answers about:
      - Solar panel systems and technology
      - Battery storage
      - Australian rebates and incentives
      - Installation process
      - Costs and savings
      - Maintenance
      - Western Australian regulations
      
      Keep answers concise (100-200 words), accurate, and helpful.`,
    },
    {
      role: 'user',
      content: input.question
        ? `Create a comprehensive FAQ answer for: "${input.question}"

Category: ${input.category || 'General'}

Return as JSON:
{
  "question": "Refined question",
  "answer": "Detailed answer (100-200 words)",
  "category": "solar|battery|installation|pricing|rebates|maintenance",
  "tags": ["tag1", "tag2"],
  "relatedQuestions": ["Related question 1", "Related question 2"]
}`
        : `Generate 5 FAQs about: ${input.topic}

Return as JSON array of FAQ objects.`,
    },
  ];

  const response = await generateAIResponse(messages);
  
  try {
    return JSON.parse(response.content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Generate Case Study
 */
export async function generateCaseStudy(input: {
  customerName?: string;
  location?: string;
  systemSize?: number;
  batterySize?: number;
  rawNotes?: string;
  category?: string;
}): Promise<{
  title: string;
  slug: string;
  description: string;
  challenge: string;
  solution: string;
  results: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a case study writer for solar installations. Create compelling success stories that:
      
      - Highlight customer challenges
      - Explain the solution provided
      - Showcase measurable results
      - Build trust and credibility
      - Follow the Challenge-Solution-Results structure
      
      Make it engaging and professional.`,
    },
    {
      role: 'user',
      content: input.rawNotes
        ? `Create a professional case study from these notes:

Customer: ${input.customerName || 'Customer'}
Location: ${input.location || 'Perth, WA'}
System: ${input.systemSize || 6.6}kW solar${input.batterySize ? ` + ${input.batterySize}kWh battery` : ''}
Category: ${input.category || 'Residential'}

Notes:
${input.rawNotes}

Return as JSON:
{
  "title": "Compelling title",
  "slug": "url-slug",
  "description": "Brief overview (100 words)",
  "challenge": "What problem did the customer face? (150 words)",
  "solution": "How did we solve it? (200 words)",
  "results": "What were the outcomes? Include numbers (150 words)",
  "metaTitle": "SEO title (60 chars)",
  "metaDescription": "Meta description (160 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}`
        : `Create a case study template for a ${input.category || 'residential'} solar installation.

System: ${input.systemSize}kW${input.batterySize ? ` + ${input.batterySize}kWh battery` : ''}
Location: ${input.location}

Return as JSON with the same structure.`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 2000 });
  
  try {
    return JSON.parse(response.content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Enhance testimonial (make it more professional while keeping authenticity)
 */
export async function enhanceTestimonial(input: {
  customerName: string;
  rawReview: string;
  rating: number;
  systemSize?: number;
}): Promise<{
  title: string;
  review: string;
  suggestions: string[];
}> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a testimonial editor. Enhance customer reviews while:
      
      - Keeping the authentic voice and tone
      - Fixing grammar and spelling
      - Making it more compelling
      - Maintaining truthfulness
      - Keeping it concise (100-150 words)
      
      NEVER add false claims or exaggerate.`,
    },
    {
      role: 'user',
      content: `Enhance this testimonial:

Customer: ${input.customerName}
Rating: ${input.rating}/5 stars
${input.systemSize ? `System: ${input.systemSize}kW` : ''}

Raw review:
"${input.rawReview}"

Return as JSON:
{
  "title": "Short catchy title (5-8 words)",
  "review": "Enhanced review (100-150 words)",
  "suggestions": ["Keep specific numbers", "Add more detail about service"]
}`,
    },
  ];

  const response = await generateAIResponse(messages);
  
  try {
    return JSON.parse(response.content);
  } catch {
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Helper: Generate content with Gemini 2.0 Flash (cheaper, higher quota)
 * Use for: Blog content, FAQs, testimonials, case studies
 */
export async function generateContent(
  messages: AIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<AIResponse> {
  return generateAIResponse(messages, {
    ...options,
    model: 'gemini-2.0-flash-exp',
  });
}

/**
 * Helper: Generate with Gemini 2.5 Flash (better quality)
 * Use for: Image generation, enhancement, polishing, final review
 */
export async function generateEnhanced(
  messages: AIMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<AIResponse> {
  return generateAIResponse(messages, {
    ...options,
    model: 'gemini-2.5-flash-exp-0827',
  });
}
