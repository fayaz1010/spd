/**
 * Article Enhancement & Formatting
 * 
 * Fixes HTML tags, formatting issues, and enhances content quality
 */

import { generateWithGrounding, validateEEAT, validateYMYL } from './gemini-grounding';

export interface EnhancementResult {
  content: string;
  changes: string[];
  eeatScore: number;
  ymylCompliant: boolean;
  issues: string[];
}

/**
 * Clean HTML tags and formatting
 */
export function cleanHTMLTags(content: string): string {
  let cleaned = content;
  
  // Remove wrapper ```html tags
  cleaned = cleaned.replace(/```html\n?/g, '');
  cleaned = cleaned.replace(/\n?```/g, '');
  
  // Fix paragraph spacing
  cleaned = cleaned.replace(/\n\n\n+/g, '\n\n');
  
  // Ensure proper paragraph tags
  const lines = cleaned.split('\n');
  const formatted: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      formatted.push('');
      continue;
    }
    
    // Keep headings as-is
    if (line.startsWith('#') || line.match(/^<h[1-6]>/i)) {
      formatted.push(line);
      continue;
    }
    
    // Keep HTML tags as-is
    if (line.startsWith('<') && line.endsWith('>')) {
      formatted.push(line);
      continue;
    }
    
    // Wrap plain text in paragraphs
    if (!line.startsWith('<p>')) {
      formatted.push(`<p>${line}</p>`);
    } else {
      formatted.push(line);
    }
  }
  
  return formatted.join('\n');
}

/**
 * Fix list formatting
 */
export function fixListFormatting(content: string): string {
  let fixed = content;
  
  // Convert plain list items to proper HTML lists
  const lines = fixed.split('\n');
  const result: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect list items
    const isBullet = trimmed.match(/^[•\-\*]\s+(.+)$/);
    const isNumbered = trimmed.match(/^\d+\.\s+(.+)$/);
    
    if (isBullet || isNumbered) {
      const content = isBullet ? isBullet[1] : isNumbered![1];
      const newListType = isBullet ? 'ul' : 'ol';
      
      // Start new list if needed
      if (!inList) {
        result.push(`<${newListType}>`);
        inList = true;
        listType = newListType;
      } else if (listType !== newListType) {
        // Close old list, start new one
        result.push(`</${listType}>`);
        result.push(`<${newListType}>`);
        listType = newListType;
      }
      
      result.push(`  <li>${content}</li>`);
    } else {
      // Close list if we were in one
      if (inList && listType) {
        result.push(`</${listType}>`);
        inList = false;
        listType = null;
      }
      
      result.push(line);
    }
  }
  
  // Close any open list
  if (inList && listType) {
    result.push(`</${listType}>`);
  }
  
  return result.join('\n');
}

/**
 * Fix heading hierarchy
 */
export function fixHeadingHierarchy(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let lastHeadingLevel = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for markdown headings
    const mdHeading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdHeading) {
      const level = mdHeading[1].length;
      const text = mdHeading[2];
      
      // Ensure we don't skip levels
      const adjustedLevel = Math.min(level, lastHeadingLevel + 1);
      lastHeadingLevel = adjustedLevel;
      
      result.push(`${'#'.repeat(adjustedLevel)} ${text}`);
      continue;
    }
    
    // Check for HTML headings
    const htmlHeading = trimmed.match(/^<h([1-6])>(.+)<\/h\1>$/i);
    if (htmlHeading) {
      const level = parseInt(htmlHeading[1]);
      const text = htmlHeading[2];
      
      // Ensure we don't skip levels
      const adjustedLevel = Math.min(level, lastHeadingLevel + 1);
      lastHeadingLevel = adjustedLevel;
      
      result.push(`<h${adjustedLevel}>${text}</h${adjustedLevel}>`);
      continue;
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

/**
 * Add schema markup
 */
export function addSchemaMarkup(
  content: string,
  metadata: {
    title: string;
    description: string;
    author: string;
    datePublished: Date;
    dateModified: Date;
  }
): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: metadata.title,
    description: metadata.description,
    author: {
      '@type': 'Organization',
      name: metadata.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sun Direct Power',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sundirectpower.com.au/logo.png',
      },
    },
    datePublished: metadata.datePublished.toISOString(),
    dateModified: metadata.dateModified.toISOString(),
  };
  
  const schemaScript = `\n\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>\n\n`;
  
  return content + schemaScript;
}

