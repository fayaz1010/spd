/**
 * Article Polisher - Clean, Beautiful, SEO-Optimized Content
 * 
 * Replaces the corrupted article-enhancer with a clean system that:
 * 1. Cleans HTML without corruption
 * 2. Optimizes typography and spacing
 * 3. Adds modern CSS styling
 * 4. Ensures readability
 * 5. Validates structure
 */

export interface PolishResult {
  content: string;
  changes: string[];
  warnings: string[];
}

/**
 * Main polishing function - applies all optimizations
 */
export function polishArticle(content: string): PolishResult {
  const changes: string[] = [];
  const warnings: string[] = [];
  let polished = content;

  // Step 1: Clean HTML
  const beforeClean = polished;
  polished = cleanHTML(polished);
  if (polished !== beforeClean) {
    changes.push('Cleaned HTML structure');
  }

  // Step 2: Optimize typography
  const beforeTypo = polished;
  polished = optimizeTypography(polished);
  if (polished !== beforeTypo) {
    changes.push('Optimized typography and spacing');
  }

  // Step 3: Fix readability issues
  const beforeRead = polished;
  polished = optimizeReadability(polished);
  if (polished !== beforeRead) {
    changes.push('Improved readability');
  }

  // Step 4: Validate structure
  const validation = validateStructure(polished);
  if (validation.errors.length > 0) {
    warnings.push(...validation.errors);
  }

  return {
    content: polished,
    changes,
    warnings,
  };
}

/**
 * Clean HTML - Remove corruption, fix malformed tags
 */
