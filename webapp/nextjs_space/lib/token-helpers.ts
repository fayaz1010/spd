/**
 * Token Generation Helpers
 * For secure proposal and other token-based access
 */

import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param length - Length of the token (default: 32)
 * @returns Secure URL-safe token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('base64url') // URL-safe base64
    .slice(0, length);
}

/**
 * Generate a proposal token
 * Format: prop_[timestamp]_[random]
 */
export function generateProposalToken(): string {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = generateSecureToken(16);
  return `prop_${timestamp}_${random}`;
}

/**
 * Validate token format
 */
export function isValidProposalToken(token: string): boolean {
  return /^prop_[a-z0-9]+_[A-Za-z0-9_-]+$/.test(token);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // No expiration
  return new Date() > expiresAt;
}
