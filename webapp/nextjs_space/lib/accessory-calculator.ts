/**
 * Accessory Calculator Service
 * 
 * Calculates required accessories based on configurable rules
 * Supports multiple calculation types: FIXED, PER_PANEL, PER_KW, PER_BATTERY, FORMULA
 */

import { prisma } from './db';

export interface JobSpecs {
  systemSize: number;      // kW
  panelCount: number;
  batteryCapacity?: number; // kWh
  hasBattery: boolean;
  inverterType?: string;    // single-phase, 3-phase
  roofType?: string;        // tile, metal, etc.
  isGroundMount?: boolean;
  stories?: number;
}

export interface CalculatedAccessory {
  ruleId: string;
  ruleName: string;
  category: string;
  productType: string | null;
  quantity: number;
  unit: string;
  unitCost: number | null;
  totalCost: number;
  supplierProductId: string | null;
  supplierId: string | null;
  supplierName: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  notes: string | null;
  calculationDetails: string; // How quantity was calculated
}

/**
 * Evaluate a formula with job specs
 */
function evaluateFormula(formula: string, specs: JobSpecs): number {
  try {
    // Create safe context with only job specs
    const context = {
      panelCount: specs.panelCount,
      systemSize: specs.systemSize,
      batteryCapacity: specs.batteryCapacity || 0,
      hasBattery: specs.hasBattery,
      CEIL: Math.ceil,
      FLOOR: Math.floor,
      ROUND: Math.round,
      MAX: Math.max,
      MIN: Math.min,
    };

    // Replace variable names in formula
    let evalFormula = formula;
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evalFormula = evalFormula.replace(regex, `context.${key}`);
    });

    // Evaluate safely
    const result = new Function('context', `return ${evalFormula}`)(context);
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('Formula evaluation error:', error, 'Formula:', formula);
    return 0;
  }
}

/**
 * Calculate quantity for an accessory rule
 */
function calculateQuantity(
  rule: any,
  specs: JobSpecs
): { quantity: number; details: string } {
  let quantity = 0;
  let details = '';

  switch (rule.calculationType) {
    case 'FIXED':
      quantity = rule.baseQuantity;
      details = `Fixed quantity: ${quantity}`;
      break;

    case 'PER_PANEL':
      quantity = specs.panelCount * rule.multiplier + rule.baseQuantity;
      details = `${specs.panelCount} panels × ${rule.multiplier} + ${rule.baseQuantity}`;
      break;

    case 'PER_KW':
      quantity = specs.systemSize * rule.multiplier + rule.baseQuantity;
      details = `${specs.systemSize}kW × ${rule.multiplier} + ${rule.baseQuantity}`;
      break;

    case 'PER_BATTERY':
      if (specs.hasBattery && specs.batteryCapacity) {
        quantity = specs.batteryCapacity * rule.multiplier + rule.baseQuantity;
        details = `${specs.batteryCapacity}kWh × ${rule.multiplier} + ${rule.baseQuantity}`;
      } else {
        quantity = 0;
        details = 'No battery in system';
      }
      break;

    case 'FORMULA':
      if (rule.formula) {
        quantity = evaluateFormula(rule.formula, specs);
        details = `Formula: ${rule.formula} = ${quantity}`;
      }
      break;

    default:
      console.warn('Unknown calculation type:', rule.calculationType);
      details = 'Unknown calculation type';
  }

  // Apply rounding
  if (rule.roundUp && quantity > 0) {
    quantity = Math.ceil(quantity);
    details += ' (rounded up)';
  } else {
    quantity = Math.round(quantity);
  }

  // Apply min/max constraints
  if (quantity < rule.minQuantity) {
    details += ` → minimum ${rule.minQuantity}`;
    quantity = rule.minQuantity;
  }
  if (rule.maxQuantity && quantity > rule.maxQuantity) {
    details += ` → maximum ${rule.maxQuantity}`;
    quantity = rule.maxQuantity;
  }

  return { quantity, details };
}

/**
 * Calculate all accessories for a job
 */
