/**
 * Brand Compatibility Layer
 * 
 * This service provides backward compatibility functions that allow
 * existing code to continue working with the old Brand table structure
 * while actually using the new unified Product table behind the scenes.
 * 
 * This enables gradual migration without breaking existing functionality.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// Type Definitions (Old Brand Formats)
// ============================================

export interface PanelBrand {
  id: string;
  name: string;
  manufacturer: string;
  wattage: number;
  pricePerKw: number;
  efficiency: number;
  warrantyYears: number;
  tier: string;
  features: any[];
  bestFor: any[];
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  imageUrl: string | null;
  description: string | null;
}

export interface BatteryBrand {
  id: string;
  name: string;
  manufacturer: string;
  capacityKwh: number;
  usableKwh: number;
  price: number;
  warrantyYears: number;
  cycleLife: number;
  tier: string;
  features: any[];
  bestFor: any[];
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  imageUrl: string | null;
  description: string | null;
}

export interface InverterBrand {
  id: string;
  name: string;
  manufacturer: string;
  capacityKw: number;
  pricePerKw: number;
  warrantyYears: number;
  hasOptimizers: boolean;
  optimizerCost: number | null;
  tier: string;
  features: any[];
  bestFor: any[];
  isAvailable: boolean;
  isRecommended: boolean;
  sortOrder: number;
  imageUrl: string | null;
  description: string | null;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get Product by old Brand ID
 * This looks up a Product that was migrated from an old Brand table
 */
async function getProductByOldBrandId(
  brandId: string,
  brandType: 'PanelBrand' | 'BatteryBrand' | 'InverterBrand'
) {
  return await prisma.product.findFirst({
    where: {
      migratedFromBrandId: brandId,
      migratedFromTable: brandType,
    },
  });
}

/**
 * Get default price for a product type
 * TODO: In future, get from SupplierProduct table
 */
function getDefaultPrice(productType: string, specifications: any): number {
  switch (productType) {
    case 'PANEL':
      // Default: $1200 per kW
      return 1200;
    case 'BATTERY':
      // Default: Based on capacity
      const capacityKwh = specifications.capacityKwh || 10;
      return capacityKwh * 1500; // $1500 per kWh
    case 'INVERTER':
      // Default: $1000 per kW
      return 1000;
    default:
      return 0;
  }
}

// ============================================
// Panel Brand Compatibility Functions
// ============================================

/**
 * Get a single panel brand by ID
 * Returns data in old PanelBrand format
 */
export async function getPanelBrand(id: string): Promise<PanelBrand | null> {
  // First try to get from Product table (migrated data)
  let product = await getProductByOldBrandId(id, 'PanelBrand');
  
  // If not found, try direct Product ID lookup
  if (!product) {
    product = await prisma.product.findUnique({
      where: { id, productType: 'PANEL' },
    });
  }
  
  if (product) {
    // Get actual price from SupplierProduct - prefer retail price
    const supplierProduct = await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
        retailPrice: { not: null },
      },
      orderBy: { retailPrice: 'asc' },
    });
    
    // Fallback to any supplier if no retail price available
    const fallbackSupplier = !supplierProduct ? await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { unitCost: 'asc' },
    }) : null;
    
    const finalSupplier = supplierProduct || fallbackSupplier;
    
    // Convert Product to PanelBrand format
    const specs = product.specifications as any;
    const priceToUse = finalSupplier?.retailPrice || finalSupplier?.unitCost;
    const actualPricePerKw = priceToUse ? 
      (priceToUse / (specs.wattage || 400) * 1000) : 
      getDefaultPrice('PANEL', specs);
    
    return {
      id: product.migratedFromBrandId || product.id, // Use original brand ID for compatibility, or product ID
      name: product.name,
      manufacturer: product.manufacturer,
      wattage: specs.wattage || 400,
      pricePerKw: actualPricePerKw,
      efficiency: specs.efficiency || 20,
      warrantyYears: product.warrantyYears || 25,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  }
  
  // Fallback: Get from old PanelBrand table
  const oldBrand = await prisma.panelBrand.findUnique({
    where: { id },
  });
  
  if (!oldBrand) return null;
  
  return {
    id: oldBrand.id,
    name: oldBrand.name,
    manufacturer: oldBrand.manufacturer,
    wattage: oldBrand.wattage,
    pricePerKw: oldBrand.pricePerKw,
    efficiency: oldBrand.efficiency,
    warrantyYears: oldBrand.warrantyYears,
    tier: oldBrand.tier,
    features: Array.isArray(oldBrand.features) ? oldBrand.features : [],
    bestFor: Array.isArray(oldBrand.bestFor) ? oldBrand.bestFor : [],
    isAvailable: oldBrand.isAvailable,
    isRecommended: oldBrand.isRecommended,
    sortOrder: oldBrand.sortOrder,
    imageUrl: oldBrand.imageUrl,
    description: oldBrand.description,
  };
}

