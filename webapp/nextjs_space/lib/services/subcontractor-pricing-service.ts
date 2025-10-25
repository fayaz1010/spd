import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SubcontractorPricingParams {
  systemSizeKw: number;
  batterySizeKwh: number;
}

interface SubcontractorPricingResult {
  subcontractorId: string;
  companyName: string;
  solarCost: number;
  batteryCost: number;
  totalCost: number;
  perWattRate: number;
  batteryBaseRate: number;
  batteryPerKwhRate: number;
  systemWatts: number;
}

/**
 * Calculate subcontractor installation cost
 * Finds the cheapest active subcontractor and calculates cost based on:
 * - Solar: per-watt rate (e.g., $0.20-0.25 per watt)
 * - Battery: base rate + per kWh rate (e.g., $800 base + $50/kWh)
 */
export async function calculateSubcontractorCost(
  params: SubcontractorPricingParams
): Promise<SubcontractorPricingResult> {
  const { systemSizeKw, batterySizeKwh } = params;

  // Fetch all active subcontractors with per-watt rates
  const subcontractors = await prisma.subcontractor.findMany({
    where: {
      isActive: true,
      perWattRate: { not: null },
    },
    orderBy: {
      perWattRate: 'asc', // Cheapest first
    },
  });

  if (subcontractors.length === 0) {
    throw new Error('No active subcontractors with per-watt rates found');
  }

  // Get the cheapest subcontractor
  const cheapestSubbie = subcontractors[0];

  // Calculate solar installation cost
  const systemWatts = systemSizeKw * 1000;
  const solarCost = systemWatts * (cheapestSubbie.perWattRate || 0);

  // Calculate battery installation cost
  let batteryCost = 0;
  if (batterySizeKwh > 0) {
    const baseRate = cheapestSubbie.batteryBaseRate || 800; // Default $800
    const perKwhRate = cheapestSubbie.batteryPerKwhRate || 50; // Default $50/kWh
    batteryCost = baseRate + (batterySizeKwh * perKwhRate);
  }

  const totalCost = solarCost + batteryCost;

  return {
    subcontractorId: cheapestSubbie.id,
    companyName: cheapestSubbie.companyName,
    solarCost,
    batteryCost,
    totalCost,
    perWattRate: cheapestSubbie.perWattRate || 0,
    batteryBaseRate: cheapestSubbie.batteryBaseRate || 800,
    batteryPerKwhRate: cheapestSubbie.batteryPerKwhRate || 50,
    systemWatts,
  };
}

/**
 * Get all subcontractor rates for comparison
 */
export async function getAllSubcontractorRates() {
  return await prisma.subcontractor.findMany({
    where: {
      isActive: true,
      perWattRate: { not: null },
    },
    select: {
      id: true,
      companyName: true,
      perWattRate: true,
      batteryBaseRate: true,
      batteryPerKwhRate: true,
    },
    orderBy: {
      perWattRate: 'asc',
    },
  });
}
