import { PrismaClient } from '@prisma/client';
import { getZoneRatingByPostcode } from './postcode-zone-service';

// Use a singleton pattern for Prisma client to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

interface RebateCalculationParams {
  systemSizeKw: number;
  batterySizeKwh: number;
  region?: string;
  postcode?: string; // Add postcode for zone rating lookup
}

interface RebateResult {
  federalSolar: number;
  federalBattery: number;
  stateBattery: number;
  total: number;
  details: {
    federalSolarFormula?: string;
    federalBatteryFormula?: string;
    stateBatteryFormula?: string;
    combinedCapApplied?: boolean;
  };
}

/**
 * Calculate rebates using database-stored formulas
 */
export async function calculateRebates(params: RebateCalculationParams): Promise<RebateResult> {
  const { systemSizeKw, batterySizeKwh, region = 'WA', postcode } = params;

  try {
    // Fetch active rebate configs
    const rebateConfigs = await prisma.rebateConfig.findMany({
      where: { active: true },
    });

    let federalSolar = 0;
    let federalBattery = 0;
    let stateBattery = 0;
    const details: any = {};

    // 1. Calculate Federal SRES (Solar) - Use postcode-based zone rating
    const sresConfig = rebateConfigs.find(r => r.type === 'federal_sres');
    if (sresConfig && systemSizeKw > 0) {
      // Get zone rating from postcode if provided
      let zoneRating = 1.382; // Default Zone 3
      let zoneInfo = '';
      
      if (postcode) {
        const zoneData = await getZoneRatingByPostcode(postcode);
        if (zoneData) {
          zoneRating = zoneData.zoneRating;
          zoneInfo = ` (${zoneData.description || `Zone ${zoneData.zone}`})`;
        }
      } else {
        // Fallback to config or default
        const vars = sresConfig.variables as any;
        const parseNumeric = (val: any): number | null => {
          if (typeof val === 'number') return val;
          if (typeof val === 'string') {
            const match = val.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : null;
          }
          return null;
        };
        zoneRating = parseNumeric(vars?.zoneRating) || 1.382;
      }
      
      const vars = sresConfig.variables as any;
      const parseNumeric = (val: any): number | null => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : null;
        }
        return null;
      };
      
      // Try both deemingPeriod and deemingYears (database uses deemingYears)
      const deemingPeriod = parseNumeric(vars?.deemingPeriod) || parseNumeric(vars?.deemingYears) || 6;
      const stcValue = parseNumeric(vars?.stcValue) || 38.90;
      
      // Official CER formula: STCs = floor(systemSizeKw × zoneRating × deemingPeriod)
      const numSTCs = Math.floor(systemSizeKw * zoneRating * deemingPeriod);
      federalSolar = Math.round(numSTCs * stcValue);
      
      details.federalSolarFormula = `floor(${systemSizeKw}kW × ${zoneRating}${zoneInfo} × ${deemingPeriod}y) = ${numSTCs} STCs × $${stcValue} = $${federalSolar}`;
    }

    // 2. Calculate Federal Battery Rebate (NEW 2025)
    const federalBatteryConfig = rebateConfigs.find(r => r.type === 'federal_battery');
    if (federalBatteryConfig && batterySizeKwh > 0) {
      // Formula: batterySizeKwh * usableCapacity * ratePerKwh
      // CAPPED AT 50kWh maximum battery size for rebate calculation
      const vars = federalBatteryConfig.variables as any;
      
      const parseNumeric = (val: any): number | null => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : null;
        }
        return null;
      };
      
      const usableCapacity = parseNumeric(vars?.usableCapacity) || 0.9;
      const ratePerKwh = parseNumeric(vars?.ratePerKwh) || 330;
      const maxBatterySize = parseNumeric(vars?.maxBatterySize) || 50; // 50kWh cap
      
      // Cap battery size at 50kWh for rebate calculation
      const effectiveBatterySize = Math.min(batterySizeKwh, maxBatterySize);
      const usableKwh = effectiveBatterySize * usableCapacity;
      federalBattery = Math.round(usableKwh * ratePerKwh);
      
      details.federalBatteryFormula = `${effectiveBatterySize}kWh × ${usableCapacity} × $${ratePerKwh}/kWh = $${federalBattery}`;
      if (batterySizeKwh > maxBatterySize) {
        details.federalBatteryFormula += ` (battery ${batterySizeKwh}kWh capped at ${maxBatterySize}kWh for rebate)`;
      }
    }

    // 3. Calculate State Battery Rebate (WA) - VARIABLE RATE
    const stateBatteryConfig = rebateConfigs.find(r => r.type === 'wa_battery');
    if (stateBatteryConfig && batterySizeKwh >= 5 && region === 'WA') {
      // WA State Battery Rebate: Variable based on battery size
      // Formula: batterySizeKwh × usableCapacity × ratePerKwh
      // BUT capped when combined with federal exceeds $5,000
      const vars = stateBatteryConfig.variables as any;
      
      const parseNumeric = (val: any): number | null => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const match = val.match(/[\d.]+/);
          return match ? parseFloat(match[0]) : null;
        }
        return null;
      };
      
      const usableCapacity = parseNumeric(vars?.usableCapacity) || 0.9;
      const ratePerKwh = parseNumeric(vars?.ratePerKwh) || 130; // WA rate: $130/kWh
      const minCapacity = parseNumeric(vars?.minCapacity) || 5;
      
      // Calculate WA rebate based on battery size
      if (batterySizeKwh >= minCapacity) {
        const usableKwh = batterySizeKwh * usableCapacity;
        stateBattery = Math.round(usableKwh * ratePerKwh);
        details.stateBatteryFormula = `${batterySizeKwh}kWh × ${usableCapacity} × $${ratePerKwh}/kWh = $${stateBattery}`;
      } else {
        stateBattery = 0;
        details.stateBatteryFormula = `No WA rebate (battery < ${minCapacity}kWh)`;
      }
    }

    // 4. Apply WA Combined Battery Rebate Cap ($5,000 total)
    // When total battery rebates (federal + state) exceed $5,000:
    // - WA state rebate gets capped at $1,300
    // - Federal battery rebate shows actual amount (not adjusted)
    if (region === 'WA' && batterySizeKwh > 0) {
      const combinedBatteryRebates = federalBattery + stateBattery;
      const WA_COMBINED_CAP = 5000;
      const WA_STATE_MAX = 1300;
      
      if (combinedBatteryRebates > WA_COMBINED_CAP) {
        // When combined exceeds $5k, WA state rebate is capped at $1,300
        // Federal rebate remains at actual calculated amount
        const originalStateBattery = stateBattery;
        stateBattery = WA_STATE_MAX;
        
        details.combinedCapApplied = true;
        details.stateBatteryFormula += ` → Capped at $${WA_STATE_MAX} (combined cap: federal + state > $${WA_COMBINED_CAP})`;
        
        console.log(`⚠️ WA Combined Battery Rebate Cap Applied:`);
        console.log(`   Federal: $${federalBattery} (actual for battery up to 50kWh)`);
        console.log(`   WA State: $${originalStateBattery} → $${stateBattery} (capped)`);
        console.log(`   Total: $${federalBattery + stateBattery}`);
      }
    }

    const total = federalSolar + federalBattery + stateBattery;

    return {
      federalSolar,
      federalBattery,
      stateBattery,
      total,
      details,
    };

  } catch (error) {
    console.error('Error calculating rebates from database:', error);
    
    // Fallback to hardcoded values if database fails
    console.warn('⚠️ Using fallback rebate calculations');
    const federalSolar = Math.round(systemSizeKw * 378); // Simplified fallback (1.622 * 6 * 38.90)
    const federalBattery = batterySizeKwh > 0 ? Math.round(batterySizeKwh * 0.9 * 330) : 0;
    const stateBattery = (batterySizeKwh >= 5 && region === 'WA') ? 1300 : 0;
    
    return {
      federalSolar,
      federalBattery,
      stateBattery,
      total: federalSolar + federalBattery + stateBattery,
      details: {
        federalSolarFormula: 'Fallback calculation',
        federalBatteryFormula: 'Fallback calculation',
        stateBatteryFormula: 'Fallback calculation',
      },
    };
  }
}

/**
 * Get all active rebate configurations
 */
export async function getActiveRebates() {
  try {
    return await prisma.rebateConfig.findMany({
      where: { active: true },
      orderBy: { type: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching rebate configs:', error);
    return [];
  }
}
