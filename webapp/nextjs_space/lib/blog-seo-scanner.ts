/**
 * Blog SEO Scanner
 * Comprehensive SEO analysis against strategy target keywords, CTAs, links, schema, images, etc.
 */

export interface SEOIssue {
  type: 'KEYWORD' | 'CTA' | 'INTERNAL_LINKS' | 'SCHEMA' | 'IMAGES' | 'META' | 'HEADINGS' | 'READABILITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location?: string;
  recommendation: string;
}

export interface SEOReport {
  postId: string;
  postTitle: string;
  seoScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  issues: SEOIssue[];
  strengths: string[];
  targetKeyword?: string;
  keywordDensity: number;
  lastScanned: Date;
}

/**
 * Scan blog post for SEO issues
 */
export function scanBlogSEO(
  content: string,
  postTitle: string,
  postId: string,
  metadata: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    targetKeyword?: string;
    slug?: string;
  }
): SEOReport {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  const targetKeyword = metadata.targetKeyword || metadata.keywords?.[0] || '';
  
  // 1. Keyword Optimization
  const keywordIssues = analyzeKeywords(content, postTitle, targetKeyword, metadata);
  issues.push(...keywordIssues.issues);
  strengths.push(...keywordIssues.strengths);
  
  // 2. CTA Analysis
  const ctaIssues = analyzeCTAs(content);
  issues.push(...ctaIssues.issues);
  strengths.push(...ctaIssues.strengths);
  
  // 3. Internal Links
  const linkIssues = analyzeInternalLinks(content);
  issues.push(...linkIssues.issues);
  strengths.push(...linkIssues.strengths);
  
  // 4. Schema Markup
  const schemaIssues = analyzeSchema(content);
  issues.push(...schemaIssues.issues);
  strengths.push(...schemaIssues.strengths);
  
  // 5. Images & Alt Text
  const imageIssues = analyzeImages(content, targetKeyword);
  issues.push(...imageIssues.issues);
  strengths.push(...imageIssues.strengths);
  
  // 6. Meta Tags
  const metaIssues = analyzeMeta(metadata, targetKeyword);
  issues.push(...metaIssues.issues);
  strengths.push(...metaIssues.strengths);
  
  // 7. Heading Structure
  const headingIssues = analyzeHeadings(content, targetKeyword);
  issues.push(...headingIssues.issues);
  strengths.push(...headingIssues.strengths);
  
  // 8. Readability
  const readabilityIssues = analyzeReadability(content);
  issues.push(...readabilityIssues.issues);
  strengths.push(...readabilityIssues.strengths);
  
  // Calculate SEO score
  const seoScore = calculateSEOScore(issues, strengths);
  const grade = getSEOGrade(seoScore);
  
  // Calculate keyword density
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const keywordMatches = (content.match(new RegExp(targetKeyword, 'gi')) || []).length;
  const keywordDensity = words > 0 ? (keywordMatches / words) * 100 : 0;
  
  return {
    postId,
    postTitle,
    seoScore,
    grade,
    issues,
    strengths,
    targetKeyword,
    keywordDensity,
    lastScanned: new Date(),
  };
}

/**
 * Analyze keyword optimization
 */
