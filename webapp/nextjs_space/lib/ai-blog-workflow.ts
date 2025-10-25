import { generateAIResponse, AIMessage } from './ai';

/**
 * Multi-Step Blog Generation Workflow
 * Step 1: Generate structure and outline
 * Step 2: Generate content for each section
 * Step 3: Compile into final blog post
 */

export interface BlogOutline {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  hook: string;
  tone: 'professional' | 'conversational' | 'technical' | 'marketing';
  targetAudience: string;
  callToAction: string;
  internalLinks: Array<{
    text: string;
    url: string;
    placement: string;
  }>;
  sections: Array<{
    heading: string;
    subheadings: string[];
    keyPoints: string[];
    prompt: string;
    wordCount: number;
  }>;
  intro: {
    prompt: string;
    keyPoints: string[];
    wordCount: number;
  };
  conclusion: {
    prompt: string;
    keyPoints: string[];
    wordCount: number;
  };
}

export interface BlogSection {
  heading: string;
  content: string;
}

export interface CompleteBlogPost {
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  content: string;
  seoScore: number;
  recommendations: string[];
  internalLinks: Array<{ text: string; suggestedUrl: string; context: string }>;
}

/**
 * Step 1: Generate blog outline and structure
 */
export async function generateBlogOutline(input: {
  topic: string;
  keywords?: string[];
  targetLength?: number;
  tone?: 'professional' | 'conversational' | 'technical' | 'marketing';
  includePackages?: boolean;
  targetAudience?: string;
}): Promise<BlogOutline> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are an expert content strategist for Sun Direct Power, a solar installation company in Perth, Western Australia.
      
Your expertise:
- SEO-optimized content structure
- Australian solar market (rebates, regulations, climate)
- Engaging, conversion-focused writing
- Strategic internal linking
- Marketing psychology and hooks

Company offerings:
- Residential & commercial solar systems
- Battery storage solutions (Tesla, BYD, Sungrow)
- Solar panels (Tier 1 brands)
- Inverters (Fronius, SolarEdge, Huawei)
- EV chargers
- Solar hot water
- Monitoring systems

Key pages to link to:
- /calculator-v2 (Solar calculator)
- /shop (Product shop)
- /shop/packages (Solar packages)
- /extra-services (Additional services)
- /blog (Blog home)`,
    },
    {
      role: 'user',
      content: `Create a detailed blog post outline for: "${input.topic}"

Requirements:
- Target length: ${input.targetLength || 1200} words
- Tone: ${input.tone || 'marketing'} (engaging, conversion-focused)
- Target audience: ${input.targetAudience || 'Perth homeowners considering solar'}
- Keywords: ${input.keywords?.join(', ') || 'solar panels, solar energy, Perth solar'}
${input.includePackages ? '- Include mentions of solar packages and products from our shop' : ''}

