import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BatterySizingParams {
  nighttimeConsumption: number; // kWh (10pm-6am only)
  eveningConsumption: number;   // kWh (6pm-10pm)
  hasEv: boolean;
  evChargingTime?: string;
  evConsumption?: number;
}

interface BatterySizingResult {
  minimum: number;
  recommended: number;
  optimal: number;
  explanation: string;
  formula: string;
}

/**
 * Calculate battery size using database-stored formulas
 * 
 * CORRECT LOGIC:
 * - Battery ONLY needs to cover nighttime (10pm-6am) when no solar
 * - Evening (6pm-10pm) can use solar + battery charging
 * - Don't over-inflate with excessive buffers
 */
export async function calculateBatterySize(params: BatterySizingParams): Promise<BatterySizingResult> {
  try {
    // Fetch battery sizing config from database
    const batterySizingConfig = await prisma.consumptionAssumption.findFirst({
      where: {
        assumptionType: 'battery_sizing',
        active: true,
      },
    });

    // Default values if not in database
    const depthOfDischarge = batterySizingConfig?.batteryDepthOfDischarge || 0.9; // 90% DoD for modern lithium batteries
    const safetyBuffer = batterySizingConfig?.batterySafetyBuffer || 1.1; // 10% safety buffer
    const roundingIncrement = batterySizingConfig?.batteryRoundingIncrement || 5; // Round to nearest 5kWh

    // Calculate actual nighttime needs
    let actualNighttimeNeeds = params.nighttimeConsumption;

    // If EV charges at night, add that to nighttime needs
    if (params.hasEv && params.evChargingTime === 'night' && params.evConsumption) {
      actualNighttimeNeeds += params.evConsumption;
    }

    // Apply safety buffer
    const usableCapacityNeeded = actualNighttimeNeeds * safetyBuffer;

    // Account for depth of discharge
    const nominalCapacityNeeded = usableCapacityNeeded / depthOfDischarge;

    // Round to nearest increment
    const roundToNearest = (value: number, increment: number) => {
      return Math.ceil(value / increment) * increment;
    };

    const minimum = roundToNearest(nominalCapacityNeeded, roundingIncrement);
    const recommended = minimum; // No artificial inflation
    const optimal = minimum + roundingIncrement; // Just one step up for extra autonomy

    const explanation = `
Battery sized for nighttime needs (10pm-6am):
- Nighttime consumption: ${actualNighttimeNeeds.toFixed(1)} kWh
- With ${((safetyBuffer - 1) * 100).toFixed(0)}% safety buffer: ${usableCapacityNeeded.toFixed(1)} kWh usable
- Accounting for ${(depthOfDischarge * 100).toFixed(0)}% DoD: ${nominalCapacityNeeded.toFixed(1)} kWh nominal
- Rounded to nearest ${roundingIncrement}kWh: ${minimum} kWh
    `.trim();

    const formula = `ceil((nighttime × ${safetyBuffer}) / ${depthOfDischarge} / ${roundingIncrement}) × ${roundingIncrement}`;

    return {
      minimum: Math.max(minimum, 10), // Minimum 10kWh for system stability
      recommended: Math.max(recommended, 10),
      optimal: Math.max(optimal, 13),
      explanation,
      formula,
    };

  } catch (error) {
    console.error('Error calculating battery size from database:', error);
    
    // Fallback calculation
    const nighttimeNeeds = params.nighttimeConsumption;
    const usableCapacity = nighttimeNeeds * 1.1; // 10% buffer
    const nominalCapacity = usableCapacity / 0.9; // 90% DoD
    const minimum = Math.ceil(nominalCapacity / 5) * 5;
    
    return {
      minimum: Math.max(minimum, 10),
      recommended: Math.max(minimum, 10),
      optimal: Math.max(minimum + 5, 13),
      explanation: 'Fallback calculation (database unavailable)',
      formula: 'ceil((nighttime × 1.1) / 0.9 / 5) × 5',
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Save battery sizing configuration to database
 */
export async function saveBatterySizingConfig(config: {
  depthOfDischarge: number;
  safetyBuffer: number;
  roundingIncrement: number;
  description?: string;
}) {
  try {
    // Delete existing battery sizing config
    await prisma.consumptionAssumption.deleteMany({
      where: { assumptionType: 'battery_sizing' },
    });

    // Create new config
    const result = await prisma.consumptionAssumption.create({
      data: {
        assumptionType: 'battery_sizing',
        region: 'WA',
        active: true,
        batteryDepthOfDischarge: config.depthOfDischarge,
        batterySafetyBuffer: config.safetyBuffer,
        batteryRoundingIncrement: config.roundingIncrement,
        notes: config.description || 'Battery sizing configuration',
        updatedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error('Error saving battery sizing config:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
