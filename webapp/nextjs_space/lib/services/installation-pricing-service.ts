import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface InstallationCalculationParams {
  systemSizeKw: number;
  panelCount: number;
  batterySizeKwh?: number;
  selectedAddons?: Array<{
    addonId: string;
    name: string;
    cost: number;
    installationCost?: number;
  }>;
  roofType?: 'tile' | 'metal' | 'flat';
  propertyType?: 'house' | 'townhouse' | 'apartment';
  stories?: number;
  difficultAccess?: boolean;
  requiresScaffolding?: boolean;
  hasAsbestos?: boolean;
}

export interface InstallationBreakdown {
  // Base costs
  baseCalloutFee: number;
  
  // Solar components
  panelInstallation: number;
  railingInstallation: number;
  inverterInstallation: number;
  batteryInstallation: number;
  cablingInstallation: number;
  commissioning: number;
  
  // Addon installations
  addonInstallations: Array<{
    name: string;
    cost: number;
  }>;
  addonInstallationTotal: number;
  
  // Subtotals
  solarInstallSubtotal: number;
  baseSubtotal: number;
  
  // Complexity adjustments
  roofTypeMultiplier: number;
  roofTypeAdjustment: number;
  storyMultiplier: number;
  storyAdjustment: number;
  accessMultiplier: number;
  accessAdjustment: number;
  
  // Fixed additions
  scaffoldingCost: number;
  asbestosCost: number;
  
  // Final total
  totalInstallationCost: number;
  
  // Breakdown for display
  itemizedBreakdown: Array<{
    category: string;
    description: string;
    quantity?: number;
    unitCost?: number;
    total: number;
  }>;
}

/**
 * Get active installation pricing configuration
 */