Return ONLY valid JSON with this structure:
{
  "title": "Compelling SEO title (50-60 chars)",
  "slug": "url-friendly-slug",
  "metaDescription": "Meta description with keywords (150-160 chars)",
  "excerpt": "Brief excerpt for preview (150 chars)",
  "keywords": ["primary keyword", "secondary keyword", "long-tail keyword"],
  "hook": "Opening hook to grab attention (1-2 sentences)",
  "tone": "marketing",
  "targetAudience": "Perth homeowners considering solar",
  "callToAction": "Strong CTA for conclusion",
  "internalLinks": [
    {"text": "anchor text", "url": "/calculator-v2", "placement": "after intro"},
    {"text": "solar packages", "url": "/shop/packages", "placement": "in section 2"}
  ],
  "sections": [
    {
      "heading": "Main section H2 heading",
      "subheadings": ["H3 subheading 1", "H3 subheading 2"],
      "keyPoints": ["Key point to cover", "Another key point"],
      "prompt": "Detailed prompt for AI to generate this section content",
      "wordCount": 300
    }
  ],
  "intro": {
    "prompt": "Write an engaging introduction that...",
    "keyPoints": ["Hook reader", "Establish credibility", "Preview content"],
    "wordCount": 150
  },
  "conclusion": {
    "prompt": "Write a compelling conclusion that...",
    "keyPoints": ["Summarize benefits", "Strong CTA", "Create urgency"],
    "wordCount": 150
  }
}`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 4000 });
  
  try {
    let jsonContent = response.content.trim();
    
    // Remove markdown code blocks
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Extract JSON
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }
    
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Failed to parse outline:', response.content.substring(0, 500));
    throw new Error('Failed to generate blog outline. Please try again.');
  }
}

/**
 * Step 2: Generate content for a specific section
 */
export async function generateSectionContent(
  section: {
    heading: string;
    subheadings: string[];
    keyPoints: string[];
    prompt: string;
    wordCount: number;
  },
  context: {
    blogTitle: string;
    tone: string;
    keywords: string[];
  }
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are writing a section for a blog post titled "${context.blogTitle}".

Tone: ${context.tone}
Keywords to include naturally: ${context.keywords.join(', ')}

Write engaging, informative content with:
- Proper HTML formatting (<h2>, <h3>, <p>, <ul>, <strong>)
- Natural keyword integration
- Conversational yet professional style
- Australian spelling and terminology
- Specific examples and statistics where relevant`,
    },
    {
      role: 'user',
      content: `${section.prompt}

Section heading: ${section.heading}
Subheadings to cover: ${section.subheadings.join(', ')}
Key points: ${section.keyPoints.join(', ')}
Target word count: ${section.wordCount} words

CRITICAL: Return ONLY the HTML content for this section. 
- NO <html>, <body>, or <head> tags
- NO markdown code blocks
- Start directly with <h2>${section.heading}</h2>
- Include all subheadings as <h3>
- Use <p>, <ul>, <li>, <strong>, <a> tags as needed`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 2000 });
  return response.content.trim();
}

/**
 * Step 3: Generate introduction
 */
