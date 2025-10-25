import { prisma } from '@/lib/db';

export interface TaxSettings {
  gstRate: number;
  gstEnabled: boolean;
  taxInclusive: boolean;
  stateTaxes: {
    NSW: number;
    VIC: number;
    QLD: number;
    SA: number;
    WA: number;
    TAS: number;
    NT: number;
    ACT: number;
  };
  exemptCategories: string[];
}

/**
 * Get current tax settings from database
 * Returns default settings if none exist
 */
export async function getTaxSettings(): Promise<TaxSettings> {
  try {
    const settings = await prisma.configSettings.findUnique({
      where: { key: 'tax_settings' },
    });

    if (settings?.value) {
      const parsed = typeof settings.value === 'string'
        ? JSON.parse(settings.value)
        : settings.value;
      return parsed as TaxSettings;
    }
  } catch (error) {
    console.error('Error fetching tax settings:', error);
  }

  // Return default settings
  return getDefaultTaxSettings();
}

/**
 * Get default tax settings
 */
export function getDefaultTaxSettings(): TaxSettings {
  return {
    gstRate: 10,
    gstEnabled: true,
    taxInclusive: false,
    stateTaxes: {
      NSW: 0,
      VIC: 0,
      QLD: 0,
      SA: 0,
      WA: 0,
      TAS: 0,
      NT: 0,
      ACT: 0,
    },
    exemptCategories: [],
  };
}

/**
 * Calculate GST amount
 */
export function calculateGST(amount: number, rate: number): number {
  return amount * (rate / 100);
}

/**
 * Calculate total with GST
 */
export function calculateTotalWithGST(
  amount: number,
  settings: TaxSettings
): number {
  if (!settings.gstEnabled) return amount;

  const gst = calculateGST(amount, settings.gstRate);
  return amount + gst;
}

/**
 * Calculate total with GST and state tax
 */
export function calculateTotalWithAllTaxes(
  amount: number,
  state: string,
  settings: TaxSettings
): number {
  let total = amount;

  // Add GST if enabled
  if (settings.gstEnabled) {
    const gst = calculateGST(amount, settings.gstRate);
    total += gst;
  }

  // Add state tax if applicable
  const stateKey = state.toUpperCase() as keyof typeof settings.stateTaxes;
  if (settings.stateTaxes[stateKey]) {
    const stateTax = calculateGST(amount, settings.stateTaxes[stateKey]);
    total += stateTax;
  }

  return total;
}

/**
 * Check if a category is exempt from tax
 */
export function isExempt(category: string, settings: TaxSettings): boolean {
  return settings.exemptCategories.includes(category.toUpperCase());
}

/**
 * Calculate tax breakdown for a quote
 */
export function calculateTaxBreakdown(
  baseAmount: number,
  state: string,
  category: string,
  settings: TaxSettings
) {
  const breakdown = {
    baseAmount,
    gstAmount: 0,
    gstRate: 0,
    stateTaxAmount: 0,
    stateTaxRate: 0,
    totalTax: 0,
    totalAmount: baseAmount,
    isExempt: false,
  };

  // Check if exempt
  if (isExempt(category, settings)) {
    breakdown.isExempt = true;
    return breakdown;
  }

  // Calculate GST
  if (settings.gstEnabled) {
    breakdown.gstRate = settings.gstRate;
    breakdown.gstAmount = calculateGST(baseAmount, settings.gstRate);
  }

  // Calculate state tax
  const stateKey = state.toUpperCase() as keyof typeof settings.stateTaxes;
  if (settings.stateTaxes[stateKey]) {
    breakdown.stateTaxRate = settings.stateTaxes[stateKey];
    breakdown.stateTaxAmount = calculateGST(
      baseAmount,
      settings.stateTaxes[stateKey]
    );
  }

  // Calculate totals
  breakdown.totalTax = breakdown.gstAmount + breakdown.stateTaxAmount;
  breakdown.totalAmount = baseAmount + breakdown.totalTax;

  return breakdown;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

/**
 * Calculate price from tax-inclusive amount
 * (reverse calculation)
 */
export function calculateBaseFromInclusive(
  inclusiveAmount: number,
  settings: TaxSettings
): number {
  if (!settings.gstEnabled) return inclusiveAmount;

  const divisor = 1 + settings.gstRate / 100;
  return inclusiveAmount / divisor;
}

/**
 * Get tax display text
 */
export function getTaxDisplayText(settings: TaxSettings): string {
  if (!settings.gstEnabled) {
    return 'Tax not applicable';
  }

  if (settings.taxInclusive) {
    return `Prices include ${settings.gstRate}% GST`;
  }

  return `${settings.gstRate}% GST applies`;
}
