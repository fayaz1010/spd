/**
 * Unified Installation Cost Calculator
 * 
 * Replaces fragmented systems:
 * - InstallationPricing
 * - InstallationComplexityFactor
 * - InstallationLaborType
 * - ExtraCost
 * 
 * Single source of truth for all installation costs
 */

import { prisma } from './db';

export interface InstallationJobSpecs {
  // System
  systemSize: number;        // kW
  panelCount: number;
  hasBattery: boolean;
  batteryCapacity?: number;  // kWh
  batteryType?: 'dc_coupled' | 'ac_coupled';
  isRetrofit?: boolean;
  
  // Property details
  storeys: number;
  roofType?: 'tile' | 'metal' | 'klip_lok' | 'slate' | 'colorbond';
  roofPitch?: 'flat' | 'standard' | 'steep_30_40' | 'steep_40_50';
  orientation?: 'portrait' | 'landscape';
  rakedCeilings?: boolean;
  
  // System details
  phases: 1 | 3;
  hasOptimisers?: boolean;
  additionalInverters?: number;
  splits?: number;
  
  // Optional requirements
  needsSiteInspection?: boolean;
  needsSmartMeter?: boolean;
  needsSystemRemoval?: boolean;
  existingPanelCount?: number;
  distanceFromHQ?: number; // km from Canning Vale
  needsBackupCircuits?: boolean;
  backupCircuitCount?: number;
  
  // Provider preference
  preferredProvider?: 'INTERNAL' | 'SUBCONTRACTOR';
  providerId?: string;
}

export interface InstallationCostLineItem {
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  calculation: string;
  provider: string;
  providerType: string;
  isOptional: boolean;
}

export interface InstallationCostResult {
  items: InstallationCostLineItem[];
  subtotal: number;
  gst: number;
  total: number;
  breakdown: {
    base: number;
    complexity: number;
    labor: number;
    equipment: number;
    rental: number;
    regulatory: number;
  };
  provider: {
    internal: number;
    subcontractor: number;
    rental: number;
  };
}

/**
 * Check if a cost item applies to the job
 */
function appliesToJob(item: any, specs: InstallationJobSpecs): boolean {
  // System size range
  if (item.minSystemSize && specs.systemSize < item.minSystemSize) return false;
  if (item.maxSystemSize && specs.systemSize > item.maxSystemSize) return false;
  
  // Roof type
  if (item.roofType && specs.roofType !== item.roofType) return false;
  
  // Roof pitch
  if (item.roofPitch && specs.roofPitch !== item.roofPitch) return false;
  
  // Orientation
  if (item.orientation && specs.orientation !== item.orientation) return false;
  
  // Storeys
  if (item.storeys && specs.storeys !== item.storeys) return false;
  
  // Phases
  if (item.phases && specs.phases !== item.phases) return false;
  
  // Optimisers
  if (item.hasOptimisers !== null && item.hasOptimisers !== specs.hasOptimisers) return false;
  
  // Battery
  if (item.hasBattery !== null && item.hasBattery !== specs.hasBattery) return false;
  if (item.batteryType && specs.batteryType !== item.batteryType) return false;
  if (item.isRetrofit !== null && item.isRetrofit !== specs.isRetrofit) return false;
  
  return true;
}

/**
 * Calculate quantity for a cost item
 */
function calculateQuantity(item: any, specs: InstallationJobSpecs): number {
  let quantity = 0;
  
  switch (item.calculationType) {
    case 'FIXED':
      quantity = 1;
      break;
      
    case 'PER_WATT':
      quantity = specs.systemSize * 1000; // Convert kW to watts
      break;
      
    case 'PER_PANEL':
      quantity = specs.panelCount;
      break;
      
    case 'PER_KW':
      quantity = specs.systemSize;
      break;
      
    case 'PER_KWH':
      quantity = specs.batteryCapacity || 0;
      break;
      
    case 'PER_UNIT':
      // For items like additional inverters, splits
      if (item.code.includes('INVERTER')) {
        quantity = specs.additionalInverters || 0;
      } else if (item.code.includes('SPLIT')) {
        quantity = specs.splits || 0;
      } else {
        quantity = 1;
      }
      break;
      
    case 'HOURLY':
      quantity = item.estimatedHours || 0;
      break;
      
    case 'FORMULA':
      if (item.formula) {
        quantity = evaluateFormula(item.formula, specs);
      }
      break;
      
    default:
      quantity = 1;
  }
  
  // Apply multiplier
  quantity = quantity * item.multiplier;
  
  // Apply min/max constraints
  if (quantity < item.minQuantity) quantity = item.minQuantity;
  if (item.maxQuantity && quantity > item.maxQuantity) quantity = item.maxQuantity;
  
  return Math.round(quantity * 100) / 100; // Round to 2 decimals
}

/**
 * Evaluate formula safely
 */
function evaluateFormula(formula: string, specs: InstallationJobSpecs): number {
  try {
    const context = {
      systemSize: specs.systemSize,
      panelCount: specs.panelCount,
      batteryCapacity: specs.batteryCapacity || 0,
      storeys: specs.storeys,
      distanceFromHQ: specs.distanceFromHQ || 0,
      additionalInverters: specs.additionalInverters || 0,
      splits: specs.splits || 0,
      CEIL: Math.ceil,
      FLOOR: Math.floor,
      ROUND: Math.round,
      MAX: Math.max,
      MIN: Math.min,
    };
    
    let evalFormula = formula;
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evalFormula = evalFormula.replace(regex, `context.${key}`);
    });
    
    const result = new Function('context', `return ${evalFormula}`)(context);
    return typeof result === 'number' ? result : 0;
  } catch (error) {
    console.error('Formula evaluation error:', error, 'Formula:', formula);
    return 0;
  }
}