/**
 * Get all panel brands
 * Returns data in old PanelBrand format
 */
export async function getAllPanelBrands(filters?: {
  isAvailable?: boolean;
  isRecommended?: boolean;
}): Promise<PanelBrand[]> {
  // Get from Product table
  const products = await prisma.product.findMany({
    where: {
      productType: 'PANEL',
      isAvailable: filters?.isAvailable,
      isRecommended: filters?.isRecommended,
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
  
  return products.map(product => {
    const specs = product.specifications as any;
    return {
      id: product.migratedFromBrandId || product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      wattage: specs.wattage || 400,
      pricePerKw: getDefaultPrice('PANEL', specs),
      efficiency: specs.efficiency || 20,
      warrantyYears: product.warrantyYears || 25,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  });
}

// ============================================
// Battery Brand Compatibility Functions
// ============================================

/**
 * Get a single battery brand by ID
 * Returns data in old BatteryBrand format
 */
export async function getBatteryBrand(id: string): Promise<BatteryBrand | null> {
  // First try direct Product ID lookup (most common case)
  let product = await prisma.product.findFirst({
    where: { 
      id,
      productType: 'BATTERY',
    },
  });
  
  // If not found, try to get from Product table (migrated data)
  if (!product) {
    product = await getProductByOldBrandId(id, 'BatteryBrand');
  }
  
  if (product) {
    // Get actual price from SupplierProduct - prefer retail price
    const supplierProduct = await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
        retailPrice: { not: null },
      },
      orderBy: { retailPrice: 'asc' },
    });
    
    // Fallback to any supplier if no retail price available
    const fallbackSupplier = !supplierProduct ? await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { unitCost: 'asc' },
    }) : null;
    
    const finalSupplier = supplierProduct || fallbackSupplier;
    
    // Convert Product to BatteryBrand format
    const specs = product.specifications as any;
    const actualPrice = finalSupplier?.retailPrice || finalSupplier?.unitCost || getDefaultPrice('BATTERY', specs);
    
    console.log(`🔋 Battery lookup for ${id}:`, {
      productId: product.id,
      name: product.name,
      specsCapacity: specs.capacityKwh,
      actualPrice,
      supplierPrice: supplierProduct?.retailPrice || supplierProduct?.unitCost,
    });
    
    return {
      id: product.migratedFromBrandId || product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacityKwh: specs.capacityKwh || 10,
      usableKwh: specs.usableKwh || (specs.capacityKwh * 0.9) || 9,
      price: actualPrice,
      warrantyYears: product.warrantyYears || 10,
      cycleLife: specs.cycleLife || 6000,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  }
  
  // Fallback: Get from old BatteryBrand table
  const oldBrand = await prisma.batteryBrand.findUnique({
    where: { id },
  });
  
  if (!oldBrand) return null;
  
  return {
    id: oldBrand.id,
    name: oldBrand.name,
    manufacturer: oldBrand.manufacturer,
    capacityKwh: oldBrand.capacityKwh,
    usableKwh: oldBrand.usableKwh,
    price: oldBrand.price,
    warrantyYears: oldBrand.warrantyYears,
    cycleLife: oldBrand.cycleLife,
    tier: oldBrand.tier,
    features: Array.isArray(oldBrand.features) ? oldBrand.features : [],
    bestFor: Array.isArray(oldBrand.bestFor) ? oldBrand.bestFor : [],
    isAvailable: oldBrand.isAvailable,
    isRecommended: oldBrand.isRecommended,
    sortOrder: oldBrand.sortOrder,
    imageUrl: oldBrand.imageUrl,
    description: oldBrand.description,
  };
}

/**
 * Get all battery brands
 * Returns data in old BatteryBrand format
 */
