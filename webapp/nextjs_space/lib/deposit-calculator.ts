/**
 * Deposit Calculator
 * 
 * Calculates deposit amount based on admin settings
 * Supports both percentage-based and fixed amount deposits
 */

import { prisma } from '@/lib/db';

export interface DepositSettings {
  depositType: 'percentage' | 'fixed';
  depositPercentage: number;
  depositFixedAmount: number;
}

/**
 * Get deposit settings from database
 */
export async function getDepositSettings(): Promise<DepositSettings> {
  const settings = await prisma.apiSettings.findFirst();
  
  if (!settings) {
    // Return defaults if no settings found
    return {
      depositType: 'percentage',
      depositPercentage: 10,
      depositFixedAmount: 500
    };
  }
  
  return {
    depositType: settings.depositType as 'percentage' | 'fixed',
    depositPercentage: settings.depositPercentage,
    depositFixedAmount: settings.depositFixedAmount
  };
}

/**
 * Calculate deposit amount based on total cost and settings
 */
export function calculateDepositAmount(
  totalCost: number,
  settings: DepositSettings
): number {
  if (settings.depositType === 'fixed') {
    // Use fixed amount, but don't exceed total cost
    return Math.min(settings.depositFixedAmount, totalCost);
  } else {
    // Use percentage
    return totalCost * (settings.depositPercentage / 100);
  }
}

/**
 * Calculate deposit with settings fetch (convenience function)
 */
export async function calculateDeposit(totalCost: number): Promise<{
  depositAmount: number;
  depositType: 'percentage' | 'fixed';
  depositPercentage?: number;
  depositFixedAmount?: number;
}> {
  const settings = await getDepositSettings();
  const depositAmount = calculateDepositAmount(totalCost, settings);
  
  return {
    depositAmount,
    depositType: settings.depositType,
    depositPercentage: settings.depositType === 'percentage' ? settings.depositPercentage : undefined,
    depositFixedAmount: settings.depositType === 'fixed' ? settings.depositFixedAmount : undefined
  };
}

/**
 * Format deposit display text
 */
export function formatDepositDisplay(
  depositAmount: number,
  settings: DepositSettings
): string {
  if (settings.depositType === 'fixed') {
    return `$${depositAmount.toLocaleString()} (Fixed Deposit)`;
  } else {
    return `$${depositAmount.toLocaleString()} (${settings.depositPercentage}% Deposit)`;
  }
}
