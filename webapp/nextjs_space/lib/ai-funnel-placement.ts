import { generateAIResponse, AIMessage } from './ai';

/**
 * AI-Powered Funnel Placement System
 * Intelligently determines which packages, products, and CTAs to use in each article
 */

export interface FunnelPlacement {
  calculatorCtas: {
    placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION';
    context: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  }[];
  packageLinks: {
    packageType: string; // e.g., "6.6kW Residential", "10kW Premium"
    placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION';
    context: string;
    reason: string;
  }[];
  productLinks: {
    category: 'panels' | 'inverters' | 'batteries';
    specificProduct?: string;
    placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION';
    context: string;
  }[];
  leadMagnets: {
    type: 'FREE_QUOTE' | 'FREE_ASSESSMENT' | 'EBOOK' | 'CALCULATOR' | 'CHECKLIST';
    placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION';
    headline: string;
    description: string;
  }[];
}

/**
 * Analyze article content and determine optimal funnel placements
 */
export async function generateFunnelPlacements(
  articleTitle: string,
  articleKeyword: string,
  articleIntent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL',
  articleType: 'PILLAR' | 'CLUSTER',
  targetAudience: string
): Promise<FunnelPlacement> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: `You are a conversion optimization expert specializing in solar energy sales funnels.

Your task is to analyze an article and determine the optimal funnel elements to maximize conversions.

Consider:
1. Article intent (informational, commercial, transactional)
2. User journey stage (awareness, consideration, decision)
3. Target audience needs
4. Natural placement opportunities
5. Conversion psychology

Available funnel elements:
- Calculator CTAs (instant quote calculator)
- Package links (6.6kW, 10kW, 13.2kW systems)
- Product links (panels, inverters, batteries)
- Lead magnets (free quote, assessment, ebook, checklist)

Return ONLY valid JSON with this structure:
{
  "calculatorCtas": [
    {
      "placement": "INTRO",
      "context": "After explaining rising electricity costs",
      "urgency": "HIGH"
    }
  ],
  "packageLinks": [
    {
      "packageType": "6.6kW Residential Package",
      "placement": "MIDDLE",
      "context": "When discussing system sizes for average homes",
      "reason": "Most common residential size in Perth"
    }
  ],
  "productLinks": [
    {
      "category": "panels",
      "specificProduct": "Trina Solar 400W",
      "placement": "MIDDLE",
      "context": "In comparison section"
    }
  ],
  "leadMagnets": [
    {
      "type": "FREE_QUOTE",
      "placement": "CONCLUSION",
      "headline": "Get Your Free Solar Quote Today",
      "description": "See how much you can save with solar in under 2 minutes"
    }
  ]
}`,
    },
    {
      role: 'user',
      content: `Article Title: ${articleTitle}
Article Keyword: ${articleKeyword}
Article Intent: ${articleIntent}
Article Type: ${articleType}
Target Audience: ${targetAudience}

Analyze this article and determine optimal funnel elements.

ENTERPRISE BEST PRACTICE LIMITS (optimal conversion rates):
- Calculator CTAs: 1-2 (early engagement + final conversion)
- Package links: 1-2 (contextual mentions)
- Product links: 0-1 (only if highly relevant)
- Lead magnets: 0-1 (alternative to calculator)

TOTAL: 2-5 funnel elements per article (enterprise standard)

Placement strategy (CRITICAL - prevent stacking):
- INTRO: 1 calculator CTA (early engagement for high-intent readers)
- MIDDLE: 1-2 package/product links (contextual, after key information)
- CONCLUSION: 1 calculator CTA OR 1 lead magnet (final conversion, NEVER both)

Consider:
- Informational articles: 1 CTA at INTRO + 1 lead magnet at CONCLUSION (2 total)
- Commercial articles: 1 CTA at INTRO + 1-2 package links at MIDDLE + 1 CTA at CONCLUSION (3-4 total)
- Transactional articles: 1 CTA at INTRO + 2 package links at MIDDLE + 1 CTA at CONCLUSION (4 total)

CRITICAL RULE: NEVER place multiple CTAs of same type in the SAME section.
Example: Don't put calculator CTA + lead magnet both at CONCLUSION - they will stack.

Return ONLY the JSON response with minimal, strategic placements.`,
    },
  ];

  try {
    const response = await generateAIResponse(messages); // No token limit
    
    // Parse JSON
    let jsonContent = response.content.trim();
    
    // Remove markdown code blocks
    if (jsonContent.includes('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/\n?```/g, '');
    } else if (jsonContent.includes('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    // Extract JSON object
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    } else {
      console.error('No JSON found in funnel response:', response.content.substring(0, 500));
      throw new Error('AI returned invalid funnel placement response.');
    }
    
    // Clean up trailing commas
    jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');

    const placements: FunnelPlacement = JSON.parse(jsonContent);
    
    // ENTERPRISE BEST PRACTICE: 2-3 CTAs per article with strategic placement
    // The fix is to prevent DUPLICATE placements in SAME section, not reduce total CTAs
    const limitedPlacements: FunnelPlacement = {
      calculatorCtas: placements.calculatorCtas.slice(0, 2), // Max 2 CTAs (intro + conclusion)
      packageLinks: placements.packageLinks.slice(0, 2), // Max 2 package links
      productLinks: placements.productLinks.slice(0, 1), // Max 1 product link
      leadMagnets: placements.leadMagnets.slice(0, 1), // Max 1 lead magnet
    };
    
    // CRITICAL: Prevent duplicate placements in SAME section
    const placementSections = new Map<string, string[]>();
    
    // Track which sections have which types
    limitedPlacements.calculatorCtas.forEach(cta => {
      const section = cta.placement;
      if (!placementSections.has(section)) placementSections.set(section, []);
      placementSections.get(section)!.push('calculator');
    });
    
    limitedPlacements.leadMagnets.forEach(magnet => {
      const section = magnet.placement;
      if (!placementSections.has(section)) placementSections.set(section, []);
      placementSections.get(section)!.push('leadMagnet');
    });
    
    // If same section has both calculator AND lead magnet, remove one
    placementSections.forEach((types, section) => {
      if (types.includes('calculator') && types.includes('leadMagnet')) {
        console.warn(`⚠️ Duplicate CTAs in ${section} section, removing lead magnet`);
        limitedPlacements.leadMagnets = limitedPlacements.leadMagnets.filter(
          m => m.placement !== section
        );
      }
    });
    
    // Total check: max 5 elements (enterprise standard)
    const totalElements = 
      limitedPlacements.calculatorCtas.length +
      limitedPlacements.packageLinks.length +
      limitedPlacements.productLinks.length +
      limitedPlacements.leadMagnets.length;
    
    if (totalElements > 5) {
      console.warn(`⚠️ Too many funnel elements (${totalElements}), reducing to 5`);
      // Keep priority: 2 calculators, 2 packages, 1 magnet
      limitedPlacements.calculatorCtas = limitedPlacements.calculatorCtas.slice(0, 2);
      limitedPlacements.packageLinks = limitedPlacements.packageLinks.slice(0, 2);
      limitedPlacements.leadMagnets = limitedPlacements.leadMagnets.slice(0, 1);
      limitedPlacements.productLinks = []; // Remove product links if over limit
    }
    
    return limitedPlacements;
  } catch (error) {
    console.error('Funnel placement generation error:', error);
    // Return default placements if AI fails
    return getDefaultFunnelPlacements(articleIntent, articleType);
  }
}

/**
 * Get default funnel placements if AI fails
 */
function getDefaultFunnelPlacements(
  intent: 'INFORMATIONAL' | 'COMMERCIAL' | 'TRANSACTIONAL',
  type: 'PILLAR' | 'CLUSTER'
): FunnelPlacement {
  const defaults: FunnelPlacement = {
    calculatorCtas: [],
    packageLinks: [],
    productLinks: [],
    leadMagnets: [],
  };

  // Calculator CTAs based on intent (enterprise standard: 2 CTAs)
  if (intent === 'TRANSACTIONAL') {
    defaults.calculatorCtas = [
      { placement: 'INTRO', context: 'After hook', urgency: 'HIGH' },
      { placement: 'CONCLUSION', context: 'Final CTA', urgency: 'HIGH' },
    ];
  } else if (intent === 'COMMERCIAL') {
    defaults.calculatorCtas = [
      { placement: 'INTRO', context: 'Early engagement', urgency: 'MEDIUM' },
      { placement: 'CONCLUSION', context: 'Final CTA', urgency: 'MEDIUM' },
    ];
  } else {
    defaults.calculatorCtas = [
      { placement: 'INTRO', context: 'Soft early CTA', urgency: 'LOW' },
    ];
  }

  // Package links for commercial/transactional
  if (intent !== 'INFORMATIONAL') {
    defaults.packageLinks = [
      {
        packageType: '6.6kW Residential Package',
        placement: 'MIDDLE',
        context: 'When discussing system sizes',
        reason: 'Most popular residential size',
      },
    ];
  }

  // Lead magnets (only for informational - commercial/transactional use calculator CTAs)
  if (intent === 'INFORMATIONAL') {
    defaults.leadMagnets = [
      {
        type: 'EBOOK',
        placement: 'CONCLUSION',
        headline: 'Download Our Free Solar Guide',
        description: 'Everything you need to know about solar in Perth',
      },
    ];
  }
  // Note: Commercial/Transactional use calculator CTAs instead of lead magnets

  return defaults;
}

/**
 * Insert funnel elements into article content
 */
export function insertFunnelElements(
  content: string,
  placements: FunnelPlacement
): string {
  let updatedContent = content;

  // Split content into sections (intro, middle, conclusion)
  const sections = splitContentIntoSections(content);

  // Insert calculator CTAs
  placements.calculatorCtas.forEach((cta) => {
    const ctaHtml = generateCalculatorCTA(cta.urgency);
    updatedContent = insertAtPlacement(updatedContent, ctaHtml, cta.placement, sections);
  });

  // Insert package links
  placements.packageLinks.forEach((link) => {
    const linkHtml = generatePackageLink(link.packageType, link.context);
    updatedContent = insertAtPlacement(updatedContent, linkHtml, link.placement, sections);
  });

  // Insert lead magnets
  placements.leadMagnets.forEach((magnet) => {
    const magnetHtml = generateLeadMagnet(magnet);
    updatedContent = insertAtPlacement(updatedContent, magnetHtml, magnet.placement, sections);
  });

  return updatedContent;
}

/**
 * Split content into intro, middle, conclusion sections
 */
function splitContentIntoSections(content: string): {
  intro: number;
  middle: number;
  conclusion: number;
} {
  const length = content.length;
  return {
    intro: Math.floor(length * 0.2), // First 20%
    middle: Math.floor(length * 0.5), // Middle 50%
    conclusion: Math.floor(length * 0.8), // Last 20%
  };
}

/**
 * Insert HTML at specific placement - AFTER relevant headings or paragraphs
 */
function insertAtPlacement(
  content: string,
  html: string,
  placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION',
  sections: { intro: number; middle: number; conclusion: number }
): string {
  let targetPosition: number;

  switch (placement) {
    case 'INTRO':
      targetPosition = sections.intro;
      break;
    case 'MIDDLE':
      targetPosition = sections.middle;
      break;
    case 'CONCLUSION':
      targetPosition = sections.conclusion;
      break;
  }

  // Find the best insertion point: after </h3>, </h2>, or </p>
  // Search within a range around the target position
  const searchStart = Math.max(0, targetPosition - 500);
  const searchEnd = Math.min(content.length, targetPosition + 500);
  const searchRange = content.substring(searchStart, searchEnd);
  
  // Look for heading or paragraph endings in order of preference
  const h3End = searchRange.lastIndexOf('</h3>');
  const h2End = searchRange.lastIndexOf('</h2>');
  const pEnd = searchRange.lastIndexOf('</p>');
  
  let insertPosition = targetPosition;
  
  // Prefer inserting after h3, then h2, then p
  if (h3End !== -1) {
    insertPosition = searchStart + h3End + 5; // +5 for '</h3>'
  } else if (h2End !== -1) {
    insertPosition = searchStart + h2End + 5; // +5 for '</h2>'
  } else if (pEnd !== -1) {
    insertPosition = searchStart + pEnd + 4; // +4 for '</p>'
  } else {
    // Fallback: find any paragraph end after target
    const fallbackPEnd = content.indexOf('</p>', targetPosition);
    if (fallbackPEnd !== -1) {
      insertPosition = fallbackPEnd + 4;
    }
  }

  return content.slice(0, insertPosition) + '\n\n' + html + '\n\n' + content.slice(insertPosition);
}

/**
 * Generate calculator CTA HTML
 */
function generateCalculatorCTA(urgency: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  const urgencyStyles = {
    LOW: { 
      bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
      text: 'See How Much You Could Save with Solar',
      cta: 'Get My Free Quote →'
    },
    MEDIUM: { 
      bg: 'linear-gradient(135deg, #FF6B6B 0%, #f97316 100%)', 
      text: 'Find Out Your Solar Savings in 60 Seconds',
      cta: 'Calculate My Savings →'
    },
    HIGH: { 
      bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
      text: '⚡ Discover Your Solar Potential - Free Quote',
      cta: 'Get Started Now →'
    },
  };

  const style = urgencyStyles[urgency];

  return `<div style="background: ${style.bg}; padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  <h3 style="color: white; margin-bottom: 15px; font-size: 24px; font-weight: 700;">${style.text}</h3>
  <p style="color: white; margin-bottom: 20px; font-size: 16px; opacity: 0.95;">Get a personalized quote tailored to your Perth home's energy needs</p>
  <a href="/calculator-v2" style="display: inline-block; background: white; color: #FF6B6B; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: transform 0.2s;">${style.cta}</a>
</div>`;
}

/**
 * Generate package link HTML
 */
function generatePackageLink(packageType: string, context: string): string {
  return `<div style="background: #f8f9fa; border-left: 4px solid #FF6B6B; padding: 20px; margin: 25px 0; border-radius: 4px;">
  <h4 style="color: #FF6B6B; margin-bottom: 10px; font-size: 18px;">💡 Popular Choice: ${packageType}</h4>
  <p style="margin-bottom: 15px; color: #666;">${context}</p>
  <a href="/shop/packages" style="color: #FF6B6B; font-weight: bold; text-decoration: none;">View Package Details →</a>
</div>`;
}

/**
 * Generate lead magnet HTML - FIXED: Proper closing tags to prevent content corruption
 */
function generateLeadMagnet(magnet: {
  type: string;
  headline: string;
  description: string;
}): string {
  const magnetConfig = {
    FREE_QUOTE: { icon: '💰', cta: 'Get My Free Quote →' },
    FREE_ASSESSMENT: { icon: '🏠', cta: 'Book Free Assessment →' },
    EBOOK: { icon: '📚', cta: 'Download Free Guide →' },
    CALCULATOR: { icon: '🧮', cta: 'Try Calculator Now →' },
    CHECKLIST: { icon: '✅', cta: 'Get Free Checklist →' },
  };

  const config = magnetConfig[magnet.type as keyof typeof magnetConfig] || { icon: '✨', cta: 'Learn More →' };

  // CRITICAL FIX: Self-contained div with proper closing - prevents rest of article being trapped inside
  return `
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 40px 0; color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); clear: both;">
  <div style="font-size: 48px; margin-bottom: 15px;">${config.icon}</div>
  <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 700; color: white;">${magnet.headline}</h3>
  <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.95; line-height: 1.6; color: white;">${magnet.description}</p>
  <a href="/calculator-v2" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">${config.cta}</a>
</div>
`;
}
