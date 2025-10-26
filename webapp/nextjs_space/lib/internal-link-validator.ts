/**
 * Internal Link Validator
 * 
 * Validates and fixes internal links in blog content
 */

export const VALID_INTERNAL_LINKS = {
  // High priority - link in every article
  calculator: '/calculator-v2',
  packages: '/shop/packages',
  
  // Medium priority - link when relevant
  shop: '/shop',
  solarPanels: '/shop/solar-panels',
  inverters: '/shop/inverters',
  batteries: '/shop/batteries',
  extraServices: '/extra-services',
  contact: '/contact',
  
  // Low priority - link occasionally
  blog: '/blog',
  about: '/about',
  gallery: '/gallery',
  careers: '/careers',
} as const;

export const LINK_ANCHOR_TEXT = {
  calculator: [
    'calculate your savings',
    'get a free quote',
    'solar calculator',
    'estimate your costs',
    'calculate solar savings',
  ],
  packages: [
    'view our packages',
    'solar system packages',
    'complete solar systems',
    'package deals',
    'solar packages',
  ],
  shop: [
    'browse products',
    'shop solar equipment',
    'view products',
    'solar products',
  ],
  solarPanels: [
    'solar panel options',
    'view solar panels',
    'browse solar panels',
    'panel selection',
  ],
  inverters: [
    'inverter options',
    'view inverters',
    'browse inverters',
    'inverter selection',
  ],
  batteries: [
    'battery storage options',
    'view batteries',
    'browse batteries',
    'battery systems',
  ],
  extraServices: [
    'maintenance services',
    'extended warranties',
    'additional services',
    'service options',
  ],
  contact: [
    'contact us',
    'speak to an expert',
    'get in touch',
    'reach out',
  ],
};

export interface LinkValidationResult {
  valid: boolean;
  invalidLinks: string[];
  suggestions: string[];
  missingRequired: string[];
  stats: {
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    calculatorLinks: number;
    packageLinks: number;
  };
}

/**
 * Validate internal links in content
 */
