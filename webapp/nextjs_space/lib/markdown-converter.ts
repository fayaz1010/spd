import { marked } from 'marked';

/**
 * Convert Markdown to HTML with proper spacing
 */
export function markdownToHTML(markdown: string): string {
  // Configure marked options
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: false, // Don't convert single line breaks to <br>
    headerIds: false, // Don't add IDs to headings
    mangle: false, // Don't escape email addresses
  });

  // Convert markdown to HTML
  let html = marked.parse(markdown) as string;

  // Add proper spacing between elements
  html = addProperSpacing(html);

  // Clean up any remaining markdown artifacts
  html = cleanMarkdownArtifacts(html);

  return html;
}

/**
 * Add proper spacing between HTML elements
 */
function addProperSpacing(html: string): string {
  let spaced = html;
  
  // Add spacing after headings
  spaced = spaced.replace(/<\/h1>/g, '</h1>\n\n');
  spaced = spaced.replace(/<\/h2>/g, '</h2>\n\n');
  spaced = spaced.replace(/<\/h3>/g, '</h3>\n\n');
  spaced = spaced.replace(/<\/h4>/g, '</h4>\n\n');
  
  // Add spacing between paragraphs
  spaced = spaced.replace(/<\/p>/g, '</p>\n\n');
  
  // Add spacing around lists
  spaced = spaced.replace(/<ul>/g, '\n<ul>');
  spaced = spaced.replace(/<\/ul>/g, '</ul>\n\n');
  spaced = spaced.replace(/<ol>/g, '\n<ol>');
  spaced = spaced.replace(/<\/ol>/g, '</ol>\n\n');
  
  // Add spacing around blockquotes
  spaced = spaced.replace(/<blockquote>/g, '\n<blockquote>');
  spaced = spaced.replace(/<\/blockquote>/g, '</blockquote>\n\n');
  
  // Clean up excessive spacing
  spaced = spaced.replace(/\n{3,}/g, '\n\n');
  
  return spaced.trim();
}

/**
 * Clean up any remaining markdown artifacts
 */
function cleanMarkdownArtifacts(html: string): string {
  let cleaned = html;
  
  // Remove any remaining markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // Remove markdown bold/italic that wasn't converted
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Remove markdown links that weren't converted
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  return cleaned;
}

/**
 * Detect if content is Markdown or HTML
 */
export function isMarkdown(content: string): boolean {
  // Check for common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers: # Header
    /\*\*.*?\*\*/,  // Bold: **text**
    /\*.*?\*/,      // Italic: *text*
    /^\s*[-*+]\s/m, // Unordered list: - item
    /^\s*\d+\.\s/m, // Ordered list: 1. item
    /\[.*?\]\(.*?\)/, // Links: [text](url)
  ];

  return markdownPatterns.some(pattern => pattern.test(content));
}

/**
 * Smart converter - detects format and converts if needed
 */
export function ensureHTML(content: string): string {
  if (isMarkdown(content)) {
    console.log('📝 Converting Markdown to HTML...');
    return markdownToHTML(content);
  }
  
  console.log('✅ Content is already HTML');
  return content;
}
