/**
 * Complete Article Generator - Full Automation
 * 
 * Integrates all systems for 100% automated article generation:
 * - Content generation
 * - Image generation (Gemini 2.5 Flash)
 * - Funnel integration
 * - Link building
 * - SEO optimization (95%+ score)
 * - Schema markup
 * - Technical SEO
 */

import { generateBlogOutline, generateIntroduction, generateSectionContent, generateConclusion } from './ai-blog-workflow';
import { generateImageRequirements, generateImagesWithGemini, insertImagesIntoContent, ImageRequirement } from './ai-image-generator';
import { generateFunnelPlacements, insertFunnelElements } from './ai-funnel-placement';
import { insertLinksIntoContent, LinkPlacement } from './link-building-engine';
import { polishArticle } from './article-polisher';
import { analyzeSEO, SEOAudit } from './seo-analyzer';

export interface CompleteArticleInput {
  // Basic info
  topic: string;
  keywords: string[];
  targetLength: number;
  articleType: 'PILLAR' | 'CLUSTER';
  tone?: 'professional' | 'conversational' | 'technical' | 'marketing';
  targetAudience?: string;
  
  // Strategy context
  pillarTopic?: string; // For clusters
  relatedArticles?: Array<{ id: string; slug: string; title: string }>; // For internal linking
  
  // Location context
  location?: string; // Default: Perth, Western Australia
  
  // Generation options
  includeImages?: boolean; // Default: true
  includeFunnels?: boolean; // Default: true
  includeSchema?: boolean; // Default: true
  
  // API keys
  geminiApiKey: string;
}

export interface CompleteArticleOutput {
  // Content
  title: string;
  slug: string;
  metaDescription: string;
  excerpt: string;
  content: string;
  keywords: string[];
  
  // SEO
  seoScore: number;
  seoGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  seoAudit: SEOAudit;
  
  // Media
  images: Array<{
    url: string;
    altText: string;
    caption?: string;
    filename: string;
  }>;
  
  // Links
  internalLinks: Array<{
    text: string;
    url: string;
    placement: string;
  }>;
  
  // Funnels
  funnelPlacements: {
    calculatorCtas: number;
    packageLinks: number;
    productLinks: number;
  };
  
  // Schema
  schemas: {
    article: any;
    faq?: any;
    breadcrumb?: any;
  };
  
  // Generation metadata
  generationTime: number;
  wordCount: number;
  readingTime: number;
  
  // Recommendations
  recommendations: string[];
  criticalIssues: string[];
}

/**
 * Generate complete article with all optimizations
 */