export async function getAllBatteryBrands(filters?: {
  isAvailable?: boolean;
  isRecommended?: boolean;
}): Promise<BatteryBrand[]> {
  // Get from Product table
  const products = await prisma.product.findMany({
    where: {
      productType: 'BATTERY',
      isAvailable: filters?.isAvailable,
      isRecommended: filters?.isRecommended,
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
  
  return products.map(product => {
    const specs = product.specifications as any;
    return {
      id: product.migratedFromBrandId || product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacityKwh: specs.capacityKwh || 10,
      usableKwh: specs.usableKwh || (specs.capacityKwh * 0.9) || 9,
      price: getDefaultPrice('BATTERY', specs),
      warrantyYears: product.warrantyYears || 10,
      cycleLife: specs.cycleLife || 6000,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  });
}

// ============================================
// Inverter Brand Compatibility Functions
// ============================================

/**
 * Get a single inverter brand by ID
 * Returns data in old InverterBrand format
 */
export async function getInverterBrand(id: string): Promise<InverterBrand | null> {
  // First try direct Product ID lookup (most common case)
  let product = await prisma.product.findFirst({
    where: { 
      id,
      productType: 'INVERTER',
    },
  });
  
  // If not found, try to get from Product table (migrated data)
  if (!product) {
    product = await getProductByOldBrandId(id, 'InverterBrand');
  }
  
  if (product) {
    // Get actual price from SupplierProduct - prefer retail price
    const supplierProduct = await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
        retailPrice: { not: null },
      },
      orderBy: { retailPrice: 'asc' },
    });
    
    // Fallback to any supplier if no retail price available
    const fallbackSupplier = !supplierProduct ? await prisma.supplierProduct.findFirst({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { unitCost: 'asc' },
    }) : null;
    
    const finalSupplier = supplierProduct || fallbackSupplier;
    
    // Convert Product to InverterBrand format
    const specs = product.specifications as any;
    const actualPrice = finalSupplier?.retailPrice || finalSupplier?.unitCost || getDefaultPrice('INVERTER', specs);
    
    console.log(`⚡ Inverter lookup for ${id}:`, {
      productId: product.id,
      name: product.name,
      specsCapacity: specs.capacityKw,
      actualPrice,
      supplierPrice: supplierProduct?.retailPrice || supplierProduct?.unitCost,
    });
    
    return {
      id: product.migratedFromBrandId || product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacityKw: specs.capacityKw || 10,
      pricePerKw: actualPrice, // This is actually the TOTAL price, not per-kW (legacy naming)
      warrantyYears: product.warrantyYears || 10,
      hasOptimizers: specs.hasOptimizers || false,
      optimizerCost: specs.optimizerCost || null,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  }
  
  // Fallback: Get from old InverterBrand table
  const oldBrand = await prisma.inverterBrand.findUnique({
    where: { id },
  });
  
  if (!oldBrand) return null;
  
  return {
    id: oldBrand.id,
    name: oldBrand.name,
    manufacturer: oldBrand.manufacturer,
    capacityKw: oldBrand.capacityKw,
    pricePerKw: oldBrand.pricePerKw,
    warrantyYears: oldBrand.warrantyYears,
    hasOptimizers: oldBrand.hasOptimizers,
    optimizerCost: oldBrand.optimizerCost,
    tier: oldBrand.tier,
    features: Array.isArray(oldBrand.features) ? oldBrand.features : [],
    bestFor: Array.isArray(oldBrand.bestFor) ? oldBrand.bestFor : [],
    isAvailable: oldBrand.isAvailable,
    isRecommended: oldBrand.isRecommended,
    sortOrder: oldBrand.sortOrder,
    imageUrl: oldBrand.imageUrl,
    description: oldBrand.description,
  };
}

/**
 * Get all inverter brands
 * Returns data in old InverterBrand format
 */
export async function getAllInverterBrands(filters?: {
  isAvailable?: boolean;
  isRecommended?: boolean;
}): Promise<InverterBrand[]> {
  // Get from Product table
  const products = await prisma.product.findMany({
    where: {
      productType: 'INVERTER',
      isAvailable: filters?.isAvailable,
      isRecommended: filters?.isRecommended,
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
  
  return products.map(product => {
    const specs = product.specifications as any;
    return {
      id: product.migratedFromBrandId || product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacityKw: specs.capacityKw || 10,
      pricePerKw: getDefaultPrice('INVERTER', specs),
      warrantyYears: product.warrantyYears || 10,
      hasOptimizers: specs.hasOptimizers || false,
      optimizerCost: specs.optimizerCost || null,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
    };
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Find battery brand closest to desired capacity
 */
export async function findClosestBattery(targetKwh: number): Promise<BatteryBrand | null> {
  const batteries = await getAllBatteryBrands({ isAvailable: true });
  
  if (batteries.length === 0) return null;
  
  return batteries.reduce((prev, curr) => 
    Math.abs(curr.capacityKwh - targetKwh) < Math.abs(prev.capacityKwh - targetKwh)
      ? curr
      : prev
  );
}

/**
 * Find inverter brand closest to desired capacity
 */
export async function findClosestInverter(targetKw: number): Promise<InverterBrand | null> {
  const inverters = await getAllInverterBrands({ isAvailable: true });
  
  if (inverters.length === 0) return null;
  
  return inverters.reduce((prev, curr) => 
    Math.abs(curr.capacityKw - targetKw) < Math.abs(prev.capacityKw - targetKw)
      ? curr
      : prev
  );
}
