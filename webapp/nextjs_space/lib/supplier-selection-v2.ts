/**
 * Supplier Selection Logic V2
 * 
 * Updated to work with unified Product table instead of separate Brand tables
 * Selects best supplier based on Product → SupplierProduct mappings
 */

import { prisma } from './db';

export interface SupplierOption {
  supplierProductId: string;
  supplierId: string;
  supplierName: string;
  supplierCost: number;
  commission: number;
  commissionType: 'fixed' | 'percentage';
  netCost: number; // Cost - Commission
  netProfit: number; // Commission amount
  leadTimeDays: number | null;
  isPrimary: boolean;
  score: number; // Calculated score based on strategy
}

export interface ProductSupplierSelection {
  productId: string;
  productName: string;
  category: 'PANEL' | 'BATTERY' | 'INVERTER';
  selectedSupplier: SupplierOption;
  alternativeSuppliers: SupplierOption[];
  selectionReason: string;
}

/**
 * Get system settings
 */
export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'default',
        supplierStrategy: 'LOWEST_COST', // Changed from PRIMARY_FIRST
        commissionWeight: 0.5,
        defaultPanelMarkup: 25,
        defaultBatteryMarkup: 20,
        defaultInverterMarkup: 20,
        maxLeadTimeDays: 30,
        showOutOfStock: false,
        autoRequestQuotes: true,
        quoteValidityDays: 30,
        depositType: 'percentage',
        depositPercentage: 30,
        depositFixedAmount: 5000,
        updatedAt: new Date(),
      },
    });
  }
  
  return settings;
}

/**
 * Calculate score for a supplier option based on strategy
 */
function calculateSupplierScore(
  option: SupplierOption,
  strategy: string,
  commissionWeight: number
): number {
  switch (strategy) {
    case 'LOWEST_COST':
      // Lower cost = higher score (invert)
      return 1000 / (option.netCost || 1);
      
    case 'HIGHEST_COMMISSION':
      // Higher commission = higher score
      return option.netProfit;
      
    case 'BALANCED':
      // Normalize both metrics and weight them
      const profitScore = option.netProfit;
      const costScore = 1000 / (option.netCost || 1);
      return (commissionWeight * profitScore) + ((1 - commissionWeight) * costScore);
      
    case 'PRIMARY_FIRST':
      // Primary suppliers get a huge bonus
      return option.isPrimary ? 1000000 : option.netProfit;
      
    default:
      return 0;
  }
}

/**
 * Select best supplier for a product
 */
export async function selectSupplierForProduct(
  productId: string
): Promise<ProductSupplierSelection | null> {
  const settings = await getSystemSettings();
  
  // Fetch product with all supplier mappings
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        include: {
          supplier: true,
        },
      },
    },
  });
  
  if (!product || product.SupplierProduct.length === 0) {
    return null; // No suppliers available
  }
  
  // Determine category
  let category: 'PANEL' | 'BATTERY' | 'INVERTER';
  if (product.productType === 'PANEL') {
    category = 'PANEL';
  } else if (product.productType === 'BATTERY') {
    category = 'BATTERY';
  } else if (product.productType === 'INVERTER') {
    category = 'INVERTER';
  } else {
    return null; // Not a main component
  }
  
  // Convert supplier products to supplier options
  const options: SupplierOption[] = product.SupplierProduct.map((sp) => {
    let commissionAmount = 0;
    if (sp.commissionType === 'percentage') {
      commissionAmount = (sp.unitCost * sp.commissionAmount) / 100;
    } else {
      commissionAmount = sp.commissionAmount;
    }
    
    const netCost = sp.unitCost - commissionAmount;
    
    return {
      supplierProductId: sp.id,
      supplierId: sp.supplierId,
      supplierName: sp.supplier.name,
      supplierCost: sp.unitCost,
      commission: sp.commissionAmount,
      commissionType: sp.commissionType as 'fixed' | 'percentage',
      netCost,
      netProfit: commissionAmount,
      leadTimeDays: sp.leadTime,
      isPrimary: false, // SupplierProduct doesn't have isPrimary flag
      score: 0, // Will be calculated
    };
  });
  
  // Filter by lead time if configured
  const filteredOptions = options.filter((opt) => {
    if (settings.maxLeadTimeDays && opt.leadTimeDays) {
      return opt.leadTimeDays <= settings.maxLeadTimeDays;
    }
    return true;
  });
  
  if (filteredOptions.length === 0) {
    return null; // No suppliers meet criteria
  }
  
  // Calculate scores
  filteredOptions.forEach((opt) => {
    opt.score = calculateSupplierScore(
      opt,
      settings.supplierStrategy,
      settings.commissionWeight
    );
  });
  
  // Sort by score (descending)
  filteredOptions.sort((a, b) => b.score - a.score);
  
  const selected = filteredOptions[0];
  const alternatives = filteredOptions.slice(1);
  
  // Generate selection reason
  let reason = '';
  switch (settings.supplierStrategy) {
    case 'LOWEST_COST':
      reason = `Selected for lowest cost: $${selected.supplierCost.toFixed(2)}`;
      break;
    case 'HIGHEST_COMMISSION':
      reason = `Selected for highest commission: $${selected.netProfit.toFixed(2)}`;
      break;
    case 'BALANCED':
      reason = `Selected for balanced cost/commission score: ${selected.score.toFixed(2)}`;
      break;
    case 'PRIMARY_FIRST':
      reason = selected.isPrimary
        ? 'Selected as primary supplier'
        : `No primary supplier; selected for best commission`;
      break;
  }
  
  return {
    productId,
    productName: product.name,
    category,
    selectedSupplier: selected,
    alternativeSuppliers: alternatives,
    selectionReason: reason,
  };
}