export async function generateCompleteArticle(
  input: CompleteArticleInput,
  onProgress?: (step: string, progress: number) => void
): Promise<CompleteArticleOutput> {
  const startTime = Date.now();
  const location = input.location || 'Perth, Western Australia';
  
  try {
    // STEP 1: Generate content outline (10%)
    onProgress?.('Generating article structure...', 10);
    const outline = await generateBlogOutline({
      topic: input.topic,
      keywords: input.keywords,
      targetLength: input.targetLength,
      tone: input.tone || 'marketing',
      includePackages: input.includeFunnels !== false,
      targetAudience: input.targetAudience || `${location} homeowners`,
    });

    // STEP 2: Generate introduction (20%)
    onProgress?.('Writing introduction...', 20);
    const intro = await generateIntroduction(outline.intro, {
      blogTitle: outline.title,
      hook: outline.hook,
      tone: outline.tone,
      keywords: outline.keywords,
    });

    // STEP 3: Generate all sections (30-60%)
    onProgress?.('Writing article sections...', 30);
    const sections: Array<{ heading: string; content: string }> = [];
    const sectionProgress = 30 / outline.sections.length;
    
    for (let i = 0; i < outline.sections.length; i++) {
      const section = outline.sections[i];
      onProgress?.(`Writing section ${i + 1}/${outline.sections.length}...`, 30 + (i * sectionProgress));
      
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

    // STEP 4: Generate conclusion (65%)
    onProgress?.('Writing conclusion...', 65);
    const conclusion = await generateConclusion(outline.conclusion, {
      blogTitle: outline.title,
      callToAction: outline.callToAction,
      tone: outline.tone,
    });

    // STEP 5: Compile initial content (70%)
    onProgress?.('Compiling content...', 70);
    let content = intro;
    sections.forEach(section => {
      content += '\n\n' + section.content;
    });
    content += '\n\n' + conclusion;

    // STEP 6: Generate images (75%)
    let images: any[] = [];
    let imageRequirements: ImageRequirement[] = [];
    
    if (input.includeImages !== false) {
      onProgress?.('Generating images with Gemini 2.5 Flash...', 75);
      
      imageRequirements = await generateImageRequirements(
        outline.title,
        input.articleType,
        outline.sections,
        outline.keywords,
        location
      );
      
      images = await generateImagesWithGemini(imageRequirements, input.geminiApiKey);
      
      // Insert images into content
      content = insertImagesIntoContent(content, images, imageRequirements);
    }

    // STEP 7: Add funnel elements (80%)
    let funnelPlacements: any = { calculatorCtas: [], packageLinks: [], productLinks: [], leadMagnets: [] };
    
    if (input.includeFunnels !== false) {
      onProgress?.('Adding funnel elements...', 80);
      
      funnelPlacements = await generateFunnelPlacements(
        outline.title,
        outline.keywords[0],
        input.articleType === 'PILLAR' ? 'COMMERCIAL' : 'INFORMATIONAL',
        input.articleType,
        input.targetAudience || `${location} homeowners`
      );
      
      content = insertFunnelElements(content, funnelPlacements);
    }

    // STEP 8: Build internal links (85%)
    onProgress?.('Building internal links...', 85);
    
    if (input.relatedArticles && input.relatedArticles.length > 0) {
      const linkPlacements: LinkPlacement[] = input.relatedArticles.map((article, index) => ({
        fromPostId: 'current',
        toPostId: article.id,
        toSlug: article.slug,
        anchorText: article.title,
        placement: index === 0 ? 'INTRO' : index === 1 ? 'MIDDLE' : 'CONCLUSION',
        context: `Related article`,
      }));
      
      content = insertLinksIntoContent(content, linkPlacements);
    }

    // STEP 9: Add schema markup (90%)
    onProgress?.('Adding schema markup...', 90);
    
    const schemas = generateSchemaMarkup(outline, content, location);
    
    if (input.includeSchema !== false) {
      content = addSchemaToContent(content, schemas);
    }

    // STEP 10: Polish content (92%)
    onProgress?.('Polishing HTML and formatting...', 92);
    const polished = polishArticle(content);
    content = polished.content;

    // STEP 11: SEO analysis (95%)
    onProgress?.('Analyzing SEO score...', 95);
    const seoAudit = await analyzeSEO(content, {
      title: outline.title,
      metaDescription: outline.metaDescription,
      slug: outline.slug,
      keywords: outline.keywords,
    });

    // STEP 12: Auto-fix SEO issues if score < 95% (97%)
    if (seoAudit.score < 95) {
      onProgress?.('Fixing SEO issues...', 97);
      content = await autoFixSEOIssues(content, seoAudit);
      
      // Re-analyze
      const updatedAudit = await analyzeSEO(content, {
        title: outline.title,
        metaDescription: outline.metaDescription,
        slug: outline.slug,
        keywords: outline.keywords,
      });
      
      seoAudit.score = updatedAudit.score;
      seoAudit.grade = updatedAudit.grade;
    }

    // STEP 13: Calculate metadata (100%)
    onProgress?.('Finalizing...', 100);
    const wordCount = content.replace(/<[^>]+>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    const generationTime = Date.now() - startTime;

    return {
      // Content
      title: outline.title,
      slug: outline.slug,
      metaDescription: outline.metaDescription,
      excerpt: outline.excerpt,
      content,
      keywords: outline.keywords,
      
      // SEO
      seoScore: seoAudit.score,
      seoGrade: seoAudit.grade,
      seoAudit,
      
      // Media
      images: images.map(img => ({
        url: img.url,
        altText: img.altText,
        caption: img.caption,
        filename: img.filename,
      })),
      
      // Links
      internalLinks: outline.internalLinks,
      
      // Funnels
      funnelPlacements: {
        calculatorCtas: funnelPlacements.calculatorCtas?.length || 0,
        packageLinks: funnelPlacements.packageLinks?.length || 0,
        productLinks: funnelPlacements.productLinks?.length || 0,
      },
      
      // Schema
      schemas,
      
      // Metadata
      generationTime,
      wordCount,
      readingTime,
      
      // Recommendations
      recommendations: seoAudit.recommendations.map(r => r.solution),
      criticalIssues: seoAudit.criticalIssues.map(i => i.description),
    };
  } catch (error) {
    console.error('Complete article generation error:', error);
    throw error;
  }
}

/**
 * Generate schema markup
 */
function generateSchemaMarkup(
  outline: any,
  content: string,
  location: string
): {
  article: any;
  faq?: any;
  breadcrumb?: any;
} {
  const schemas: any = {};

  // Article schema
  schemas.article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: outline.title,
    description: outline.metaDescription,
    image: [], // Will be populated with actual image URLs
    author: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
      url: 'https://sundirectpower.com.au',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sundirectpower.com.au/logo.png',
      },
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sundirectpower.com.au/blog/${outline.slug}`,
    },
  };

  // FAQ schema (if FAQs found)
  const faqs = extractFAQs(content);
  if (faqs.length > 0) {
    schemas.faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  // Breadcrumb schema
  schemas.breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://sundirectpower.com.au',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://sundirectpower.com.au/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: outline.title,
        item: `https://sundirectpower.com.au/blog/${outline.slug}`,
      },
    ],
  };

  return schemas;
}

