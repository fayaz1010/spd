
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemPricingData {
  solarCostPerKw: number;
  panelWattage: number;
  panelBrand: string;
  inverterBrand: string;
  installationFee: number;
  batteryCosts: Record<string, number>;
  addons: Record<string, { name: string; description: string; cost: number }>;
}

export interface RebateCalculation {
  federalSRES: number;
  federalBattery: number;
  waBatteryScheme: number;
  totalRebates: number;
}

export async function getActivePricing(): Promise<SystemPricingData> {
  // Get solar pricing
  const solarPricing = await prisma.solarPricing.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
  });

  if (!solarPricing) {
    throw new Error('No active solar pricing found. Please configure pricing in admin panel.');
  }

  // Get battery pricing
  const batteries = await prisma.batteryPricing.findMany({
    where: { active: true },
    orderBy: { capacityKwh: 'asc' },
  });

  const batteryCosts: Record<string, number> = { '0': 0 };
  batteries.forEach((battery) => {
    batteryCosts[battery.capacityKwh.toString()] = battery.cost;
  });

  // Get addon pricing
  const addonsData = await prisma.addonPricing.findMany({
    where: { active: true },
  });

  const addons: Record<string, { name: string; description: string; cost: number }> = {};
  addonsData.forEach((addon) => {
    addons[addon.addonId] = {
      name: addon.name,
      description: addon.description,
      cost: addon.cost,
    };
  });

  return {
    solarCostPerKw: solarPricing.costPerKw,
    panelWattage: solarPricing.panelWattage,
    panelBrand: solarPricing.panelBrand,
    inverterBrand: solarPricing.inverterBrand,
    installationFee: solarPricing.installationFee,
    batteryCosts,
    addons,
  };
}

export async function calculateRebatesFromDB(
  systemSizeKw: number,
  batterySizeKwh: number,
  batteryCost: number,
  solarCost?: number,
  totalCost?: number,
  panelCount?: number
): Promise<RebateCalculation> {
  const rebates = await prisma.rebateConfig.findMany({
    where: { active: true },
  });

  let federalSRES = 0;
  let federalBattery = 0;
  let waBatteryScheme = 0;

  // Import formula engine dynamically
  const { evaluateFormula } = await import('./formula-engine');

  rebates.forEach((rebate) => {
    let calculatedAmount = 0;

    // Check if formula is provided and use formula evaluation
    if (rebate.formula && rebate.calculationType === 'formula') {
      const result = evaluateFormula(rebate.formula, {
        systemSizeKw,
        batterySizeKwh,
        batteryCost,
        solarCost: solarCost || 0,
        totalCost: totalCost || 0,
        panelCount: panelCount || 0,
      });

      if (result.success && result.value !== undefined) {
        calculatedAmount = result.value;
        // Apply max amount if specified
        if (rebate.maxAmount) {
          calculatedAmount = Math.min(calculatedAmount, rebate.maxAmount);
        }
      } else {
        console.error(`Formula evaluation failed for rebate ${rebate.name}:`, result.error);
        calculatedAmount = 0;
      }
    } else {
      // Traditional calculation methods
      switch (rebate.calculationType) {
        case 'per_kw':
          calculatedAmount = systemSizeKw * rebate.value;
          break;

        case 'percentage':
          if (batterySizeKwh > 0) {
            calculatedAmount = batteryCost * (rebate.value / 100);
          }
          break;

        case 'per_kwh':
          if (batterySizeKwh > 0) {
            calculatedAmount = batterySizeKwh * rebate.value;
          }
          break;
      }

      // Apply max amount if specified
      if (rebate.maxAmount) {
        calculatedAmount = Math.min(calculatedAmount, rebate.maxAmount);
      }
    }

    // Map to the appropriate rebate category
    switch (rebate.type) {
      case 'federal_sres':
        federalSRES += calculatedAmount;
        break;

      case 'federal_battery':
        federalBattery += calculatedAmount;
        break;

      case 'wa_battery':
        waBatteryScheme += calculatedAmount;
        break;
    }
  });

  return {
    federalSRES,
    federalBattery,
    waBatteryScheme,
    totalRebates: federalSRES + federalBattery + waBatteryScheme,
  };
}
