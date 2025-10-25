
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateRebates } from '@/lib/calculations';

/**
 * Centralized Quote Calculation API
 * 
 * This is the SINGLE SOURCE OF TRUTH for all quote calculations.
 * All costs, rebates, savings, and ROI calculations happen here.
 * 
 * Input: User selections and system specs
 * Output: Complete calculated quote
 */

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      // User inputs
      quarterlyBill,
      hasEv,
      planningEv,
      
      // System specs
      systemSizeKw,
      panelCount,
      batterySizeKwh,
      
      // Selected brand IDs
      panelBrandId,
      batteryBrandId,
      inverterBrandId,
    } = data;

    // Validate required fields
    if (!systemSizeKw || !panelBrandId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: systemSizeKw, panelBrandId' },
        { status: 400 }
      );
    }

    // 1. Fetch selected brands from database
    const [selectedPanel, selectedBattery, selectedInverter] = await Promise.all([
      prisma.panelBrand.findUnique({ where: { id: panelBrandId } }),
      batteryBrandId ? prisma.batteryBrand.findUnique({ where: { id: batteryBrandId } }) : null,
      inverterBrandId ? prisma.inverterBrand.findUnique({ where: { id: inverterBrandId } }) : null,
    ]);

    if (!selectedPanel) {
      return NextResponse.json(
        { success: false, error: 'Invalid panel brand ID' },
        { status: 400 }
      );
    }

    // 2. Calculate actual panel count based on selected panel wattage
    const actualPanelCount = Math.ceil((systemSizeKw * 1000) / selectedPanel.wattage);

    // 3. Calculate costs
    const panelSystemCost = selectedPanel.pricePerKw * systemSizeKw;
    const batteryCost = selectedBattery ? (selectedBattery.price || 0) : 0;
    const inverterCost = selectedInverter ? (selectedInverter.pricePerKw * systemSizeKw) : 0;
    const installationCost = 1500; // Base installation fee
    const totalCostBeforeRebates = panelSystemCost + batteryCost + inverterCost + installationCost;

    // 4. Calculate rebates
    const rebates = await calculateRebates(systemSizeKw, batterySizeKwh, batteryCost);

    // Use rebates as calculated from database (no artificial cap)
    // The WA state rebate formula already handles the $5,000 eligibility threshold
    // Federal battery rebate can go up to $18,600 (50 kWh usable capacity)
    const totalRebates = rebates.federalSRES + rebates.federalBattery + rebates.waBatteryScheme;
    const totalCostAfterRebates = totalCostBeforeRebates - totalRebates;

    // 5. Calculate savings using accurate Synergy tariff rates (WA)
    const annualElectricityCost = quarterlyBill * 4;
    const synergyGridRate = 0.3237; // Synergy Home Plan A1 tariff ($/kWh)
    const annualUsageKwh = annualElectricityCost / synergyGridRate; // Convert $ to kWh
    const dailyUsageKwh = annualUsageKwh / 365;
    
    // Solar generation: Perth average = 1,460 kWh per kW per year (4 hours/day)
    const annualGenerationKwh = systemSizeKw * 1460;
    const dailyGenerationKwh = annualGenerationKwh / 365;
    
    // Model daytime vs overnight usage (typical: 55% day, 45% overnight)
    const daytimeUsageKwh = dailyUsageKwh * 0.55;
    const overnightUsageKwh = dailyUsageKwh * 0.45;
    
    // Direct self-consumption during day (solar directly powers the home)
    const directSelfConsumption = Math.min(daytimeUsageKwh, dailyGenerationKwh);
    const excessSolarKwh = Math.max(0, dailyGenerationKwh - directSelfConsumption);
    
    // Battery savings: Store excess solar for overnight use
    let batterySelfConsumption = 0;
    let batterySavings = 0;
    
    if (batterySizeKwh > 0) {
      // Battery usable capacity: 90% depth of discharge, 85% round-trip efficiency
      const usableBatteryCapacity = batterySizeKwh * 0.9 * 0.85;
      
      // Battery stores excess solar (up to its capacity)
      const batteryChargedKwh = Math.min(excessSolarKwh, usableBatteryCapacity);
      
      // Battery covers overnight usage
      batterySelfConsumption = Math.min(batteryChargedKwh, overnightUsageKwh);
      
      // Annual battery savings: overnight usage covered by battery × Synergy rate
      batterySavings = (batterySelfConsumption * 365) * synergyGridRate;
    }
    
    // Total self-consumption savings
    const totalSelfConsumptionKwh = (directSelfConsumption + batterySelfConsumption) * 365;
    const selfConsumptionSavings = totalSelfConsumptionKwh * synergyGridRate;
    
    // Export revenue: Remaining solar after self-consumption and battery charging
    const remainingSolarForExport = excessSolarKwh - (batterySizeKwh > 0 ? Math.min(excessSolarKwh, batterySizeKwh * 0.9 * 0.85) : 0);
    const annualExportKwh = Math.max(0, remainingSolarForExport * 365);
    
    // Assume 90% exported during off-peak, 10% during peak (3pm-9pm)
    const offPeakExportRate = 0.02; // DEBS off-peak FiT
    const peakExportRate = 0.10;    // DEBS peak FiT (3pm-9pm)
    const exportRevenue = (annualExportKwh * 0.9 * offPeakExportRate) + (annualExportKwh * 0.1 * peakExportRate);
    
    // EV savings (if applicable)
    let evSavings = 0;
    if ((hasEv || planningEv) && batterySizeKwh >= 10) {
      // Petrol savings: 15,000 km/year at 8L/100km × $1.80/L = $2,160
      // Solar charging cost: ~$100/year (mostly free solar + some grid)
      // Net savings: ~$2,500/year per vehicle
      evSavings = 2500;
    }
    
    // Total annual savings
    const totalSavings = selfConsumptionSavings + exportRevenue + evSavings;
    const annualSavings = Math.min(totalSavings, annualElectricityCost * 0.98); // Cap at 98% of current cost
    
    // Long-term savings (assuming 3% annual electricity price increase)
    // SYNCED WITH recommendation-engine.ts for consistency
    let year25Savings = 0;
    for (let year = 0; year < 25; year++) {
      year25Savings += annualSavings * Math.pow(1.03, year);
    }
    year25Savings -= totalCostAfterRebates; // Subtract initial investment
    
    const year10Savings = annualSavings * 10 * 1.15; // Simplified 10-year estimate

    // 6. Calculate ROI and payback period
    const paybackYears = annualSavings > 0 ? totalCostAfterRebates / annualSavings : 0;
    const totalSavingsOver25Years = year25Savings + totalCostAfterRebates; // Add back investment for ROI calc
    const roi = totalCostAfterRebates > 0 
      ? ((totalSavingsOver25Years - totalCostAfterRebates) / totalCostAfterRebates) * 100 
      : 0;

    // 7. Calculate payment options
    const depositPercentage = 10;
    const depositAmount = totalCostAfterRebates * (depositPercentage / 100);
    const installmentMonths = 24;
    const monthlyPayment = totalCostAfterRebates / installmentMonths;

    // 8. Calculate environmental impact
    // SYNCED WITH recommendation-engine.ts for consistency
    // Annual solar generation already calculated above: annualGenerationKwh
    // CO2 savings: kWh generated * 0.68 kg CO2/kWh (WA grid emission factor) / 1000 to convert kg to tonnes
    const co2SavedPerYear = (annualGenerationKwh * 0.68) / 1000;
    // Trees equivalent: CO2 saved in kg / 21 kg (avg CO2 absorbed per tree per year)
    const equivalentTrees = Math.round((annualGenerationKwh * 0.68) / 21);
    // Cars equivalent: CO2 saved in kg / 4000 kg (avg CO2 emitted per car per year)
    const equivalentCars = Math.round((annualGenerationKwh * 0.68) / 4000);

    // 9. Build complete quote object
    const calculatedQuote = {
      // System Configuration
      systemSizeKw,
      panelCount: actualPanelCount,
      batterySizeKwh,
      
      // Selected Brands
      panelBrandId,
      panelBrandName: selectedPanel.name,
      panelBrandWattage: selectedPanel.wattage,
      panelBrandTier: selectedPanel.tier,
      
      batteryBrandId: selectedBattery?.id || null,
      batteryBrandName: selectedBattery?.name || 'None',
      batteryBrandCapacity: selectedBattery?.capacityKwh || batterySizeKwh,
      batteryBrandTier: selectedBattery?.tier || 'none',
      
      inverterBrandId: selectedInverter?.id || null,
      inverterBrandName: selectedInverter?.name || 'Standard Inverter',
      inverterBrandCapacity: selectedInverter?.capacityKw || systemSizeKw,
      inverterBrandTier: selectedInverter?.tier || 'standard',
      
      // Cost Breakdown
      panelSystemCost,
      batteryCost,
      inverterCost,
      installationCost,
      totalCostBeforeRebates,
      
      // Rebates (calculated from database formulas)
      federalSolarRebate: rebates.federalSRES,
      federalBatteryRebate: rebates.federalBattery,
      stateBatteryRebate: rebates.waBatteryScheme,
      totalRebates: totalRebates,
      
      // Final Costs
      totalCostAfterRebates,
      
      // Payment Options
      depositAmount,
      depositPercentage,
      upfrontPayment: totalCostAfterRebates,
      installmentMonths,
      monthlyPayment,
      
      // Savings & ROI
      annualSavings,
      year10Savings,
      year25Savings,
      paybackYears,
      roi,
      
      // Customer Data
      quarterlyBill,
      dailyUsage: (quarterlyBill * 4) / 365,
      hasEv: hasEv || false,
      planningEv: planningEv || false,
      
      // Environmental Impact
      co2SavedPerYear,
      equivalentTrees,
      equivalentCars,
    };

    return NextResponse.json({
      success: true,
      quote: calculatedQuote,
    });

  } catch (error: any) {
    console.error('Error calculating quote:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
