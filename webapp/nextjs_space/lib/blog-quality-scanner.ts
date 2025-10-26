/**
 * Blog Quality Scanner
 * Automatically detects formatting, CTA, table, and source issues in blog posts
 */

export interface BlogQualityIssue {
  type: 'CTA_STACKING' | 'PURPLE_CARD_CORRUPTION' | 'TABLE_FORMATTING' | 'SOURCES_MISSING' | 'SOURCES_DUPLICATES' | 'SOURCES_API_URLS' | 'BROKEN_HTML' | 'MISSING_IMAGES';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location?: string;
  autoFixable: boolean;
}

export interface BlogQualityReport {
  postId: string;
  postTitle: string;
  overallScore: number; // 0-100
  issues: BlogQualityIssue[];
  needsRegeneration: boolean; // True if issues require full regeneration
  needsEnhancement: boolean; // True if issues can be fixed with enhancement
  needsManualFix: boolean; // True if issues require manual editing
  requiredActions: ('REGENERATE' | 'ENHANCE' | 'MANUAL_FIX')[]; // List of required actions
  lastScanned: Date;
}

/**
 * Scan a single blog post for quality issues
 */
export function scanBlogPost(content: string, postTitle: string, postId: string): BlogQualityReport {
  const issues: BlogQualityIssue[] = [];
  
  // 1. Check for CTA stacking (multiple CTAs in close proximity)
  const ctaStackingIssues = detectCTAStacking(content);
  issues.push(...ctaStackingIssues);
  
  // 2. Check for purple card corruption (content trapped inside)
  const purpleCardIssues = detectPurpleCardCorruption(content);
  issues.push(...purpleCardIssues);
  
  // 3. Check for table formatting issues
  const tableIssues = detectTableIssues(content);
  issues.push(...tableIssues);
  
  // 4. Check for sources issues
  const sourcesIssues = detectSourcesIssues(content);
  issues.push(...sourcesIssues);
  
  // 5. Check for broken HTML
  const htmlIssues = detectBrokenHTML(content);
  issues.push(...htmlIssues);
  
  // 6. Check for missing images
  const imageIssues = detectMissingImages(content);
  issues.push(...imageIssues);
  
  // Calculate overall score (100 - penalties)
  const overallScore = calculateQualityScore(issues);
  
  // Determine fix strategy
  const needsRegeneration = issues.some(i => 
    i.type === 'CTA_STACKING' || 
    i.type === 'PURPLE_CARD_CORRUPTION' ||
    i.severity === 'CRITICAL'
  );
  
  const needsEnhancement = issues.some(i => 
    i.type === 'TABLE_FORMATTING' || 
    i.type === 'SOURCES_MISSING' ||
    i.type === 'MISSING_IMAGES' ||
    i.autoFixable
  );
  
  const needsManualFix = issues.some(i => 
    i.type === 'BROKEN_HTML' && i.severity === 'HIGH' ||
    !i.autoFixable && !needsRegeneration
  );
  
  // Build required actions list
  const requiredActions: ('REGENERATE' | 'ENHANCE' | 'MANUAL_FIX')[] = [];
  if (needsRegeneration) requiredActions.push('REGENERATE');
  if (needsEnhancement && !needsRegeneration) requiredActions.push('ENHANCE');
  if (needsManualFix && !needsRegeneration && !needsEnhancement) requiredActions.push('MANUAL_FIX');
  
  return {
    postId,
    postTitle,
    overallScore,
    issues,
    needsRegeneration,
    needsEnhancement,
    needsManualFix,
    requiredActions,
    lastScanned: new Date(),
  };
}

/**
 * Detect CTA stacking issues
 */
