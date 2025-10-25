/**
 * Format Helpers - Safe number formatting for React hydration
 * 
 * These helpers ensure we never display NaN or undefined,
 * and prevent hydration errors by providing consistent formatting.
 */

/**
 * Safely format a number as currency
 * Always returns a valid string, never NaN
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return Math.round(value).toLocaleString();
}

/**
 * Safely format a number with decimals
 * Always returns a valid string, never NaN
 */
export function formatNumber(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}

/**
 * Safely convert any value to a number
 * Returns fallback if value is invalid
 */
export function safeNumber(value: any, fallback: number = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Safely format a percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return value.toFixed(decimals);
}

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: any): boolean {
  return value !== null && value !== undefined && !isNaN(Number(value));
}
