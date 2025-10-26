/**
 * Content Formatter
 * Fixes common formatting issues in AI-generated content
 */

/**
 * Fix heading formatting
 * Converts plain text headings to proper HTML with spacing
 */
export function fixHeadingFormatting(content: string): string {
  let fixed = content;
  
  // Split into lines
  const lines = fixed.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // Skip if already an HTML heading
    if (line.match(/^<h[1-6]>/i)) {
      result.push(line);
      // Add spacing after heading
      if (nextLine && !nextLine.startsWith('<')) {
        result.push('');
      }
      continue;
    }
    
    // Pattern 1: Numbered headings (1. Title, 2. Title, etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch && line.length < 100) {
      const number = numberedMatch[1];
      const title = numberedMatch[2];
      result.push(`<h2>${number}. ${title}</h2>`);
      result.push(''); // Add spacing after heading
      continue;
    }
    
    // Pattern 2: Title Case headings (short lines that look like titles)
    const isTitleCase = line.match(/^[A-Z][^.!?]*[^.!?]$/) && line.length < 80 && line.length > 10;
    const hasNoHTMLTags = !line.includes('<');
    const nextLineIsContent = nextLine && nextLine.length > 50;
    
    if (isTitleCase && hasNoHTMLTags && nextLineIsContent) {
      // Check if it's a subheading (follows a main heading)
      const prevLine = i > 0 ? result[result.length - 1] : '';
      const isAfterHeading = prevLine.match(/^<h[12]>/i);
      
      if (isAfterHeading) {
        result.push(`<h3>${line}</h3>`);
      } else {
        result.push(`<h2>${line}</h2>`);
      }
      result.push(''); // Add spacing after heading
      continue;
    }
    
    // Pattern 3: All caps headings
    const isAllCaps = line === line.toUpperCase() && line.length < 80 && line.length > 5;
    if (isAllCaps && hasNoHTMLTags) {
      result.push(`<h2>${line}</h2>`);
      result.push(''); // Add spacing after heading
      continue;
    }
    
    // Regular line
    result.push(lines[i]); // Keep original formatting (with indentation)
  }
  
  return result.join('\n');
}

/**
 * Fix paragraph spacing
 * Ensures proper spacing between paragraphs and after headings
 */
export function fixParagraphSpacing(content: string): string {
  let fixed = content;
  
  // Add space after headings if missing
  fixed = fixed.replace(/(<\/h[1-6]>)\n*(<p>|[A-Z])/g, '$1\n\n$2');
  
  // Add space between paragraphs if missing
  fixed = fixed.replace(/(<\/p>)\n*(<p>)/g, '$1\n\n$2');
  
  // Remove excessive spacing (more than 2 newlines)
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  return fixed;
}

/**
 * Fix bold keyword formatting
 * Removes excessive bold tags around keywords
 */
export function fixBoldFormatting(content: string): string {
  let fixed = content;
  
  // Pattern: <strong>keyword</strong> appearing too frequently
  // Only keep bold for first 2-3 occurrences of each keyword
  
  const boldMatches = content.matchAll(/<strong>([^<]+)<\/strong>/g);
  const keywordCounts: Map<string, number> = new Map();
  
  for (const match of boldMatches) {
    const keyword = match[1].toLowerCase();
    keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
  }
  
  // Remove bold from keywords that appear more than 3 times
  keywordCounts.forEach((count, keyword) => {
    if (count > 3) {
      let occurrences = 0;
      fixed = fixed.replace(
        new RegExp(`<strong>${keyword}</strong>`, 'gi'),
        (match) => {
          occurrences++;
          // Keep first 2 bold, remove rest
          return occurrences <= 2 ? match : keyword;
        }
      );
    }
  });
  
  return fixed;
}

/**
 * Format sources section from Gemini grounding
 * Deduplicates, removes API URLs, and formats properly
 */
export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export function formatSources(sources: GroundingSource[]): string {
  if (!sources || sources.length === 0) {
    return '';
  }

  // Deduplicate sources by URL
  const uniqueSources = new Map<string, GroundingSource>();
  
  sources.forEach(source => {
    // Skip API URLs (vertexaisearch, googleapis, etc.)
    if (source.url.includes('vertexaisearch') || 
        source.url.includes('googleapis.com') ||
        source.url.includes('google.com/search')) {
      return;
    }
    
    // Skip if already added
    if (!uniqueSources.has(source.url)) {
      uniqueSources.set(source.url, source);
    }
  });

  // Convert to array and sort by domain (government sites first)
  const sortedSources = Array.from(uniqueSources.values()).sort((a, b) => {
    const aIsGov = a.url.includes('.gov.au') || a.url.includes('.gov');
    const bIsGov = b.url.includes('.gov.au') || b.url.includes('.gov');
    
    if (aIsGov && !bIsGov) return -1;
    if (!aIsGov && bIsGov) return 1;
    
    // Then sort alphabetically by domain
    const aDomain = new URL(a.url).hostname;
    const bDomain = new URL(b.url).hostname;
    return aDomain.localeCompare(bDomain);
  });

  // Format as clean HTML list
  const sourcesList = sortedSources
    .map(source => {
      const domain = new URL(source.url).hostname.replace('www.', '');
      return `  <li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${domain}</a>${source.title ? ` - ${source.title}` : ''}</li>`;
    })
    .join('\n');

  return `
<div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
  <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 15px; color: #374151;">Sources:</h3>
  <ul style="list-style: none; padding: 0; margin: 0;">
${sourcesList}
  </ul>
  <p style="margin-top: 20px; font-size: 14px; color: #6b7280; font-style: italic;">Information verified from official sources and industry authorities. Last updated: ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })}.</p>
</div>
`;
}

/**
 * Comprehensive content formatting
 * Applies all formatting fixes
 */
export function formatContent(content: string): string {
  let formatted = content;
  
  // Step 1: Fix heading formatting
  formatted = fixHeadingFormatting(formatted);
  
  // Step 2: Fix paragraph spacing
  formatted = fixParagraphSpacing(formatted);
  
  // Step 3: Fix bold formatting
  formatted = fixBoldFormatting(formatted);
  
  return formatted;
}
