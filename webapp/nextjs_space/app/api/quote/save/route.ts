
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      sessionId,
      leadId,
      systemSizeKw,
      panelCount,
      batterySizeKwh,
      
      // Selected Brands
      panelBrandId,
      panelBrandName,
      panelBrandWattage,
      panelBrandTier,
      
      batteryBrandId,
      batteryBrandName,
      batteryBrandCapacity,
      batteryBrandTier,
      
      inverterBrandId,
      inverterBrandName,
      inverterBrandCapacity,
      inverterBrandTier,
      
      // Cost Breakdown
      panelSystemCost,
      batteryCost,
      inverterCost,
      installationCost,
      totalCostBeforeRebates,
      
      // Rebates
      federalSolarRebate,
      federalBatteryRebate,
      stateBatteryRebate,
      totalRebates,
      
      // Final Costs
      totalCostAfterRebates,
      
      // Payment Options
      depositAmount,
      depositPercentage,
      upfrontPayment,
      installmentMonths,
      monthlyPayment,
      
      // Savings
      annualSavings,
      year10Savings,
      year25Savings,
      paybackYears,
      roi,
      
      // Customer Data
      quarterlyBill,
      dailyUsage,
      annualConsumption,
      usageSource,
      
      // Household characteristics
      householdSize,
      bedrooms,
      usagePattern,
      hasElectricHotWater,
      hasPool,
      poolHeated,
      homeOffices,
      hvacUsage,
      
      // EV Information
      hasEv,
      planningEv,
      evCount,
      evChargingTime,
      evUsageTier,
      
      // Environmental Impact
      co2SavedPerYear,
      equivalentTrees,
      equivalentCars,
      
      quoteReference,
    } = data;

    // Check if quote already exists for this session/lead
    let existingQuote = null;
    if (sessionId) {
      existingQuote = await prisma.customerQuote.findUnique({
        where: { sessionId },
      });
    } else if (leadId) {
      existingQuote = await prisma.customerQuote.findUnique({
        where: { leadId },
      });
    }

    const quoteData: any = {
      sessionId: sessionId || null,
      leadId: leadId || null,
      systemSizeKw,
      panelCount,
      batterySizeKwh,
      
      panelBrandId,
      panelBrandName,
      panelBrandWattage,
      panelBrandTier,
      
      batteryBrandId,
      batteryBrandName,
      batteryBrandCapacity,
      batteryBrandTier,
      
      inverterBrandId,
      inverterBrandName,
      inverterBrandCapacity,
      inverterBrandTier,
      
      panelSystemCost,
      batteryCost,
      inverterCost,
      installationCost,
      totalCostBeforeRebates,
      
      federalSolarRebate,
      federalBatteryRebate,
      stateBatteryRebate,
      totalRebates,
      
      totalCostAfterRebates,
      
      depositAmount,
      depositPercentage,
      upfrontPayment,
      installmentMonths,
      monthlyPayment,
      
      annualSavings,
      year10Savings,
      year25Savings,
      paybackYears,
      roi,
      
      quarterlyBill,
      dailyUsage,
      annualConsumption,
      usageSource,
      
      // Household characteristics
      householdSize,
      bedrooms,
      usagePattern,
      hasElectricHotWater,
      hasPool,
      poolHeated,
      homeOffices,
      hvacUsage,
      
      // EV Information
      hasEv,
      planningEv,
      evCount,
      evChargingTime,
      evUsageTier,
      
      // Environmental impact (defaults if not provided)
      co2SavedPerYear: co2SavedPerYear || 0,
      equivalentTrees: equivalentTrees || 0,
      equivalentCars: equivalentCars || 0,
      
      quoteReference: quoteReference || null,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      updatedAt: new Date(),
    };
    
    // Add id only for create operations
    if (!existingQuote) {
      quoteData.id = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    let quote;
    if (existingQuote) {
      // Update existing quote
      quote = await prisma.customerQuote.update({
        where: { id: existingQuote.id },
        data: quoteData,
      });
    } else {
      // Create new quote
      quote = await prisma.customerQuote.create({
        data: quoteData,
      });
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error saving quote:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
