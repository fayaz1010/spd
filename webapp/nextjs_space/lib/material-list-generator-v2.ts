/**
 * Material List Generator V2
 * 
 * Integrates with accessory calculator for dynamic accessory calculation
 * based on configurable rules
 */

import { calculateAccessories, type JobSpecs } from './accessory-calculator';

interface JobWithComponents {
  id: string;
  systemSize: number;
  panelCount: number;
  batteryCapacity: number | null;
  inverterModel: string;
  selectedComponents: any;
  roofType?: string;
  isCommercial?: boolean;
}

export interface MaterialItem {
  category: string;
  type: string;
  brand: string;
  model: string;
  quantity: number;
  unit: string;
  notes?: string;
  // Product IDs for FK lookup
  panelBrandId?: string;
  batteryBrandId?: string;
  inverterBrandId?: string;
  // Accessory info
  accessoryRuleId?: string;
  supplierProductId?: string;
  unitCost?: number;
  totalCost?: number;
}

export async function generateMaterialList(job: JobWithComponents): Promise<MaterialItem[]> {
  const materials: MaterialItem[] = [];
  const components = job.selectedComponents || {};

  // 1. Solar Panels
  if (components.panel) {
    materials.push({
      category: "Panel",
      type: "PV Module",
      brand: components.panel.manufacturer || components.panel.brand,
      model: components.panel.model || components.panel.name,
      quantity: job.panelCount,
      unit: "pcs",
      panelBrandId: components.panel.id,
    });
  }

  // 2. Battery (if applicable)
  if (job.batteryCapacity && job.batteryCapacity > 0 && components.battery) {
    materials.push({
      category: "Battery",
      type: "Battery Storage",
      brand: components.battery.manufacturer || components.battery.brand,
      model: components.battery.model || components.battery.name,
      quantity: 1,
      unit: "unit",
      batteryBrandId: components.battery.id,
    });
  }

  // 3. Inverter
  if (components.inverter) {
    materials.push({
      category: "Inverter",
      type: "Solar Inverter",
      brand: components.inverter.manufacturer || components.inverter.brand,
      model: components.inverter.model || components.inverter.name,
      quantity: 1,
      unit: "unit",
      inverterBrandId: components.inverter.id,
    });
  }

  // 4. Calculate Accessories using configurable rules
  const jobSpecs: JobSpecs = {
    systemSize: job.systemSize,
    panelCount: job.panelCount,
    batteryCapacity: job.batteryCapacity || undefined,
    hasBattery: !!(job.batteryCapacity && job.batteryCapacity > 0),
    roofType: job.roofType,
  };

  const accessories = await calculateAccessories(jobSpecs, {
    includeOptional: false, // Only required accessories
  });

  // Add accessories to materials list
  for (const accessory of accessories) {
    materials.push({
      category: accessory.category,
      type: accessory.ruleName,
      brand: accessory.brand || 'Standard',
      model: accessory.model || accessory.ruleName,
      quantity: accessory.quantity,
      unit: accessory.unit,
      notes: accessory.calculationDetails,
      accessoryRuleId: accessory.ruleId,
      supplierProductId: accessory.supplierProductId || undefined,
      unitCost: accessory.unitCost || undefined,
      totalCost: accessory.totalCost,
    });
  }

  return materials;
}

// Export the old version for backward compatibility
export function generateMaterialListSync(job: JobWithComponents): MaterialItem[] {
  const materials: MaterialItem[] = [];
  const components = job.selectedComponents || {};

  // 1. Solar Panels
  if (components.panel) {
    materials.push({
      category: "Panel",
      type: "PV Module",
      brand: components.panel.manufacturer || components.panel.brand,
      model: components.panel.model || components.panel.name,
      quantity: job.panelCount,
      unit: "pcs",
      panelBrandId: components.panel.id,
    });
  }

  // 2. Battery
  if (job.batteryCapacity && job.batteryCapacity > 0 && components.battery) {
    materials.push({
      category: "Battery",
      type: "Battery Storage",
      brand: components.battery.manufacturer || components.battery.brand,
      model: components.battery.model || components.battery.name,
      quantity: 1,
      unit: "unit",
      batteryBrandId: components.battery.id,
    });
  }

  // 3. Inverter
  if (components.inverter) {
    materials.push({
      category: "Inverter",
      type: "Solar Inverter",
      brand: components.inverter.manufacturer || components.inverter.brand,
      model: components.inverter.model || components.inverter.name,
      quantity: 1,
      unit: "unit",
      inverterBrandId: components.inverter.id,
    });
  }

  return materials;
}