export function validateInternalLinks(content: string): LinkValidationResult {
  const linkRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const matches = [...content.matchAll(linkRegex)];
  
  const invalidLinks: string[] = [];
  const suggestions: string[] = [];
  const missingRequired: string[] = [];
  
  const validPaths = Object.values(VALID_INTERNAL_LINKS);
  
  let internalLinks = 0;
  let externalLinks = 0;
  let calculatorLinks = 0;
  let packageLinks = 0;
  
  matches.forEach(match => {
    const href = match[1];
    const anchorText = match[2];
    
    // Check if it's an internal link
    if (href.startsWith('/')) {
      internalLinks++;
      
      // Check if it's in our valid list
      const isValid = validPaths.some(path => href.startsWith(path));
      
      if (!isValid) {
        invalidLinks.push(href);
        
        // Suggest corrections
        if (href.includes('calculator') && href !== '/calculator-v2') {
          suggestions.push(`Replace "${href}" with "${VALID_INTERNAL_LINKS.calculator}"`);
        }
        if (href.includes('package') && href !== '/shop/packages') {
          suggestions.push(`Replace "${href}" with "${VALID_INTERNAL_LINKS.packages}"`);
        }
        if (href === '/products' || href === '/product') {
          suggestions.push(`Replace "${href}" with "${VALID_INTERNAL_LINKS.shop}"`);
        }
        if (href === '/services' || href === '/service') {
          suggestions.push(`Replace "${href}" with "${VALID_INTERNAL_LINKS.extraServices}"`);
        }
      }
      
      // Count specific links
      if (href.startsWith('/calculator')) calculatorLinks++;
      if (href.includes('/packages')) packageLinks++;
      
      // Check for bad anchor text
      if (anchorText.toLowerCase() === 'click here' || anchorText.toLowerCase() === 'here') {
        suggestions.push(`Improve anchor text: "${anchorText}" → use descriptive text`);
      }
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  });
  
  // Check for required links
  if (calculatorLinks === 0) {
    missingRequired.push('calculator');
    suggestions.push(`Add link to calculator (${VALID_INTERNAL_LINKS.calculator})`);
  }
  if (packageLinks === 0) {
    missingRequired.push('packages');
    suggestions.push(`Add link to packages (${VALID_INTERNAL_LINKS.packages})`);
  }
  
  // Check total internal links
  if (internalLinks < 3) {
    suggestions.push(`Add more internal links (currently ${internalLinks}, recommended 3-5)`);
  }
  if (internalLinks > 10) {
    suggestions.push(`Too many internal links (${internalLinks}), recommended 3-5 for better UX`);
  }
  
  return {
    valid: invalidLinks.length === 0 && missingRequired.length === 0,
    invalidLinks,
    suggestions,
    missingRequired,
    stats: {
      totalLinks: matches.length,
      internalLinks,
      externalLinks,
      calculatorLinks,
      packageLinks,
    },
  };
}

/**
 * Fix common internal link mistakes
 */
export function fixInternalLinks(content: string): string {
  let fixed = content;
  
  // Common mistakes to fix
  const fixes: Record<string, string> = {
    '/calculator"': '/calculator-v2"',
    '/calculator ': '/calculator-v2 ',
    '/packages"': '/shop/packages"',
    '/packages ': '/shop/packages ',
    '/products"': '/shop"',
    '/products ': '/shop ',
    '/product"': '/shop"',
    '/product ': '/shop ',
    '/services"': '/extra-services"',
    '/services ': '/extra-services ',
    '/service"': '/extra-services"',
    '/service ': '/extra-services ',
  };
  
  Object.entries(fixes).forEach(([wrong, correct]) => {
    const regex = new RegExp(wrong.replace(/"/g, '\\"|\\s'), 'g');
    fixed = fixed.replace(regex, correct);
  });
  
  return fixed;
}

/**
 * Get internal linking instructions for AI
 */
export function getInternalLinkingInstructions(): string {
  return `INTERNAL LINKING STRATEGY:

HIGH PRIORITY (link in EVERY article):
1. ${VALID_INTERNAL_LINKS.calculator} - Solar calculator & quote tool
   Anchor text: ${LINK_ANCHOR_TEXT.calculator.slice(0, 3).join(', ')}
   Placement: After discussing costs/savings, in conclusion
   
2. ${VALID_INTERNAL_LINKS.packages} - Complete solar packages
   Anchor text: ${LINK_ANCHOR_TEXT.packages.slice(0, 3).join(', ')}
   Placement: When discussing system sizes, in conclusion

MEDIUM PRIORITY (link when relevant):
3. ${VALID_INTERNAL_LINKS.shop} - Product catalog
   Anchor text: ${LINK_ANCHOR_TEXT.shop.slice(0, 2).join(', ')}
   
4. ${VALID_INTERNAL_LINKS.solarPanels} - Solar panel products
   Anchor text: ${LINK_ANCHOR_TEXT.solarPanels.slice(0, 2).join(', ')}
   
5. ${VALID_INTERNAL_LINKS.inverters} - Inverter products
   Anchor text: ${LINK_ANCHOR_TEXT.inverters.slice(0, 2).join(', ')}
   
6. ${VALID_INTERNAL_LINKS.batteries} - Battery storage products
   Anchor text: ${LINK_ANCHOR_TEXT.batteries.slice(0, 2).join(', ')}
   
7. ${VALID_INTERNAL_LINKS.extraServices} - Additional services
   Anchor text: ${LINK_ANCHOR_TEXT.extraServices.slice(0, 2).join(', ')}
   
8. ${VALID_INTERNAL_LINKS.contact} - Contact form
   Anchor text: ${LINK_ANCHOR_TEXT.contact.slice(0, 2).join(', ')}

LOW PRIORITY (link occasionally):
9. ${VALID_INTERNAL_LINKS.blog} - Blog home
10. ${VALID_INTERNAL_LINKS.about} - About us

RULES:
1. Every article MUST link to ${VALID_INTERNAL_LINKS.calculator} at least once
2. Every article SHOULD link to ${VALID_INTERNAL_LINKS.packages} at least once
3. Use natural, descriptive anchor text (NEVER "click here" or "here")
4. Link early in article (first 2-3 paragraphs)
5. Link again in conclusion with strong CTA
6. Total 3-5 internal links per article (not including navigation)
7. Use exact URLs provided above (no variations)

EXAMPLE GOOD LINKS:
<a href="${VALID_INTERNAL_LINKS.calculator}">calculate your solar savings</a>
<a href="${VALID_INTERNAL_LINKS.packages}">view our solar system packages</a>
<a href="${VALID_INTERNAL_LINKS.contact}">speak to a solar expert</a>

EXAMPLE BAD LINKS:
<a href="/calculator">click here</a> ❌ (wrong URL, bad anchor)
<a href="/packages">here</a> ❌ (wrong URL, bad anchor)
<a href="/products">products</a> ❌ (wrong URL)`;
}
