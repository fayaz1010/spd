
/**
 * Generate a unique quote reference in the format: SDP-YYYYMMDD-XXXX
 * Example: SDP-20251006-0001
 */
export function generateQuoteReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate a random 4-digit number
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `SDP-${dateStr}-${randomNum}`;
}

/**
 * Validate quote reference format
 */
export function isValidQuoteReference(ref: string): boolean {
  const pattern = /^SDP-\d{8}-\d{4}$/;
  return pattern.test(ref);
}

/**
 * Extract date from quote reference
 */
export function extractDateFromReference(ref: string): Date | null {
  if (!isValidQuoteReference(ref)) return null;
  
  const parts = ref.split('-');
  const dateStr = parts[1]; // YYYYMMDD
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  
  return new Date(year, month, day);
}