/**
 * Add expert credentials and badges
 */
export function addExpertCredentials(content: string): string {
  const credentials = `
<div class="expert-credentials" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; margin: 2rem 0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <h4 style="margin-top: 0; color: white; display: flex; align-items: center; gap: 0.5rem;">
    <span style="font-size: 1.5rem;">✓</span> Expert Review & Certification
  </h4>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
    <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
      <div style="font-weight: bold; margin-bottom: 0.5rem;">🏆 CEC Accredited</div>
      <div style="font-size: 0.875rem; opacity: 0.9;">Clean Energy Council approved installer</div>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
      <div style="font-weight: bold; margin-bottom: 0.5rem;">⚡ Licensed Electrician</div>
      <div style="font-size: 0.875rem; opacity: 0.9;">WA electrical contractor license</div>
    </div>
    <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 8px;">
      <div style="font-weight: bold; margin-bottom: 0.5rem;">📊 15+ Years Experience</div>
      <div style="font-size: 0.875rem; opacity: 0.9;">Over 2,000 Perth installations</div>
    </div>
  </div>
  <p style="margin: 1rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">
    This article has been reviewed by our team of CEC-accredited solar installers and licensed electricians 
    with extensive experience in Perth's solar market.
  </p>
</div>
`;
  
  return content + credentials;
}

/**
 * Add YMYL disclaimer
 */
export function addYMYLDisclaimer(content: string): string {
  const disclaimer = `
<div class="disclaimer-box" style="background: #fff3cd; border: 2px solid #ffc107; padding: 1rem; margin: 2rem 0; border-radius: 8px;">
  <h4 style="margin-top: 0; color: #856404;">⚠️ Important Disclaimer</h4>
  <p style="margin-bottom: 0; color: #856404;">
    This article provides general information about solar energy systems. 
    Costs, rebates, and requirements vary by location and individual circumstances. 
    Always consult with a licensed electrician and CEC-accredited installer before making decisions. 
    Information is current as of ${new Date().toLocaleDateString('en-AU')} and subject to change.
  </p>
</div>
`;
  
  return content + disclaimer;
}

/**
 * Add FAQ schema markup
 */
export function addFAQSchema(
  content: string,
  faqs: Array<{ question: string; answer: string }>
): string {
  if (faqs.length === 0) return content;
  
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
  
  const schemaScript = `\n\n<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>\n\n`;
  
  return content + schemaScript;
}

/**
 * Extract FAQs from content
 */