export function cleanHTML(content: string): string {
  let cleaned = content;

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```html\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Fix malformed paragraph tags
  cleaned = fixMalformedParagraphs(cleaned);

  // Fix nested tags
  cleaned = fixNestedTags(cleaned);

  // Remove empty tags
  cleaned = removeEmptyTags(cleaned);

  return cleaned;
}

/**
 * Fix malformed paragraph tags
 */
function fixMalformedParagraphs(html: string): string {
  let fixed = html;

  // Fix: <p><h2>Title</h2></p> → <h2>Title</h2>
  fixed = fixed.replace(/<p>\s*(<h[1-6][^>]*>.*?<\/h[1-6]>)\s*<\/p>/gi, '$1');

  // Fix: <p><ul> → <ul>
  fixed = fixed.replace(/<p>\s*(<ul[^>]*>)/gi, '$1');
  fixed = fixed.replace(/<p>\s*(<ol[^>]*>)/gi, '$1');
  fixed = fixed.replace(/(<\/ul>)\s*<\/p>/gi, '$1');
  fixed = fixed.replace(/(<\/ol>)\s*<\/p>/gi, '$1');

  // Fix: <p><div> → <div>
  fixed = fixed.replace(/<p>\s*(<div[^>]*>)/gi, '$1');
  fixed = fixed.replace(/(<\/div>)\s*<\/p>/gi, '$1');

  return fixed;
}

/**
 * Fix nested tags (remove duplicates)
 */
function fixNestedTags(html: string): string {
  let fixed = html;

  // Fix: <strong><strong>text</strong></strong> → <strong>text</strong>
  fixed = fixed.replace(/<strong>\s*<strong>(.*?)<\/strong>\s*<\/strong>/gi, '<strong>$1</strong>');
  fixed = fixed.replace(/<em>\s*<em>(.*?)<\/em>\s*<\/em>/gi, '<em>$1</em>');
  fixed = fixed.replace(/<b>\s*<b>(.*?)<\/b>\s*<\/b>/gi, '<b>$1</b>');

  return fixed;
}

/**
 * Remove empty tags
 */
function removeEmptyTags(html: string): string {
  let fixed = html;

  // Remove empty paragraphs
  fixed = fixed.replace(/<p>\s*<\/p>/gi, '');

  // Remove empty headings
  fixed = fixed.replace(/<h[1-6]>\s*<\/h[1-6]>/gi, '');

  // Remove empty lists
  fixed = fixed.replace(/<ul>\s*<\/ul>/gi, '');
  fixed = fixed.replace(/<ol>\s*<\/ol>/gi, '');

  // Remove empty divs
  fixed = fixed.replace(/<div[^>]*>\s*<\/div>/gi, '');

  return fixed;
}

/**
 * Optimize typography and spacing
 */
export function optimizeTypography(content: string): string {
  let optimized = content;

  // Add proper spacing after headings
  optimized = optimized.replace(/(<\/h[1-6]>)\n*(<p>|<h[1-6]>)/gi, '$1\n\n$2');

  // Add proper spacing between paragraphs
  optimized = optimized.replace(/(<\/p>)\n*(<p>)/gi, '$1\n\n$2');

  // Add spacing before lists
  optimized = optimized.replace(/(<\/p>)\n*(<ul>|<ol>)/gi, '$1\n\n$2');

  // Add spacing after lists
  optimized = optimized.replace(/(<\/ul>|<\/ol>)\n*(<p>|<h[1-6]>)/gi, '$1\n\n$2');

  // Fix list item spacing
  optimized = optimized.replace(/(<\/li>)\n*(<li>)/gi, '$1\n$2');

  return optimized;
}

/**
 * Optimize readability
 */
export function optimizeReadability(content: string): string {
  let optimized = content;

  // Break long paragraphs (more than 4 sentences)
  optimized = breakLongParagraphs(optimized);

  // Ensure proper sentence spacing
  optimized = optimized.replace(/([.!?])\s+([A-Z])/g, '$1 $2');

  return optimized;
}

/**
 * Break long paragraphs into smaller chunks
 */
function breakLongParagraphs(html: string): string {
  const paragraphRegex = /<p>(.*?)<\/p>/gs;
  
  return html.replace(paragraphRegex, (match, content) => {
    // Count sentences (rough estimate)
    const sentences = content.split(/[.!?]+\s+/).filter((s: string) => s.trim().length > 0);
    
    if (sentences.length <= 4) {
      return match; // Keep as is
    }

    // Split into smaller paragraphs (3-4 sentences each)
    const newParagraphs: string[] = [];
    for (let i = 0; i < sentences.length; i += 3) {
      const chunk = sentences.slice(i, i + 3).join('. ');
      if (chunk.trim()) {
        newParagraphs.push(`<p>${chunk}${chunk.endsWith('.') ? '' : '.'}</p>`);
      }
    }

    return newParagraphs.join('\n\n');
  });
}

/**
 * Validate HTML structure
 */
export function validateStructure(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unclosed tags
  const openTags = html.match(/<([a-z][a-z0-9]*)\b[^>]*>/gi) || [];
  const closeTags = html.match(/<\/([a-z][a-z0-9]*)>/gi) || [];

  const openTagNames = openTags.map(tag => tag.match(/<([a-z][a-z0-9]*)/i)?.[1].toLowerCase());
  const closeTagNames = closeTags.map(tag => tag.match(/<\/([a-z][a-z0-9]*)/i)?.[1].toLowerCase());

  // Count tags (simple validation)
  const tagCounts: Record<string, number> = {};
  openTagNames.forEach(tag => {
    if (tag && !['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  });

  closeTagNames.forEach(tag => {
    if (tag) {
      tagCounts[tag] = (tagCounts[tag] || 0) - 1;
    }
  });

  // Report unclosed tags
  Object.entries(tagCounts).forEach(([tag, count]) => {
    if (count > 0) {
      errors.push(`Unclosed tag: <${tag}> (${count} unclosed)`);
    } else if (count < 0) {
      errors.push(`Extra closing tag: </${tag}> (${Math.abs(count)} extra)`);
    }
  });

  // Check for proper heading hierarchy
  const headings = html.match(/<h([1-6])[^>]*>/gi) || [];
  const headingLevels = headings.map(h => parseInt(h.match(/<h([1-6])/i)?.[1] || '0'));

  for (let i = 1; i < headingLevels.length; i++) {
    const prev = headingLevels[i - 1];
    const curr = headingLevels[i];
    
    if (curr > prev + 1) {
      errors.push(`Heading hierarchy skip: H${prev} → H${curr} (should not skip levels)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Add modern CSS wrapper
 */
export function wrapWithCSS(content: string): string {
  const css = `
<style>
.article-content {
  max-width: 800px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 18px;
  line-height: 1.7;
  color: #333;
}

.article-content h2 {
  font-size: 32px;
  font-weight: 700;
  margin: 2.5em 0 1em 0;
  color: #1a1a1a;
  line-height: 1.3;
}

.article-content h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 2em 0 0.8em 0;
  color: #2a2a2a;
}

.article-content p {
  margin: 0 0 1.5em 0;
}

.article-content ul,
.article-content ol {
  margin: 1.5em 0;
  padding-left: 2em;
}

.article-content li {
  margin: 0.5em 0;
}

.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 2em 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.article-content blockquote {
  border-left: 4px solid #FF6B6B;
  padding-left: 1.5em;
  margin: 2em 0;
  font-style: italic;
  color: #666;
}

.article-content a {
  color: #FF6B6B;
  text-decoration: none;
  border-bottom: 1px solid #FF6B6B;
  transition: all 0.2s;
}

.article-content a:hover {
  color: #ff5252;
  border-bottom-color: #ff5252;
}

.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 2em 0;
}

.article-content th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.article-content td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

@media (max-width: 768px) {
  .article-content {
    font-size: 16px;
  }
  
  .article-content h2 {
    font-size: 28px;
  }
  
  .article-content h3 {
    font-size: 22px;
  }
}
</style>

<div class="article-content">
${content}
</div>
`;

  return css;
}

/**
 * Quick polish - minimal changes for safety
 */
export function quickPolish(content: string): string {
  let polished = content;

  // Only remove obvious corruption
  polished = polished.replace(/```html\n?/g, '');
  polished = polished.replace(/```\n?/g, '');

  // Fix excessive spacing
  polished = polished.replace(/\n{3,}/g, '\n\n');

  // Remove empty paragraphs
  polished = polished.replace(/<p>\s*<\/p>/gi, '');

  return polished;
}