export async function calculateAccessories(
  specs: JobSpecs,
  options: {
    includeOptional?: boolean;
    categoryFilter?: string[];
  } = {}
): Promise<CalculatedAccessory[]> {
  const { includeOptional = false, categoryFilter } = options;

  // Fetch active accessory rules
  const rules = await prisma.accessoryRule.findMany({
    where: {
      isActive: true,
      ...(categoryFilter ? { category: { in: categoryFilter } } : {}),
      ...(includeOptional ? {} : { isRequired: true }),
    },
    include: {
      products: {
        where: { isActive: true },
        include: {
          supplierProduct: {
            include: {
              supplier: true,
            },
          },
        },
        orderBy: {
          isPrimary: 'desc', // Primary products first
        },
      },
    },
    orderBy: {
      priority: 'desc', // Higher priority first
    },
  });

  const accessories: CalculatedAccessory[] = [];

  for (const rule of rules) {
    // Skip battery-specific accessories if no battery
    if (rule.productType === 'BATTERY' && !specs.hasBattery) {
      continue;
    }

    // Calculate quantity
    const { quantity, details } = calculateQuantity(rule, specs);

    // Skip if quantity is 0
    if (quantity <= 0) {
      continue;
    }

    // Get primary product or first available
    const primaryProduct = rule.products.find(p => p.isPrimary) || rule.products[0];

    let unitCost = null;
    let supplierProductId = null;
    let supplierId = null;
    let supplierName = null;
    let brand = null;
    let model = null;
    let sku = null;

    if (primaryProduct) {
      if (primaryProduct.supplierProduct) {
        unitCost = primaryProduct.supplierProduct.unitCost;
        supplierProductId = primaryProduct.supplierProduct.id;
        supplierId = primaryProduct.supplierProduct.supplierId;
        supplierName = primaryProduct.supplierProduct.supplier.name;
        brand = primaryProduct.supplierProduct.brand;
        model = primaryProduct.supplierProduct.model;
        sku = primaryProduct.supplierProduct.sku;
      } else {
        unitCost = primaryProduct.unitCost;
        brand = primaryProduct.brand;
        model = primaryProduct.model;
        sku = primaryProduct.sku;
      }
    }

    const totalCost = unitCost ? unitCost * quantity : 0;

    accessories.push({
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      productType: rule.productType,
      quantity,
      unit: primaryProduct?.unit || 'pcs',
      unitCost,
      totalCost,
      supplierProductId,
      supplierId,
      supplierName,
      brand,
      model,
      sku,
      notes: rule.notes,
      calculationDetails: details,
    });
  }

  return accessories;
}

/**
 * Get accessories grouped by supplier
 */
export async function calculateAccessoriesGroupedBySupplier(
  specs: JobSpecs,
  options: {
    includeOptional?: boolean;
    categoryFilter?: string[];
  } = {}
): Promise<Map<string, CalculatedAccessory[]>> {
  const accessories = await calculateAccessories(specs, options);

  const grouped = new Map<string, CalculatedAccessory[]>();

  for (const accessory of accessories) {
    const supplierId = accessory.supplierId || 'NO_SUPPLIER';
    if (!grouped.has(supplierId)) {
      grouped.set(supplierId, []);
    }
    grouped.get(supplierId)!.push(accessory);
  }

  return grouped;
}

/**
 * Get total cost of accessories
 */
export function getTotalAccessoryCost(accessories: CalculatedAccessory[]): number {
  return accessories.reduce((sum, acc) => sum + acc.totalCost, 0);
}

/**
 * Get accessories by category
 */
export function groupAccessoriesByCategory(
  accessories: CalculatedAccessory[]
): Map<string, CalculatedAccessory[]> {
  const grouped = new Map<string, CalculatedAccessory[]>();

  for (const accessory of accessories) {
    if (!grouped.has(accessory.category)) {
      grouped.set(accessory.category, []);
    }
    grouped.get(accessory.category)!.push(accessory);
  }

  return grouped;
}