export async function getInstallationPricing(region: string = 'WA') {
  const pricing = await prisma.installationPricing.findFirst({
    where: {
      region,
      active: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!pricing) {
    throw new Error('Installation pricing not configured');
  }

  return pricing;
}

/**
 * Calculate installation cost with detailed breakdown
 */
export async function calculateInstallationCost(
  params: InstallationCalculationParams
): Promise<InstallationBreakdown> {
  const pricing = await getInstallationPricing();

  // Calculate base solar installation components
  const baseCalloutFee = pricing.baseCalloutFee;
  
  const panelInstallation = params.panelCount * pricing.panelInstallPerUnit;
  
  const railingMeters = params.systemSizeKw * pricing.avgRailingPerKw;
  const railingInstallation = railingMeters * pricing.railingPerMeter;
  
  const inverterInstallation = pricing.inverterInstall;
  
  const batteryInstallation = params.batterySizeKwh
    ? pricing.batteryInstallBase + (params.batterySizeKwh * pricing.batteryInstallPerKwh)
    : 0;
  
  const cablingMeters = params.systemSizeKw * pricing.avgCablingPerKw;
  const cablingInstallation = cablingMeters * pricing.cablingPerMeter;
  
  const commissioning = pricing.commissioningFee;

  // Calculate addon installations
  const addonInstallations: Array<{ name: string; cost: number }> = [];
  let addonInstallationTotal = 0;

  if (params.selectedAddons) {
    for (const addon of params.selectedAddons) {
      if (addon.installationCost && addon.installationCost > 0) {
        addonInstallations.push({
          name: addon.name,
          cost: addon.installationCost,
        });
        addonInstallationTotal += addon.installationCost;
      }
    }
  }

  // Calculate subtotals
  const solarInstallSubtotal =
    baseCalloutFee +
    panelInstallation +
    railingInstallation +
    inverterInstallation +
    batteryInstallation +
    cablingInstallation +
    commissioning;

  const baseSubtotal = solarInstallSubtotal + addonInstallationTotal;

  // Apply complexity multipliers
  let roofTypeMultiplier = 1.0;
  if (params.roofType === 'tile') {
    roofTypeMultiplier = pricing.tileRoofMultiplier;
  } else if (params.roofType === 'metal') {
    roofTypeMultiplier = pricing.metalRoofMultiplier;
  } else if (params.roofType === 'flat') {
    roofTypeMultiplier = pricing.flatRoofMultiplier;
  }
  const roofTypeAdjustment = baseSubtotal * (roofTypeMultiplier - 1);

  let storyMultiplier = 1.0;
  if (params.stories && params.stories >= 2) {
    storyMultiplier = pricing.twoStoryMultiplier;
  }
  const storyAdjustment = (baseSubtotal + roofTypeAdjustment) * (storyMultiplier - 1);

  let accessMultiplier = 1.0;
  if (params.difficultAccess) {
    accessMultiplier = pricing.difficultAccessMult;
  }
  const accessAdjustment = (baseSubtotal + roofTypeAdjustment + storyAdjustment) * (accessMultiplier - 1);

  // Fixed additions
  const scaffoldingCost = params.requiresScaffolding ? pricing.scaffoldingRequired : 0;
  const asbestosCost = params.hasAsbestos ? pricing.asbestosRemoval : 0;

  // Calculate final total
  const totalInstallationCost = Math.round(
    baseSubtotal +
    roofTypeAdjustment +
    storyAdjustment +
    accessAdjustment +
    scaffoldingCost +
    asbestosCost
  );

  // Create itemized breakdown for display
  const itemizedBreakdown: Array<{
    category: string;
    description: string;
    quantity?: number;
    unitCost?: number;
    total: number;
  }> = [
    {
      category: 'Base',
      description: 'Callout & Setup Fee',
      total: baseCalloutFee,
    },
    {
      category: 'Solar',
      description: 'Panel Installation',
      quantity: params.panelCount,
      unitCost: pricing.panelInstallPerUnit,
      total: panelInstallation,
    },
    {
      category: 'Solar',
      description: 'Railing & Mounting',
      quantity: Math.round(railingMeters),
      unitCost: pricing.railingPerMeter,
      total: Math.round(railingInstallation),
    },
    {
      category: 'Solar',
      description: 'Inverter Installation',
      total: inverterInstallation,
    },
  ];

  if (batteryInstallation > 0) {
    itemizedBreakdown.push({
      category: 'Battery',
      description: 'Battery Installation',
      quantity: params.batterySizeKwh,
      unitCost: pricing.batteryInstallPerKwh,
      total: Math.round(batteryInstallation),
    });
  }

  itemizedBreakdown.push(
    {
      category: 'Solar',
      description: 'Cabling & Wiring',
      quantity: Math.round(cablingMeters),
      unitCost: pricing.cablingPerMeter,
      total: Math.round(cablingInstallation),
    },
    {
      category: 'Solar',
      description: 'Commissioning & Testing',
      total: commissioning,
    }
  );

  // Add addon installations
  for (const addon of addonInstallations) {
    itemizedBreakdown.push({
      category: 'Addon',
      description: `${addon.name} Installation`,
      total: addon.cost,
    });
  }

  // Add complexity adjustments
  if (roofTypeAdjustment > 0) {
    itemizedBreakdown.push({
      category: 'Complexity',
      description: `${params.roofType?.charAt(0).toUpperCase()}${params.roofType?.slice(1)} Roof Adjustment (${Math.round((roofTypeMultiplier - 1) * 100)}%)`,
      total: Math.round(roofTypeAdjustment),
    });
  }

  if (storyAdjustment > 0) {
    itemizedBreakdown.push({
      category: 'Complexity',
      description: `Two-Story Adjustment (${Math.round((storyMultiplier - 1) * 100)}%)`,
      total: Math.round(storyAdjustment),
    });
  }

  if (accessAdjustment > 0) {
    itemizedBreakdown.push({
      category: 'Complexity',
      description: `Difficult Access Adjustment (${Math.round((accessMultiplier - 1) * 100)}%)`,
      total: Math.round(accessAdjustment),
    });
  }

  if (scaffoldingCost > 0) {
    itemizedBreakdown.push({
      category: 'Additional',
      description: 'Scaffolding Required',
      total: scaffoldingCost,
    });
  }

  if (asbestosCost > 0) {
    itemizedBreakdown.push({
      category: 'Additional',
      description: 'Asbestos Removal',
      total: asbestosCost,
    });
  }

  return {
    baseCalloutFee,
    panelInstallation,
    railingInstallation,
    inverterInstallation,
    batteryInstallation,
    cablingInstallation,
    commissioning,
    addonInstallations,
    addonInstallationTotal,
    solarInstallSubtotal,
    baseSubtotal,
    roofTypeMultiplier,
    roofTypeAdjustment,
    storyMultiplier,
    storyAdjustment,
    accessMultiplier,
    accessAdjustment,
    scaffoldingCost,
    asbestosCost,
    totalInstallationCost,
    itemizedBreakdown,
  };
}

/**
 * Get installation cost for a specific addon by addonId
 */
export async function getAddonInstallationCost(addonId: string): Promise<number> {
  const addon = await prisma.addonPricing.findUnique({
    where: { addonId },
    select: { installationCost: true },
  });

  return addon?.installationCost || 0;
}

/**
 * Update installation pricing
 */
export async function updateInstallationPricing(
  id: string,
  data: Partial<{
    baseCalloutFee: number;
    hourlyRate: number;
    panelInstallPerUnit: number;
    railingPerMeter: number;
    inverterInstall: number;
    batteryInstallBase: number;
    batteryInstallPerKwh: number;
    cablingPerMeter: number;
    commissioningFee: number;
    evCharger7kwInstall: number;
    evCharger22kwInstall: number;
    hotWaterInstall: number;
    monitoringInstall: number;
    tileRoofMultiplier: number;
    metalRoofMultiplier: number;
    twoStoryMultiplier: number;
    difficultAccessMult: number;
    asbestosRemoval: number;
    scaffoldingRequired: number;
  }>
) {
  return await prisma.installationPricing.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}