function detectCTAStacking(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Pattern 1: Multiple calculator CTAs within 500 characters
  const calculatorCTAPattern = /Get My Free Quote|Calculate My Savings|Get Started Now/gi;
  const ctaMatches = Array.from(content.matchAll(calculatorCTAPattern));
  
  for (let i = 0; i < ctaMatches.length - 1; i++) {
    const currentIndex = ctaMatches[i].index || 0;
    const nextIndex = ctaMatches[i + 1].index || 0;
    
    // If two CTAs are within 500 characters, they're likely stacked
    if (nextIndex - currentIndex < 500) {
      issues.push({
        type: 'CTA_STACKING',
        severity: 'HIGH',
        description: `Multiple CTAs found within 500 characters (${ctaMatches[i][0]} and ${ctaMatches[i + 1][0]})`,
        location: `Character ${currentIndex}`,
        autoFixable: false, // Requires regeneration
      });
    }
  }
  
  // Pattern 2: Purple card + calculator CTA in same section
  const purpleCardPattern = /background:\s*linear-gradient\(135deg,\s*#667eea/gi;
  const hasPurpleCard = purpleCardPattern.test(content);
  
  if (hasPurpleCard && ctaMatches.length > 0) {
    const purpleCardIndex = content.search(purpleCardPattern);
    const nearbyCtAs = ctaMatches.filter(m => {
      const index = m.index || 0;
      return Math.abs(index - purpleCardIndex) < 1000;
    });
    
    if (nearbyCtAs.length > 1) {
      issues.push({
        type: 'CTA_STACKING',
        severity: 'HIGH',
        description: 'Purple lead magnet card and calculator CTA found in same section',
        location: `Character ${purpleCardIndex}`,
        autoFixable: false,
      });
    }
  }
  
  return issues;
}

/**
 * Detect purple card corruption
 */
function detectPurpleCardCorruption(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Check for purple card
  const purpleCardPattern = /background:\s*linear-gradient\(135deg,\s*#667eea.*?<\/div>/gis;
  const purpleCards = content.match(purpleCardPattern);
  
  if (purpleCards) {
    purpleCards.forEach((card, index) => {
      // Check if card is missing proper closing or has content after it trapped inside
      const cardEndIndex = content.indexOf(card) + card.length;
      const contentAfter = content.substring(cardEndIndex, cardEndIndex + 500);
      
      // If content after card has white color styling, it might be trapped
      if (contentAfter.includes('color: white') || contentAfter.includes('color:white')) {
        issues.push({
          type: 'PURPLE_CARD_CORRUPTION',
          severity: 'CRITICAL',
          description: 'Purple card may be trapping content inside (white text detected after card)',
          location: `Purple card #${index + 1}`,
          autoFixable: false, // Requires regeneration
        });
      }
      
      // Check if card is missing clear: both
      if (!card.includes('clear: both') && !card.includes('clear:both')) {
        issues.push({
          type: 'PURPLE_CARD_CORRUPTION',
          severity: 'MEDIUM',
          description: 'Purple card missing "clear: both" style (may cause float issues)',
          location: `Purple card #${index + 1}`,
          autoFixable: false,
        });
      }
    });
  }
  
  return issues;
}

/**
 * Detect table formatting issues
 */
function detectTableIssues(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Check for tables
  const tablePattern = /<table[^>]*>.*?<\/table>/gis;
  const tables = content.match(tablePattern);
  
  if (tables) {
    tables.forEach((table, index) => {
      // Check for missing styles
      if (!table.includes('border-collapse') && !table.includes('border')) {
        issues.push({
          type: 'TABLE_FORMATTING',
          severity: 'MEDIUM',
          description: 'Table missing border styling',
          location: `Table #${index + 1}`,
          autoFixable: true, // Can be fixed with enhancement
        });
      }
      
      // Check for missing thead
      if (!table.includes('<thead>')) {
        issues.push({
          type: 'TABLE_FORMATTING',
          severity: 'LOW',
          description: 'Table missing <thead> element',
          location: `Table #${index + 1}`,
          autoFixable: true,
        });
      }
    });
  }
  
  return issues;
}

/**
 * Detect sources issues
 */
function detectSourcesIssues(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Check if sources section exists
  const sourcesPattern = /<h[23][^>]*>Sources:?<\/h[23]>/i;
  const hasSources = sourcesPattern.test(content);
  
  if (!hasSources) {
    issues.push({
      type: 'SOURCES_MISSING',
      severity: 'HIGH',
      description: 'No sources section found (important for E-E-A-T and YMYL compliance)',
      autoFixable: false, // Requires regeneration with grounding
    });
    return issues;
  }
  
  // Extract sources section
  const sourcesStartIndex = content.search(sourcesPattern);
  const sourcesSection = content.substring(sourcesStartIndex, sourcesStartIndex + 3000);
  
  // Check for API URLs
  const apiUrlPattern = /vertexaisearch\.cloud\.google\.com|googleapis\.com|google\.com\/search/gi;
  const apiUrls = sourcesSection.match(apiUrlPattern);
  
  if (apiUrls && apiUrls.length > 0) {
    issues.push({
      type: 'SOURCES_API_URLS',
      severity: 'HIGH',
      description: `Found ${apiUrls.length} API URLs in sources (should be removed)`,
      location: 'Sources section',
      autoFixable: true, // Can be fixed with enhancement
    });
  }
  
  // Check for duplicate URLs
  const urlPattern = /https?:\/\/[^\s<>"]+/gi;
  const urls = sourcesSection.match(urlPattern) || [];
  const uniqueUrls = new Set(urls);
  
  if (urls.length > uniqueUrls.size) {
    const duplicateCount = urls.length - uniqueUrls.size;
    issues.push({
      type: 'SOURCES_DUPLICATES',
      severity: 'MEDIUM',
      description: `Found ${duplicateCount} duplicate source URLs`,
      location: 'Sources section',
      autoFixable: true,
    });
  }
  
  return issues;
}

/**
 * Detect broken HTML
 */
function detectBrokenHTML(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Check for unclosed tags
  const tagPattern = /<([a-z][a-z0-9]*)\b[^>]*>/gi;
  const closingTagPattern = /<\/([a-z][a-z0-9]*)>/gi;
  
  const openTags = Array.from(content.matchAll(tagPattern));
  const closeTags = Array.from(content.matchAll(closingTagPattern));
  
  // Count tags (simple validation)
  const tagCounts: Record<string, number> = {};
  
  openTags.forEach(match => {
    const tag = match[1].toLowerCase();
    // Skip self-closing tags
    if (!['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  });
  
  closeTags.forEach(match => {
    const tag = match[1].toLowerCase();
    tagCounts[tag] = (tagCounts[tag] || 0) - 1;
  });
  
  // Report unclosed tags
  Object.entries(tagCounts).forEach(([tag, count]) => {
    if (count !== 0) {
      issues.push({
        type: 'BROKEN_HTML',
        severity: count > 0 ? 'HIGH' : 'MEDIUM',
        description: `Unclosed <${tag}> tag (${Math.abs(count)} ${count > 0 ? 'unclosed' : 'extra closing'})`,
        autoFixable: true,
      });
    }
  });
  
  return issues;
}

/**
 * Detect missing images
 */
function detectMissingImages(content: string): BlogQualityIssue[] {
  const issues: BlogQualityIssue[] = [];
  
  // Check for image tags
  const imgPattern = /<img[^>]*>/gi;
  const images = content.match(imgPattern) || [];
  
  // Articles should have at least 1 image (hero image)
  if (images.length === 0) {
    issues.push({
      type: 'MISSING_IMAGES',
      severity: 'MEDIUM',
      description: 'No images found in article (should have at least hero image)',
      autoFixable: true, // Can be fixed with enhancement
    });
  }
  
  // Check for missing alt text
  images.forEach((img, index) => {
    if (!img.includes('alt=')) {
      issues.push({
        type: 'MISSING_IMAGES',
        severity: 'LOW',
        description: `Image #${index + 1} missing alt text (bad for SEO)`,
        location: `Image #${index + 1}`,
        autoFixable: true,
      });
    }
  });
  
  return issues;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(issues: BlogQualityIssue[]): number {
  let score = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'CRITICAL':
        score -= 25;
        break;
      case 'HIGH':
        score -= 15;
        break;
      case 'MEDIUM':
        score -= 8;
        break;
      case 'LOW':
        score -= 3;
        break;
    }
  });
  
  return Math.max(0, score);
}

/**
 * Batch scan multiple blog posts
 */
export async function batchScanBlogPosts(posts: Array<{ id: string; title: string; content: string }>): Promise<BlogQualityReport[]> {
  return posts.map(post => scanBlogPost(post.content, post.title, post.id));
}

/**
 * Get recommended action for a blog post
 */
export function getRecommendedAction(report: BlogQualityReport): 'REGENERATE' | 'ENHANCE' | 'NONE' {
  if (report.needsRegeneration) {
    return 'REGENERATE';
  }
  
  if (report.needsEnhancement) {
    return 'ENHANCE';
  }
  
  return 'NONE';
}

/**
 * Get severity badge color
 */
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