function analyzeKeywords(
  content: string,
  title: string,
  targetKeyword: string,
  metadata: any
): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  if (!targetKeyword) {
    issues.push({
      type: 'KEYWORD',
      severity: 'HIGH',
      description: 'No target keyword defined',
      recommendation: 'Set a target keyword for this article',
    });
    return { issues, strengths };
  }
  
  const keywordLower = targetKeyword.toLowerCase();
  const contentLower = content.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Check title
  if (!titleLower.includes(keywordLower)) {
    issues.push({
      type: 'KEYWORD',
      severity: 'HIGH',
      description: `Target keyword "${targetKeyword}" not in title`,
      recommendation: 'Include target keyword in title for better SEO',
    });
  } else {
    strengths.push('Target keyword in title');
  }
  
  // Check first paragraph
  const firstParagraph = content.substring(0, 500).toLowerCase();
  if (!firstParagraph.includes(keywordLower)) {
    issues.push({
      type: 'KEYWORD',
      severity: 'MEDIUM',
      description: 'Target keyword not in first paragraph',
      recommendation: 'Include keyword early in content',
    });
  } else {
    strengths.push('Keyword in first paragraph');
  }
  
  // Check keyword density
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
  const keywordCount = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
  const density = (keywordCount / words) * 100;
  
  if (density < 0.5) {
    issues.push({
      type: 'KEYWORD',
      severity: 'MEDIUM',
      description: `Keyword density too low (${density.toFixed(2)}%)`,
      recommendation: 'Aim for 0.5-2% keyword density',
    });
  } else if (density > 3) {
    issues.push({
      type: 'KEYWORD',
      severity: 'MEDIUM',
      description: `Keyword density too high (${density.toFixed(2)}%) - may be keyword stuffing`,
      recommendation: 'Reduce keyword usage to 0.5-2%',
    });
  } else {
    strengths.push(`Good keyword density (${density.toFixed(2)}%)`);
  }
  
  // Check meta description
  if (metadata.metaDescription && !metadata.metaDescription.toLowerCase().includes(keywordLower)) {
    issues.push({
      type: 'KEYWORD',
      severity: 'MEDIUM',
      description: 'Target keyword not in meta description',
      recommendation: 'Include keyword in meta description',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze CTAs
 */
function analyzeCTAs(content: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  // Count CTAs
  const ctaPatterns = [
    /Get My Free Quote/gi,
    /Calculate My Savings/gi,
    /Get Started Now/gi,
    /Book.*Assessment/gi,
    /Contact.*Today/gi,
  ];
  
  let totalCTAs = 0;
  ctaPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) totalCTAs += matches.length;
  });
  
  if (totalCTAs === 0) {
    issues.push({
      type: 'CTA',
      severity: 'HIGH',
      description: 'No CTAs found in article',
      recommendation: 'Add 2-3 strategically placed CTAs',
    });
  } else if (totalCTAs === 1) {
    issues.push({
      type: 'CTA',
      severity: 'MEDIUM',
      description: 'Only 1 CTA found',
      recommendation: 'Add 1-2 more CTAs (intro, middle, conclusion)',
    });
  } else if (totalCTAs >= 2 && totalCTAs <= 4) {
    strengths.push(`Good CTA placement (${totalCTAs} CTAs)`);
  } else {
    issues.push({
      type: 'CTA',
      severity: 'LOW',
      description: `Too many CTAs (${totalCTAs})`,
      recommendation: 'Reduce to 2-3 CTAs for better conversion',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze internal links
 */
function analyzeInternalLinks(content: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  // Count internal links (relative URLs)
  const internalLinkPattern = /<a[^>]*href=["'](\/[^"']*|#[^"']*)["'][^>]*>/gi;
  const internalLinks = content.match(internalLinkPattern) || [];
  
  if (internalLinks.length === 0) {
    issues.push({
      type: 'INTERNAL_LINKS',
      severity: 'HIGH',
      description: 'No internal links found',
      recommendation: 'Add 3-5 internal links to related content',
    });
  } else if (internalLinks.length < 3) {
    issues.push({
      type: 'INTERNAL_LINKS',
      severity: 'MEDIUM',
      description: `Only ${internalLinks.length} internal links`,
      recommendation: 'Add more internal links (aim for 3-5)',
    });
  } else if (internalLinks.length >= 3 && internalLinks.length <= 8) {
    strengths.push(`Good internal linking (${internalLinks.length} links)`);
  } else {
    issues.push({
      type: 'INTERNAL_LINKS',
      severity: 'LOW',
      description: `Too many internal links (${internalLinks.length})`,
      recommendation: 'Reduce to 3-8 most relevant links',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze schema markup
 */
function analyzeSchema(content: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  const hasArticleSchema = content.includes('"@type": "Article"') || content.includes('"@type":"Article"');
  const hasFAQSchema = content.includes('"@type": "FAQPage"') || content.includes('"@type":"FAQPage"');
  const hasBreadcrumbSchema = content.includes('"@type": "BreadcrumbList"') || content.includes('"@type":"BreadcrumbList"');
  
  if (!hasArticleSchema) {
    issues.push({
      type: 'SCHEMA',
      severity: 'HIGH',
      description: 'Missing Article schema markup',
      recommendation: 'Add Article schema for rich snippets',
    });
  } else {
    strengths.push('Article schema present');
  }
  
  if (!hasBreadcrumbSchema) {
    issues.push({
      type: 'SCHEMA',
      severity: 'MEDIUM',
      description: 'Missing Breadcrumb schema',
      recommendation: 'Add Breadcrumb schema for better navigation',
    });
  } else {
    strengths.push('Breadcrumb schema present');
  }
  
  // FAQ schema is optional but good to have
  if (hasFAQSchema) {
    strengths.push('FAQ schema present');
  }
  
  return { issues, strengths };
}

/**
 * Analyze images
 */
function analyzeImages(content: string, targetKeyword: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  const imgPattern = /<img[^>]*>/gi;
  const images = content.match(imgPattern) || [];
  
  if (images.length === 0) {
    issues.push({
      type: 'IMAGES',
      severity: 'HIGH',
      description: 'No images found',
      recommendation: 'Add at least 1 hero image',
    });
    return { issues, strengths };
  }
  
  strengths.push(`${images.length} images present`);
  
  // Check alt text
  let missingAlt = 0;
  let keywordInAlt = 0;
  
  images.forEach((img, index) => {
    if (!img.includes('alt=')) {
      missingAlt++;
    } else {
      const altMatch = img.match(/alt=["']([^"']*)["']/i);
      if (altMatch && altMatch[1].toLowerCase().includes(targetKeyword.toLowerCase())) {
        keywordInAlt++;
      }
    }
  });
  
  if (missingAlt > 0) {
    issues.push({
      type: 'IMAGES',
      severity: 'MEDIUM',
      description: `${missingAlt} images missing alt text`,
      recommendation: 'Add descriptive alt text to all images',
    });
  } else {
    strengths.push('All images have alt text');
  }
  
  if (keywordInAlt === 0 && targetKeyword) {
    issues.push({
      type: 'IMAGES',
      severity: 'LOW',
      description: 'Target keyword not in any image alt text',
      recommendation: 'Include keyword in at least 1 image alt text',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze meta tags
 */
function analyzeMeta(metadata: any, targetKeyword: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  // Meta title
  if (!metadata.metaTitle) {
    issues.push({
      type: 'META',
      severity: 'CRITICAL',
      description: 'Missing meta title',
      recommendation: 'Add meta title (50-60 characters)',
    });
  } else {
    const titleLength = metadata.metaTitle.length;
    if (titleLength < 50) {
      issues.push({
        type: 'META',
        severity: 'MEDIUM',
        description: `Meta title too short (${titleLength} chars)`,
        recommendation: 'Aim for 50-60 characters',
      });
    } else if (titleLength > 60) {
      issues.push({
        type: 'META',
        severity: 'MEDIUM',
        description: `Meta title too long (${titleLength} chars)`,
        recommendation: 'Keep under 60 characters',
      });
    } else {
      strengths.push('Meta title length optimal');
    }
  }
  
  // Meta description
  if (!metadata.metaDescription) {
    issues.push({
      type: 'META',
      severity: 'CRITICAL',
      description: 'Missing meta description',
      recommendation: 'Add meta description (150-160 characters)',
    });
  } else {
    const descLength = metadata.metaDescription.length;
    if (descLength < 120) {
      issues.push({
        type: 'META',
        severity: 'MEDIUM',
        description: `Meta description too short (${descLength} chars)`,
        recommendation: 'Aim for 150-160 characters',
      });
    } else if (descLength > 160) {
      issues.push({
        type: 'META',
        severity: 'MEDIUM',
        description: `Meta description too long (${descLength} chars)`,
        recommendation: 'Keep under 160 characters',
      });
    } else {
      strengths.push('Meta description length optimal');
    }
  }
  
  // Slug
  if (metadata.slug && metadata.slug.length > 75) {
    issues.push({
      type: 'META',
      severity: 'LOW',
      description: 'URL slug too long',
      recommendation: 'Keep URL under 75 characters',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze heading structure
 */
function analyzeHeadings(content: string, targetKeyword: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gi;
  const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  
  const h1s = content.match(h1Pattern) || [];
  const h2s = content.match(h2Pattern) || [];
  const h3s = content.match(h3Pattern) || [];
  
  // Check H1
  if (h1s.length === 0) {
    issues.push({
      type: 'HEADINGS',
      severity: 'MEDIUM',
      description: 'No H1 heading found',
      recommendation: 'Add H1 heading (usually the title)',
    });
  } else if (h1s.length > 1) {
    issues.push({
      type: 'HEADINGS',
      severity: 'MEDIUM',
      description: `Multiple H1 headings (${h1s.length})`,
      recommendation: 'Use only one H1 per page',
    });
  } else {
    strengths.push('Single H1 heading');
  }
  
  // Check H2s
  if (h2s.length === 0) {
    issues.push({
      type: 'HEADINGS',
      severity: 'MEDIUM',
      description: 'No H2 headings found',
      recommendation: 'Add H2 headings to structure content',
    });
  } else if (h2s.length < 3) {
    issues.push({
      type: 'HEADINGS',
      severity: 'LOW',
      description: `Only ${h2s.length} H2 headings`,
      recommendation: 'Add more H2 headings (aim for 3-6)',
    });
  } else {
    strengths.push(`Good heading structure (${h2s.length} H2s)`);
  }
  
  // Check keyword in headings
  const allHeadings = [...h2s, ...h3s].join(' ').toLowerCase();
  if (targetKeyword && !allHeadings.includes(targetKeyword.toLowerCase())) {
    issues.push({
      type: 'HEADINGS',
      severity: 'MEDIUM',
      description: 'Target keyword not in any H2/H3 headings',
      recommendation: 'Include keyword in at least one heading',
    });
  }
  
  return { issues, strengths };
}

/**
 * Analyze readability
 */
function analyzeReadability(content: string): { issues: SEOIssue[]; strengths: string[] } {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  
  const text = content.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const wordCount = words.length;
  const sentenceCount = sentences.length;
  
  // Word count
  if (wordCount < 300) {
    issues.push({
      type: 'READABILITY',
      severity: 'HIGH',
      description: `Content too short (${wordCount} words)`,
      recommendation: 'Aim for at least 1000 words for SEO',
    });
  } else if (wordCount < 1000) {
    issues.push({
      type: 'READABILITY',
      severity: 'MEDIUM',
      description: `Content could be longer (${wordCount} words)`,
      recommendation: 'Aim for 1000-2000 words for better ranking',
    });
  } else {
    strengths.push(`Good word count (${wordCount} words)`);
  }
  
  // Average sentence length
  if (sentenceCount > 0) {
    const avgSentenceLength = wordCount / sentenceCount;
    if (avgSentenceLength > 25) {
      issues.push({
        type: 'READABILITY',
        severity: 'LOW',
        description: 'Sentences too long (harder to read)',
        recommendation: 'Break long sentences into shorter ones',
      });
    } else if (avgSentenceLength < 10) {
      issues.push({
        type: 'READABILITY',
        severity: 'LOW',
        description: 'Sentences too short (choppy reading)',
        recommendation: 'Combine some short sentences',
      });
    } else {
      strengths.push('Good sentence length');
    }
  }
  
  // Paragraph count (rough estimate)
  const paragraphs = content.match(/<p[^>]*>/gi) || [];
  if (paragraphs.length > 0 && wordCount / paragraphs.length > 150) {
    issues.push({
      type: 'READABILITY',
      severity: 'LOW',
      description: 'Paragraphs too long',
      recommendation: 'Break long paragraphs (aim for 3-5 sentences)',
    });
  }
  
  return { issues, strengths };
}

/**
 * Calculate SEO score
 */
function calculateSEOScore(issues: SEOIssue[], strengths: string[]): number {
  let score = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'CRITICAL':
        score -= 20;
        break;
      case 'HIGH':
        score -= 12;
        break;
      case 'MEDIUM':
        score -= 6;
        break;
      case 'LOW':
        score -= 3;
        break;
    }
  });
  
  // Bonus for strengths (max +10)
  score += Math.min(strengths.length * 2, 10);
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get SEO grade
 */
function getSEOGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Batch scan multiple posts
 */
export async function batchScanBlogSEO(
  posts: Array<{
    id: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    slug?: string;
    targetKeyword?: string;
  }>
): Promise<SEOReport[]> {
  return posts.map(post =>
    scanBlogSEO(post.content, post.title, post.id, {
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      keywords: post.keywords,
      targetKeyword: post.targetKeyword,
      slug: post.slug,
    })
  );
}
