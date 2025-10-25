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

Analyze this article and determine:
1. How many calculator CTAs to include (1-3)
2. Which packages to feature (if any)
3. Which products to link to (if any)
4. Which lead magnets to use (1-2)
5. Optimal placement for each element

Consider:
- Informational articles: Focus on education, soft CTAs, lead magnets
- Commercial articles: Balance education with product/package links
- Transactional articles: Strong CTAs, specific packages, urgency

Return ONLY the JSON response.`,
    },
  ];

  try {
    const response = await generateAIResponse(messages, { maxTokens: 2000 });
    
    // Parse JSON
    let jsonContent = response.content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    const placements: FunnelPlacement = JSON.parse(jsonContent);
    return placements;
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

  // Calculator CTAs based on intent
  if (intent === 'TRANSACTIONAL') {
    defaults.calculatorCtas = [
      { placement: 'INTRO', context: 'After hook', urgency: 'HIGH' },
      { placement: 'MIDDLE', context: 'After benefits', urgency: 'HIGH' },
      { placement: 'CONCLUSION', context: 'Final CTA', urgency: 'HIGH' },
    ];
  } else if (intent === 'COMMERCIAL') {
    defaults.calculatorCtas = [
      { placement: 'MIDDLE', context: 'After explanation', urgency: 'MEDIUM' },
      { placement: 'CONCLUSION', context: 'Final CTA', urgency: 'MEDIUM' },
    ];
  } else {
    defaults.calculatorCtas = [
      { placement: 'CONCLUSION', context: 'Soft CTA', urgency: 'LOW' },
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

  // Lead magnets
  if (intent === 'INFORMATIONAL') {
    defaults.leadMagnets = [
      {
        type: 'EBOOK',
        placement: 'CONCLUSION',
        headline: 'Download Our Free Solar Guide',
        description: 'Everything you need to know about solar in Perth',
      },
    ];
  } else {
    defaults.leadMagnets = [
      {
        type: 'FREE_QUOTE',
        placement: 'CONCLUSION',
        headline: 'Get Your Free Solar Quote',
        description: 'See how much you can save in under 2 minutes',
      },
    ];
  }

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
 * Insert HTML at specific placement
 */
function insertAtPlacement(
  content: string,
  html: string,
  placement: 'INTRO' | 'MIDDLE' | 'CONCLUSION',
  sections: { intro: number; middle: number; conclusion: number }
): string {
  let insertPosition: number;

  switch (placement) {
    case 'INTRO':
      insertPosition = sections.intro;
      break;
    case 'MIDDLE':
      insertPosition = sections.middle;
      break;
    case 'CONCLUSION':
      insertPosition = sections.conclusion;
      break;
  }

  // Find nearest paragraph end
  const nearestParagraphEnd = content.indexOf('</p>', insertPosition);
  if (nearestParagraphEnd !== -1) {
    insertPosition = nearestParagraphEnd + 4;
  }

  return content.slice(0, insertPosition) + '\n\n' + html + '\n\n' + content.slice(insertPosition);
}

/**
 * Generate calculator CTA HTML
 */
function generateCalculatorCTA(urgency: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  const urgencyStyles = {
    LOW: { bg: 'from-blue-500 to-blue-600', text: 'Calculate Your Potential Savings' },
    MEDIUM: { bg: 'from-coral to-orange-500', text: 'Get Your Free Solar Quote Now' },
    HIGH: { bg: 'from-red-500 to-red-600', text: '⚡ Calculate Your Savings in 2 Minutes!' },
  };

  const style = urgencyStyles[urgency];

  return `<div style="background: linear-gradient(135deg, ${style.bg.split(' ')[0].replace('from-', '#')} 0%, ${style.bg.split(' ')[1].replace('to-', '#')} 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
  <h3 style="color: white; margin-bottom: 15px; font-size: 24px;">${style.text}</h3>
  <p style="color: white; margin-bottom: 20px; font-size: 16px;">See exactly how much you can save with solar</p>
  <a href="/calculator-v2" style="display: inline-block; background: white; color: #FF6B6B; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Start Calculator →</a>
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
 * Generate lead magnet HTML
 */
function generateLeadMagnet(magnet: {
  type: string;
  headline: string;
  description: string;
}): string {
  const icons = {
    FREE_QUOTE: '💰',
    FREE_ASSESSMENT: '🏠',
    EBOOK: '📚',
    CALCULATOR: '🧮',
    CHECKLIST: '✅',
  };

  const icon = icons[magnet.type as keyof typeof icons] || '✨';

  return `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; color: white;">
  <div style="font-size: 48px; margin-bottom: 15px;">${icon}</div>
  <h3 style="margin-bottom: 15px; font-size: 24px;">${magnet.headline}</h3>
  <p style="margin-bottom: 20px; font-size: 16px; opacity: 0.9;">${magnet.description}</p>
  <a href="/calculator-v2" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Get Started Free →</a>
</div>`;
}