/**
 * Add schema markup to content
 */
function addSchemaToContent(content: string, schemas: any): string {
  let schemaScripts = '';

  // Add Article schema
  schemaScripts += `\n<script type="application/ld+json">\n${JSON.stringify(schemas.article, null, 2)}\n</script>\n`;

  // Add FAQ schema if exists
  if (schemas.faq) {
    schemaScripts += `\n<script type="application/ld+json">\n${JSON.stringify(schemas.faq, null, 2)}\n</script>\n`;
  }

  // Add Breadcrumb schema
  schemaScripts += `\n<script type="application/ld+json">\n${JSON.stringify(schemas.breadcrumb, null, 2)}\n</script>\n`;

  return content + schemaScripts;
}

/**
 * Extract FAQs from content
 */
function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Look for FAQ section
  const faqMatch = content.match(/##?\s*(?:FAQ|Frequently Asked Questions|Common Questions)([\s\S]*?)(?=##|$)/i);
  if (!faqMatch) return faqs;

  const faqSection = faqMatch[1];
  
  // Extract Q&A pairs
  const qaMatches = faqSection.matchAll(/###?\s*(.+?\?)\s*\n+([\s\S]+?)(?=###|$)/g);
  
  for (const match of qaMatches) {
    const question = match[1].trim();
    const answer = match[2].trim().replace(/<[^>]+>/g, '').substring(0, 500);
    
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  
  return faqs;
}

/**
 * Auto-fix common SEO issues
 */
async function autoFixSEOIssues(content: string, audit: SEOAudit): Promise<string> {
  let fixed = content;

  // Fix 1: Add missing alt text to images
  if (audit.categories.onPage.checks.find(c => c.name === 'Image Alt Text' && !c.passed)) {
    fixed = fixed.replace(/<img([^>]+)(?!alt=)/gi, (match) => {
      const srcMatch = match.match(/src="([^"]+)"/);
      if (srcMatch) {
        const filename = srcMatch[1].split('/').pop()?.replace(/\.[^.]+$/, '') || 'image';
        const altText = filename.replace(/-/g, ' ');
        return match.replace(/<img/, `<img alt="${altText}"`);
      }
      return match;
    });
  }

  // Fix 2: Add FAQ schema if missing
  if (audit.categories.engagement.checks.find(c => c.name === 'FAQ Schema' && !c.passed)) {
    const faqs = extractFAQs(fixed);
    if (faqs.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      };
      
      fixed += `\n<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>\n`;
    }
  }

  // Fix 3: Add table of contents if missing
  if (audit.categories.engagement.checks.find(c => c.name === 'Table of Contents' && !c.passed)) {
    const toc = generateTableOfContents(fixed);
    if (toc) {
      // Insert TOC after first paragraph
      const firstPEnd = fixed.indexOf('</p>');
      if (firstPEnd !== -1) {
        fixed = fixed.slice(0, firstPEnd + 4) + '\n\n' + toc + '\n\n' + fixed.slice(firstPEnd + 4);
      }
    }
  }

  return fixed;
}

/**
 * Generate table of contents
 */
function generateTableOfContents(content: string): string | null {
  const headings = content.match(/<h2[^>]*>(.*?)<\/h2>/gi);
  if (!headings || headings.length < 3) return null;

  const tocItems = headings.map((heading, index) => {
    const text = heading.replace(/<[^>]+>/g, '');
    const id = `section-${index + 1}`;
    return `  <li><a href="#${id}">${text}</a></li>`;
  });

  return `<div class="table-of-contents" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin-top: 0;">Table of Contents</h3>
  <ol style="margin: 0; padding-left: 20px;">
${tocItems.join('\n')}
  </ol>
</div>`;
}

/**
 * Batch generate multiple articles
 */
export async function batchGenerateArticles(
  articles: CompleteArticleInput[],
  onProgress?: (articleIndex: number, step: string, progress: number) => void
): Promise<CompleteArticleOutput[]> {
  const results: CompleteArticleOutput[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    
    const result = await generateCompleteArticle(article, (step, progress) => {
      onProgress?.(i, step, progress);
    });
    
    results.push(result);
  }

  return results;
}
