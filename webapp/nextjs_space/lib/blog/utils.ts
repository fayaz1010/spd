/**
 * Blog utility functions
 */

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime); // Minimum 1 minute
}

/**
 * Extract plain text from HTML content
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength: number = 160): string {
  const plainText = stripHtml(content);
  return truncateText(plainText, maxLength);
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get relative time (e.g., "2 days ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Extract headings from HTML content for table of contents
 */
export function extractHeadings(html: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /<h([2-6])[^>]*>(.*?)<\/h\1>/gi;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = stripHtml(match[2]);
    const id = generateSlug(text);
    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Add IDs to headings in HTML content
 */
export function addHeadingIds(html: string): string {
  return html.replace(/<h([2-6])>(.*?)<\/h\1>/gi, (match, level, text) => {
    const id = generateSlug(stripHtml(text));
    return `<h${level} id="${id}">${text}</h${level}>`;
  });
}

/**
 * Validate meta title length
 */
export function validateMetaTitle(title: string): { valid: boolean; message?: string } {
  if (title.length < 30) {
    return { valid: false, message: 'Meta title should be at least 30 characters' };
  }
  if (title.length > 60) {
    return { valid: false, message: 'Meta title should not exceed 60 characters' };
  }
  return { valid: true };
}

/**
 * Validate meta description length
 */
export function validateMetaDescription(description: string): { valid: boolean; message?: string } {
  if (description.length < 120) {
    return { valid: false, message: 'Meta description should be at least 120 characters' };
  }
  if (description.length > 160) {
    return { valid: false, message: 'Meta description should not exceed 160 characters' };
  }
  return { valid: true };
}
