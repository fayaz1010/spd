import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Product Compatibility Service
 * 
 * Bridges the old brand tables (PanelBrand, BatteryBrand, InverterBrand)
 * with the new unified Product table.
 * 
 * This allows the calculator to continue working while we migrate to the new system.
 */

// ============================================================================
// PANELS
// ============================================================================

export async function getPanelsAsOldFormat(filters?: {
  isAvailable?: boolean;
  tier?: string;
  isRecommended?: boolean;
}) {
  const products = await prisma.product.findMany({
    where: {
      productType: 'PANEL',
      ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
      ...(filters?.tier && { tier: filters.tier }),
      ...(filters?.isRecommended !== undefined && { isRecommended: filters.isRecommended }),
    },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' }, // Get cheapest supplier first
        take: 1,
        include: {
          supplier: true,
        },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  // Convert to old PanelBrand format
  return products.map(product => {
    const specs = product.specifications as any;
    const supplier = product.SupplierProduct[0];
    
    // Calculate price per kW from supplier pricing
    const wattage = specs.wattage || 440;
    const pricePerPanel = supplier?.retailPrice || supplier?.unitCost || 0;
    const pricePerKw = (pricePerPanel / wattage) * 1000;

    return {
      id: product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      wattage: wattage,
      pricePerKw: pricePerKw,
      efficiency: specs.efficiency || 22,
      warrantyYears: product.warrantyYears || 25,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
      // Additional fields for new system
      _productId: product.id,
      _supplierId: supplier?.supplierId,
      _supplierName: supplier?.supplier?.name,
      _unitCost: supplier?.unitCost,
      _retailPrice: supplier?.retailPrice,
      _installationReqs: product.installationReqs,
    };
  });
}

// ============================================================================
// BATTERIES
// ============================================================================

export async function getBatteriesAsOldFormat(filters?: {
  isAvailable?: boolean;
  tier?: string;
  isRecommended?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
}) {
  const products = await prisma.product.findMany({
    where: {
      productType: 'BATTERY',
      ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
      ...(filters?.tier && { tier: filters.tier }),
      ...(filters?.isRecommended !== undefined && { isRecommended: filters.isRecommended }),
    },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: {
          supplier: true,
        },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  // Filter by capacity if specified
  let filteredProducts = products;
  if (filters?.minCapacity || filters?.maxCapacity) {
    filteredProducts = products.filter(product => {
      const specs = product.specifications as any;
      const capacity = specs.capacity || 0;
      if (filters.minCapacity && capacity < filters.minCapacity) return false;
      if (filters.maxCapacity && capacity > filters.maxCapacity) return false;
      return true;
    });
  }

  // Convert to old BatteryBrand format
  return filteredProducts.map(product => {
    const specs = product.specifications as any;
    const supplier = product.SupplierProduct[0];
    
    // Support both capacity and capacityKwh field names
    const capacity = specs.capacity || specs.capacityKwh || 10;
    const usableCapacity = specs.usableCapacity || specs.usableKwh || capacity * 0.9;
    
    return {
      id: product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacity: capacity,
      usableCapacity: usableCapacity,
      price: supplier?.retailPrice || supplier?.unitCost || 0,
      warrantyYears: product.warrantyYears || 10,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
      // Additional specs
      cycleLife: specs.cycleLife || 6000,
      voltage: specs.voltage || 48,
      dimensions: specs.dimensions || '',
      weight: specs.weight || 0,
      // Additional fields for new system
      _productId: product.id,
      _supplierId: supplier?.supplierId,
      _supplierName: supplier?.supplier?.name,
      _unitCost: supplier?.unitCost,
      _retailPrice: supplier?.retailPrice,
      _installationReqs: product.installationReqs,
    };
  });
}

// ============================================================================
// INVERTERS
// ============================================================================

export async function getInvertersAsOldFormat(filters?: {
  isAvailable?: boolean;
  tier?: string;
  isRecommended?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
}) {
  const products = await prisma.product.findMany({
    where: {
      productType: 'INVERTER',
      ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
      ...(filters?.tier && { tier: filters.tier }),
      ...(filters?.isRecommended !== undefined && { isRecommended: filters.isRecommended }),
    },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: {
          supplier: true,
        },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
    orderBy: [
      { isRecommended: 'desc' },
      { sortOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  // Filter by capacity if specified
  let filteredProducts = products;
  if (filters?.minCapacity || filters?.maxCapacity) {
    filteredProducts = products.filter(product => {
      const specs = product.specifications as any;
      const capacity = specs.capacity || specs.capacityKw || 0;
      if (filters.minCapacity && capacity < filters.minCapacity) return false;
      if (filters.maxCapacity && capacity > filters.maxCapacity) return false;
      return true;
    });
  }

  // Convert to old InverterBrand format
  return filteredProducts.map(product => {
    const specs = product.specifications as any;
    const supplier = product.SupplierProduct[0];
    
    return {
      id: product.id,
      name: product.name,
      manufacturer: product.manufacturer,
      capacity: specs.capacity || specs.capacityKw || 10,
      price: supplier?.retailPrice || supplier?.unitCost || 0,
      hasOptimizers: specs.hasOptimizers || false,
      warrantyYears: product.warrantyYears || 10,
      tier: product.tier || 'mid',
      features: Array.isArray(product.features) ? product.features : [],
      bestFor: Array.isArray(product.bestFor) ? product.bestFor : [],
      isAvailable: product.isAvailable,
      isRecommended: product.isRecommended,
      sortOrder: product.sortOrder,
      imageUrl: product.imageUrl,
      description: product.description,
      // Additional specs
      phases: specs.phases || 1,
      efficiency: specs.efficiency || 97.5,
      maxDcInput: specs.maxDcInput || 15,
      // Additional fields for new system
      _productId: product.id,
      _supplierId: supplier?.supplierId,
      _supplierName: supplier?.supplier?.name,
      _unitCost: supplier?.unitCost,
      _retailPrice: supplier?.retailPrice,
      _installationReqs: product.installationReqs,
    };
  });
}

// ============================================================================
// COST CALCULATION
// ============================================================================

export async function calculateProductCost(
  productId: string,
  quantity: number,
  options?: {
    includeInstallation?: boolean;
    complexityFactors?: string[]; // IDs of complexity factors to apply
    supplierData?: any; // Optional: pass supplier data to avoid re-querying
  }
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        orderBy: { unitCost: 'asc' },
        take: 1,
        include: {
          supplier: true,
        },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  // Use provided supplier data or query result
  // Only use supplierData if it has valid pricing
  const supplier = (options?.supplierData?.retailPrice || options?.supplierData?.unitCost) 
    ? options.supplierData 
    : product.SupplierProduct[0];
    
  if (!supplier) {
    // Enhanced error message with debugging info
    console.error(`❌ No active supplier found for product:`);
    console.error(`   Product ID: ${productId}`);
    console.error(`   Product Name: ${product.name}`);
    console.error(`   Product Type: ${product.productType}`);
    console.error(`   Product Available: ${product.isAvailable}`);
    
    // Check if there are any suppliers at all (active or not)
    const allSuppliers = await prisma.supplierProduct.findMany({
      where: { productId: productId },
    });
    console.error(`   Total SupplierProduct entries: ${allSuppliers.length}`);
    if (allSuppliers.length > 0) {
      console.error(`   Inactive suppliers: ${allSuppliers.filter(s => !s.isActive).length}`);
    }
    
    throw new Error(
      `No active supplier found for product: ${product.name} (ID: ${productId}). ` +
      `This product may not have been properly migrated to the new Product system. ` +
      `Please run the migration script: npm run migrate:brands-to-products`
    );
  }

  // Calculate product cost
  const unitPrice = supplier.retailPrice || supplier.unitCost;
  const productCost = unitPrice * quantity;

  // Calculate installation cost
  let installationCost = 0;
  const installationBreakdown: any[] = [];

  if (options?.includeInstallation !== false) {
    for (const req of product.installationReqs) {
      if (!req.isRequired) continue;

      const labor = req.laborType;
      const units = quantity * req.quantityMultiplier;
      
      let laborCost = labor.baseRate;
      
      if (labor.perUnitRate) {
        laborCost += units * labor.perUnitRate;
      }
      
      if (labor.hourlyRate && labor.estimatedHours) {
        laborCost += labor.hourlyRate * labor.estimatedHours * units;
      }
      
      laborCost += req.additionalCost;
      
      installationCost += laborCost;
      
      installationBreakdown.push({
        laborType: labor.name,
        laborCode: labor.code,
        baseRate: labor.baseRate,
        perUnitRate: labor.perUnitRate,
        hourlyRate: labor.hourlyRate,
        estimatedHours: labor.estimatedHours,
        units: units,
        cost: laborCost,
      });
    }
  }

  // Apply complexity factors if provided
  let complexityMultiplier = 1.0;
  let complexityAdditionalCost = 0;

  if (options?.complexityFactors && options.complexityFactors.length > 0) {
    const factors = await prisma.installationComplexityFactor.findMany({
      where: {
        id: { in: options.complexityFactors },
        isActive: true,
      },
    });

    for (const factor of factors) {
      if (factor.multiplier) {
        complexityMultiplier *= factor.multiplier;
      }
      if (factor.fixedCost) {
        complexityAdditionalCost += factor.fixedCost;
      }
    }
  }

  // Apply complexity to installation cost
  installationCost = (installationCost * complexityMultiplier) + complexityAdditionalCost;

  return {
    productCost,
    installationCost,
    totalCost: productCost + installationCost,
    breakdown: {
      unitPrice,
      quantity,
      productTotal: productCost,
      installationTotal: installationCost,
      installationBreakdown,
      complexityMultiplier,
      complexityAdditionalCost,
    },
    supplier: {
      id: supplier.supplierId,
      unitCost: supplier.unitCost,
      retailPrice: supplier.retailPrice,
      markupPercent: supplier.markupPercent,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export async function getProductById(productId: string) {
  return await prisma.product.findUnique({
    where: { id: productId },
    include: {
      SupplierProduct: {
        where: { isActive: true },
        include: {
          supplier: true,
        },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
  });
}

export async function getProductByOldBrandId(oldBrandId: string, productType: 'PANEL' | 'BATTERY' | 'INVERTER') {
  return await prisma.product.findFirst({
    where: {
      productType,
      migratedFromBrandId: oldBrandId,
    },
    include: {
      SupplierProduct: {
        where: { isActive: true },
      },
      installationReqs: {
        include: {
          laborType: true,
        },
      },
    },
  });
}