export async function generateIntroduction(
  intro: { prompt: string; keyPoints: string[]; wordCount: number },
  context: { blogTitle: string; hook: string; tone: string; keywords: string[] }
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are writing the introduction for a blog post titled "${context.blogTitle}".

Tone: ${context.tone}
Keywords: ${context.keywords.join(', ')}

The introduction should:
- Start with the provided hook
- Engage the reader immediately
- Establish credibility
- Preview what's coming
- Include primary keyword naturally`,
    },
    {
      role: 'user',
      content: `${intro.prompt}

Hook to start with: "${context.hook}"
Key points to cover: ${intro.keyPoints.join(', ')}
Target word count: ${intro.wordCount} words

CRITICAL: Return ONLY the HTML content for the introduction.
- NO <html>, <body>, or <head> tags
- NO markdown code blocks
- Just <p> tags with paragraphs
- No H2 heading (that's in the title)`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 1000 });
  return response.content.trim();
}

/**
 * Step 4: Generate conclusion
 */
export async function generateConclusion(
  conclusion: { prompt: string; keyPoints: string[]; wordCount: number },
  context: { blogTitle: string; callToAction: string; tone: string }
): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are writing the conclusion for a blog post titled "${context.blogTitle}".

Tone: ${context.tone}

The conclusion should:
- Summarize key takeaways
- Reinforce main benefits
- Include strong call-to-action
- Create sense of urgency
- End with confidence`,
    },
    {
      role: 'user',
      content: `${conclusion.prompt}

Call-to-action to include: "${context.callToAction}"
Key points: ${conclusion.keyPoints.join(', ')}
Target word count: ${conclusion.wordCount} words

CRITICAL: Return ONLY the HTML content for the conclusion.
- NO <html>, <body>, or <head> tags
- NO markdown code blocks
- Just <p> tags with paragraphs
- Include <a> tags for CTAs if needed`,
    },
  ];

  const response = await generateAIResponse(messages, { maxTokens: 1000 });
  return response.content.trim();
}

/**
 * Step 5: Compile complete blog post
 */
export async function compileCompleteBlogPost(
  outline: BlogOutline,
  intro: string,
  sections: BlogSection[],
  conclusion: string
): Promise<CompleteBlogPost> {
  // Combine all content
  let fullContent = intro;
  
  for (const section of sections) {
    fullContent += '\n\n' + section.content;
  }
  
  fullContent += '\n\n' + conclusion;
  
  // Insert internal links
  for (const link of outline.internalLinks) {
    const linkHtml = `<a href="${link.url}">${link.text}</a>`;
    // Simple replacement - in production, use more sophisticated placement logic
    fullContent = fullContent.replace(new RegExp(link.text, 'i'), linkHtml);
  }
  
  // Calculate SEO score (simple heuristic)
  let seoScore = 50;
  if (outline.title.length >= 50 && outline.title.length <= 60) seoScore += 10;
  if (outline.metaDescription.length >= 150 && outline.metaDescription.length <= 160) seoScore += 10;
  if (fullContent.includes('<h2>')) seoScore += 10;
  if (fullContent.includes('<h3>')) seoScore += 5;
  if (outline.keywords.some(k => fullContent.toLowerCase().includes(k.toLowerCase()))) seoScore += 10;
  if (outline.internalLinks.length >= 3) seoScore += 5;
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (outline.title.length < 50) recommendations.push('Title could be longer for better SEO');
  if (outline.internalLinks.length < 3) recommendations.push('Add more internal links');
  if (!fullContent.includes('<ul>')) recommendations.push('Consider adding bullet points for readability');
  if (fullContent.length < 2000) recommendations.push('Content could be more comprehensive');
  
  return {
    title: outline.title,
    slug: outline.slug,
    metaDescription: outline.metaDescription,
    excerpt: outline.excerpt,
    keywords: outline.keywords,
    content: fullContent,
    seoScore,
    recommendations,
    internalLinks: outline.internalLinks.map(link => ({
      text: link.text,
      suggestedUrl: link.url,
      context: link.placement,
    })),
  };
}

/**
 * Complete workflow: Generate entire blog post in steps
 */
export async function generateBlogPostWorkflow(input: {
  topic: string;
  keywords?: string[];
  targetLength?: number;
  tone?: 'professional' | 'conversational' | 'technical' | 'marketing';
  includePackages?: boolean;
  targetAudience?: string;
  onProgress?: (step: string, progress: number) => void;
}): Promise<CompleteBlogPost> {
  try {
    // Step 1: Generate outline
    input.onProgress?.('Generating blog structure...', 10);
    const outline = await generateBlogOutline(input);
    
    // Step 2: Generate introduction
    input.onProgress?.('Writing introduction...', 25);
    const intro = await generateIntroduction(outline.intro, {
      blogTitle: outline.title,
      hook: outline.hook,
      tone: outline.tone,
      keywords: outline.keywords,
    });
    
    // Step 3: Generate each section
    const sections: BlogSection[] = [];
    const sectionProgress = 50 / outline.sections.length;
    
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      input.onProgress?.(`Writing section ${i + 1}/${outline.sections.length}...`, 25 + (i * sectionProgress));
      
      const content = await generateSectionContent(section, {
        blogTitle: outline.title,
        tone: outline.tone,
        keywords: outline.keywords,
      });
      
      sections.push({
        heading: section.heading,
        content,
      });
    }
    
    // Step 4: Generate conclusion
    input.onProgress?.('Writing conclusion...', 80);
    const conclusion = await generateConclusion(outline.conclusion, {
      blogTitle: outline.title,
      callToAction: outline.callToAction,
      tone: outline.tone,
    });
    
    // Step 5: Compile everything
    input.onProgress?.('Compiling final blog post...', 90);
    const completeBlog = await compileCompleteBlogPost(outline, intro, sections, conclusion);
    
    input.onProgress?.('Complete!', 100);
    return completeBlog;
    
  } catch (error) {
    console.error('Blog generation workflow error:', error);
    throw error;
  }
}