/**
 * Get calculation details for display
 */
function getCalculationDetails(
  item: any,
  specs: InstallationJobSpecs,
  quantity: number
): string {
  switch (item.calculationType) {
    case 'FIXED':
      return 'Fixed rate';
      
    case 'PER_WATT':
      return `${specs.systemSize}kW × 1000 × $${item.baseRate}`;
      
    case 'PER_PANEL':
      return `${specs.panelCount} panels × $${item.baseRate}`;
      
    case 'PER_KW':
      return `${specs.systemSize}kW × $${item.baseRate}`;
      
    case 'PER_KWH':
      return `${specs.batteryCapacity}kWh × $${item.baseRate}`;
      
    case 'PER_UNIT':
      return `${quantity} units × $${item.baseRate}`;
      
    case 'HOURLY':
      return `${item.estimatedHours}hrs × $${item.baseRate}`;
      
    case 'FORMULA':
      return `Formula: ${item.formula} = ${quantity}`;
      
    default:
      return 'Standard rate';
  }
}

/**
 * Get unit label for display
 */
function getUnitLabel(calculationType: string): string {
  switch (calculationType) {
    case 'PER_WATT': return 'watts';
    case 'PER_PANEL': return 'panels';
    case 'PER_KW': return 'kW';
    case 'PER_KWH': return 'kWh';
    case 'PER_UNIT': return 'units';
    case 'HOURLY': return 'hours';
    default: return 'each';
  }
}

/**
 * Main calculator function
 */
export async function calculateInstallationCost(
  specs: InstallationJobSpecs
): Promise<InstallationCostResult> {
  // Fetch applicable cost items
  const costItems = await prisma.installationCostItem.findMany({
    where: {
      isActive: true,
      // Filter by provider if specified
      ...(specs.providerId ? { providerId: specs.providerId } : {}),
      ...(specs.preferredProvider ? { providerType: specs.preferredProvider } : {}),
    },
    orderBy: [
      { priority: 'desc' },
      { sortOrder: 'asc' },
    ],
  });
  
  const items: InstallationCostLineItem[] = [];
  
  for (const item of costItems) {
    // Check if item applies to this job
    if (!appliesToJob(item, specs)) continue;
    
    // SKIP OPTIONAL ITEMS (unless explicitly requested in future)
    // Optional items should only be added when customer selects them
    if (item.isOptional && !item.defaultIncluded) continue;
    
    // Calculate quantity
    const quantity = calculateQuantity(item, specs);
    if (quantity === 0) continue;
    
    // Calculate cost
    const unitCost = item.baseRate;
    const totalCost = unitCost * quantity;
    
    items.push({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity,
      unit: getUnitLabel(item.calculationType),
      unitCost,
      totalCost,
      calculation: getCalculationDetails(item, specs, quantity),
      provider: item.providerId || 'INTERNAL',
      providerType: item.providerType || 'INTERNAL',
      isOptional: item.isOptional,
    });
  }
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;
  
  // Breakdown by category
  const breakdown = {
    base: items.filter(i => i.category === 'BASE').reduce((s, i) => s + i.totalCost, 0),
    complexity: items.filter(i => i.category === 'COMPLEXITY').reduce((s, i) => s + i.totalCost, 0),
    labor: items.filter(i => i.category === 'LABOR').reduce((s, i) => s + i.totalCost, 0),
    equipment: items.filter(i => i.category === 'EQUIPMENT').reduce((s, i) => s + i.totalCost, 0),
    rental: items.filter(i => i.category === 'RENTAL').reduce((s, i) => s + i.totalCost, 0),
    regulatory: items.filter(i => i.category === 'REGULATORY').reduce((s, i) => s + i.totalCost, 0),
  };
  
  // Breakdown by provider
  const provider = {
    internal: items.filter(i => i.providerType === 'INTERNAL').reduce((s, i) => s + i.totalCost, 0),
    subcontractor: items.filter(i => i.providerType === 'SUBCONTRACTOR').reduce((s, i) => s + i.totalCost, 0),
    rental: items.filter(i => i.providerType === 'RENTAL').reduce((s, i) => s + i.totalCost, 0),
  };
  
  return {
    items,
    subtotal,
    gst,
    total,
    breakdown,
    provider,
  };
}

/**
 * Calculate for both internal and subcontractor to compare
 */
export async function calculateInstallationCostComparison(
  specs: InstallationJobSpecs
): Promise<{
  internal: InstallationCostResult;
  subcontractor: InstallationCostResult;
  savings: number;
  recommended: 'INTERNAL' | 'SUBCONTRACTOR';
}> {
  const internal = await calculateInstallationCost({
    ...specs,
    preferredProvider: 'INTERNAL',
  });
  
  const subcontractor = await calculateInstallationCost({
    ...specs,
    preferredProvider: 'SUBCONTRACTOR',
  });
  
  const savings = internal.total - subcontractor.total;
  const recommended = savings > 0 ? 'SUBCONTRACTOR' : 'INTERNAL';
  
  return {
    internal,
    subcontractor,
    savings: Math.abs(savings),
    recommended,
  };
}
