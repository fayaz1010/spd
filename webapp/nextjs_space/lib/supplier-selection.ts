
/**
 * Supplier Selection Logic
 * 
 * Intelligently selects the best supplier for a brand based on:
 * - System settings strategy (LOWEST_COST, HIGHEST_COMMISSION, BALANCED, PRIMARY_FIRST)
 * - Commission weights
 * - Availability and lead times
 */

import { prisma } from './db';

export interface SupplierOption {
  supplierMappingId: string;
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

export interface BrandSupplierSelection {
  brandId: string;
  brandName: string;
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
  
  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        id: 'default',
        supplierStrategy: 'PRIMARY_FIRST',
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
      // Score = (commissionWeight * profitScore) + ((1 - commissionWeight) * costScore)
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
 * Select best supplier for a brand
 */
export async function selectSupplierForBrand(
  brandId: string,
  category: 'PANEL' | 'BATTERY' | 'INVERTER'
): Promise<BrandSupplierSelection | null> {
  const settings = await getSystemSettings();
  
  // Build the query based on category
  const whereClause: any = {
    brandCategory: category,
    isActive: true,
  };
  
  if (category === 'PANEL') {
    whereClause.panelBrandId = brandId;
  } else if (category === 'BATTERY') {
    whereClause.batteryBrandId = brandId;
  } else if (category === 'INVERTER') {
    whereClause.inverterBrandId = brandId;
  }
  
  // Fetch all supplier mappings for this brand
  const mappings = await prisma.brandSupplier.findMany({
    where: whereClause,
    include: {
      supplierProduct: {
        include: {
          supplier: true,
        },
      },
      panelBrand: category === 'PANEL',
      batteryBrand: category === 'BATTERY',
      inverterBrand: category === 'INVERTER',
    },
  });
  
  if (mappings.length === 0) {
    return null; // No suppliers available
  }
  
  // Get brand name
  const firstMapping = mappings[0];
  let brandName = '';
  if (category === 'PANEL' && firstMapping.panelBrand) {
    brandName = firstMapping.panelBrand.name;
  } else if (category === 'BATTERY' && firstMapping.batteryBrand) {
    brandName = firstMapping.batteryBrand.name;
  } else if (category === 'INVERTER' && firstMapping.inverterBrand) {
    brandName = firstMapping.inverterBrand.name;
  }
  
  // Convert mappings to supplier options
  const options: SupplierOption[] = mappings.map((mapping) => {
    let commissionAmount = 0;
    if (mapping.commissionType === 'percentage') {
      commissionAmount = (mapping.supplierCost * mapping.ourCommission) / 100;
    } else {
      commissionAmount = mapping.ourCommission;
    }
    
    const netCost = mapping.supplierCost - commissionAmount;
    
    return {
      supplierMappingId: mapping.id,
      supplierId: mapping.supplierProduct.supplierId,
      supplierName: mapping.supplierProduct.supplier.name,
      supplierCost: mapping.supplierCost,
      commission: mapping.ourCommission,
      commissionType: mapping.commissionType as 'fixed' | 'percentage',
      netCost,
      netProfit: commissionAmount,
      leadTimeDays: mapping.leadTimeDays || mapping.supplierProduct.leadTime,
      isPrimary: mapping.isPrimary,
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
      reason = `Selected for lowest net cost: $${selected.netCost.toFixed(2)}`;
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
    brandId,
    brandName,
    category,
    selectedSupplier: selected,
    alternativeSuppliers: alternatives,
    selectionReason: reason,
  };
}

/**
 * Select suppliers for multiple brands (batch operation)
 */
export async function selectSuppliersForQuote(brands: {
  panelBrandId?: string;
  batteryBrandId?: string;
  inverterBrandId?: string;
}): Promise<{
  panel: BrandSupplierSelection | null;
  battery: BrandSupplierSelection | null;
  inverter: BrandSupplierSelection | null;
}> {
  const [panel, battery, inverter] = await Promise.all([
    brands.panelBrandId
      ? selectSupplierForBrand(brands.panelBrandId, 'PANEL')
      : Promise.resolve(null),
    brands.batteryBrandId
      ? selectSupplierForBrand(brands.batteryBrandId, 'BATTERY')
      : Promise.resolve(null),
    brands.inverterBrandId
      ? selectSupplierForBrand(brands.inverterBrandId, 'INVERTER')
      : Promise.resolve(null),
  ]);
  
  return { panel, battery, inverter };
}
