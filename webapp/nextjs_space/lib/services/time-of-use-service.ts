import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TimeOfUsePattern {
  daytime: number;      // Percentage (e.g., 0.30 for 30%)
  evening: number;      // Percentage (e.g., 0.45 for 45%)
  night: number;        // Percentage (e.g., 0.25 for 25%)
  description: string;
}

interface TimeOfUseBreakdown {
  daytime: number;      // kWh
  evening: number;      // kWh
  night: number;        // kWh
  solarHours: {
    summer: { start: string; end: string };
    winter: { start: string; end: string };
  };
  pattern: TimeOfUsePattern;
}

/**
 * Get time-of-use patterns from database
 * 
 * PERTH-SPECIFIC PATTERNS:
 * - Daytime (solar available): 30% of consumption
 * - Evening (6pm-10pm): 45% of consumption  
 * - Night (10pm-6am): 25% of consumption
 * 
 * SOLAR HOURS:
 * - Summer: 6am-7pm (13 hours)
 * - Winter: 7am-5:30pm (10.5 hours)
 */
export async function getTimeOfUsePattern(): Promise<TimeOfUsePattern> {
  try {
    const pattern = await prisma.consumptionAssumption.findFirst({
      where: {
        assumptionType: 'time_of_use',
        region: 'WA',
        active: true,
      },
    });

    if (pattern) {
      // Extract from database
      const daytime = pattern.baselineKwhPerDay || 0.30;  // Using baselineKwhPerDay as daytime %
      const evening = pattern.acAdjustmentKwhPerDay || 0.45;  // Using acAdjustmentKwhPerDay as evening %
      const night = pattern.poolKwhPerDay || 0.25;  // Using poolKwhPerDay as night %

      return {
        daytime,
        evening,
        night,
        description: pattern.notes || 'Perth time-of-use pattern',
      };
    }

    // Default Perth pattern if not in database
    console.warn('⚠️ Using default Perth time-of-use pattern');
    return {
      daytime: 0.30,   // 30% during solar hours (6am-6pm)
      evening: 0.45,   // 45% evening peak (6pm-10pm)
      night: 0.25,     // 25% overnight (10pm-6am)
      description: 'Default Perth pattern: 30% day, 45% evening, 25% night',
    };

  } catch (error) {
    console.error('Error fetching time-of-use pattern:', error);
    
    // Fallback
    return {
      daytime: 0.30,
      evening: 0.45,
      night: 0.25,
      description: 'Fallback pattern',
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Calculate time-of-use breakdown for a given daily consumption
 */
export async function calculateTimeOfUseBreakdown(
  dailyConsumption: number,
  evConsumption?: number,
  evChargingTime?: string
): Promise<TimeOfUseBreakdown> {
  const pattern = await getTimeOfUsePattern();

  // Base breakdown
  let daytime = dailyConsumption * pattern.daytime;
  let evening = dailyConsumption * pattern.evening;
  let night = dailyConsumption * pattern.night;

  // Adjust for EV charging
  if (evConsumption && evConsumption > 0) {
    switch (evChargingTime) {
      case 'morning':
        // Morning charging (6am-12pm) - add to daytime
        daytime += evConsumption;
        break;
      case 'midday':
        // Midday charging (12pm-3pm) - peak solar, add to daytime
        daytime += evConsumption;
        break;
      case 'evening':
        // Evening charging (6pm-10pm) - add to evening
        evening += evConsumption;
        break;
      case 'night':
        // Night charging (10pm-6am) - add to night
        night += evConsumption;
        break;
      default:
        // Default to night charging
        night += evConsumption;
    }
  }

  return {
    daytime: Math.round(daytime * 10) / 10,
    evening: Math.round(evening * 10) / 10,
    night: Math.round(night * 10) / 10,
    solarHours: {
      summer: { start: '6:00 AM', end: '7:00 PM' },  // 13 hours
      winter: { start: '7:00 AM', end: '5:30 PM' },  // 10.5 hours
    },
    pattern,
  };
}

/**
 * Calculate battery needs (night + evening after sunset)
 * 
 * IMPORTANT: Evening period (6pm-10pm) is partially covered by solar in summer
 * but fully needs battery in winter. We use a weighted average.
 */
export async function calculateBatteryNeeds(
  dailyConsumption: number,
  evConsumption?: number,
  evChargingTime?: string
): Promise<{
  nightOnly: number;
  nightPlusEvening: number;
  recommended: number;
  explanation: string;
}> {
  const breakdown = await calculateTimeOfUseBreakdown(
    dailyConsumption,
    evConsumption,
    evChargingTime
  );

  // Night consumption (10pm-6am) - always needs battery
  const nightOnly = breakdown.night;

  // Evening consumption (6pm-10pm) - partially needs battery
  // Summer: ~50% covered by solar (sunset 7pm)
  // Winter: ~100% needs battery (sunset 5:30pm)
  // Average: ~75% needs battery
  const eveningBatteryPortion = breakdown.evening * 0.75;

  const nightPlusEvening = nightOnly + eveningBatteryPortion;

  // Recommended is night + partial evening
  const recommended = nightPlusEvening;

  const explanation = `
Battery needs calculation:
- Night (10pm-6am): ${nightOnly.toFixed(1)} kWh (100% from battery)
- Evening (6pm-10pm): ${breakdown.evening.toFixed(1)} kWh (75% from battery = ${eveningBatteryPortion.toFixed(1)} kWh)
- Total battery needs: ${recommended.toFixed(1)} kWh

Note: Evening partially covered by solar in summer (sunset ~7pm) but fully needs battery in winter (sunset ~5:30pm).
Using 75% average to account for seasonal variation.
  `.trim();

  return {
    nightOnly,
    nightPlusEvening,
    recommended,
    explanation,
  };
}

/**
 * Save time-of-use pattern to database
 */
export async function saveTimeOfUsePattern(pattern: {
  daytime: number;
  evening: number;
  night: number;
  description?: string;
}) {
  try {
    // Validate percentages add up to 1.0
    const total = pattern.daytime + pattern.evening + pattern.night;
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Percentages must add up to 100% (currently ${(total * 100).toFixed(1)}%)`);
    }

    // Delete existing pattern
    await prisma.consumptionAssumption.deleteMany({
      where: { assumptionType: 'time_of_use', region: 'WA' },
    });

    // Create new pattern (using existing fields creatively)
    const result = await prisma.consumptionAssumption.create({
      data: {
        assumptionType: 'time_of_use',
        region: 'WA',
        active: true,
        baselineKwhPerDay: pattern.daytime,      // Daytime %
        acAdjustmentKwhPerDay: pattern.evening,  // Evening %
        poolKwhPerDay: pattern.night,            // Night %
        notes: pattern.description || `Perth pattern: ${(pattern.daytime * 100).toFixed(0)}% day, ${(pattern.evening * 100).toFixed(0)}% evening, ${(pattern.night * 100).toFixed(0)}% night`,
        updatedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error('Error saving time-of-use pattern:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