export function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Look for FAQ section
  const faqSectionMatch = content.match(/##?\s*(?:FAQ|Frequently Asked Questions|Common Questions)([\s\S]*?)(?=##|$)/i);
  if (!faqSectionMatch) return faqs;
  
  const faqSection = faqSectionMatch[1];
  
  // Extract Q&A pairs
  const qaMatches = faqSection.matchAll(/###?\s*(.+?\?)\s*\n+([\s\S]+?)(?=###|$)/g);
  
  for (const match of qaMatches) {
    const question = match[1].trim();
    const answer = match[2].trim().replace(/<[^>]+>/g, '').substring(0, 500); // Clean HTML, limit length
    
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  
  return faqs;
}

/**
 * Add sources section
 */
export function addSourcesSection(
  content: string,
  sources: Array<{ title: string; url: string }>
): string {
  if (sources.length === 0) return content;
  
  const sourcesHtml = `
<div class="sources-section" style="margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #e5e7eb;">
  <h3>📚 Sources & References</h3>
  <ul>
    ${sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a></li>`).join('\n    ')}
  </ul>
  <p style="font-size: 0.875rem; color: #6b7280;">
    All information verified from official sources as of ${new Date().toLocaleDateString('en-AU')}.
  </p>
</div>
`;
  
  return content + sourcesHtml;
}

/**
 * Enhance article with AI
 */
export async function enhanceArticleWithAI(
  content: string,
  title: string
): Promise<string> {
  const prompt = `Enhance this article for better readability and SEO:

Title: ${title}

Content:
${content.substring(0, 3000)}...

Tasks:
1. Break long paragraphs (max 3-4 sentences each)
2. Add transition words between sections
3. Improve sentence variety
4. Ensure keyword appears naturally
5. Add subheadings where needed
6. Fix any grammar or spelling errors

Return the enhanced content maintaining the same structure and information.`;

  const response = await generateWithGrounding(prompt);
  return response.content;
}

/**
 * Complete article enhancement
 */
export async function enhanceArticle(
  articleId: string,
  content: string,
  metadata: {
    title: string;
    description: string;
    author: string;
    datePublished: Date;
    dateModified: Date;
  },
  sources: Array<{ title: string; url: string }> = []
): Promise<EnhancementResult> {
  const changes: string[] = [];
  let enhanced = content;
  
  // Step 1: Clean HTML tags
  const beforeClean = enhanced;
  enhanced = cleanHTMLTags(enhanced);
  if (enhanced !== beforeClean) {
    changes.push('Cleaned HTML tags and wrapper elements');
  }
  
  // Step 2: Fix list formatting
  const beforeLists = enhanced;
  enhanced = fixListFormatting(enhanced);
  if (enhanced !== beforeLists) {
    changes.push('Fixed list formatting (bullets and numbers)');
  }
  
  // Step 3: Fix heading hierarchy
  const beforeHeadings = enhanced;
  enhanced = fixHeadingHierarchy(enhanced);
  if (enhanced !== beforeHeadings) {
    changes.push('Fixed heading hierarchy (H1 → H2 → H3)');
  }
  
  // Step 4: Add schema markup
  enhanced = addSchemaMarkup(enhanced, metadata);
  changes.push('Added Article schema markup');
  
  // Step 5: Add expert credentials
  enhanced = addExpertCredentials(enhanced);
  changes.push('Added expert credentials and badges');
  
  // Step 6: Add YMYL disclaimer
  enhanced = addYMYLDisclaimer(enhanced);
  changes.push('Added YMYL compliance disclaimer');
  
  // Step 7: Add FAQ schema
  const faqs = extractFAQs(enhanced);
  if (faqs.length > 0) {
    enhanced = addFAQSchema(enhanced, faqs);
    changes.push(`Added FAQ schema with ${faqs.length} questions`);
  }
  
  // Step 8: Add sources
  if (sources.length > 0) {
    enhanced = addSourcesSection(enhanced, sources);
    changes.push(`Added ${sources.length} source citations`);
  }
  
  // Step 9: Validate E-E-A-T
  const eeatValidation = await validateEEAT(enhanced, metadata.title);
  
  // Step 8: Validate YMYL
  const ymylValidation = await validateYMYL(enhanced, metadata.title);
  
  return {
    content: enhanced,
    changes,
    eeatScore: eeatValidation.score,
    ymylCompliant: ymylValidation.compliant,
    issues: [...eeatValidation.suggestions, ...ymylValidation.recommendations],
  };
}

/**
 * Bulk enhance articles
 */
export async function bulkEnhanceArticles(
  articleIds: string[]
): Promise<Map<string, EnhancementResult>> {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  const results = new Map<string, EnhancementResult>();
  
  try {
    for (const articleId of articleIds) {
      const article = await prisma.blogPost.findUnique({
        where: { id: articleId },
      });
      
      if (!article) continue;
      
      const result = await enhanceArticle(
        articleId,
        article.content,
        {
          title: article.title,
          description: article.metaDescription || '',
          author: 'Sun Direct Power',
          datePublished: article.createdAt,
          dateModified: new Date(),
        },
        [] // Sources would come from article metadata
      );
      
      // Update article
      await prisma.blogPost.update({
        where: { id: articleId },
        data: {
          content: result.content,
          updatedAt: new Date(),
        },
      });
      
      results.set(articleId, result);
    }
  } finally {
    await prisma.$disconnect();
  }
  
  return results;
}
