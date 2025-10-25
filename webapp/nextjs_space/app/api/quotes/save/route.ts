
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      // leadId, // Removed - not used in customization flow
      quoteId, // If updating existing quote
      // Step 1 & 2 data (user input)
      address,
      propertyType,
      roofType,
      quarterlyBill,
      householdSize,
      usagePattern,
      hasEv,
      planningEv,
      evCount,
      hasElectricHotWater,
      hasElectricCooking,
      bedrooms,
      acTier,
      poolType,
      homeOfficeCount,
      dailyConsumption,
      // Step 3 data (roof analysis)
      roofAnalysisData,
      roofArea,
      solarIrradiance,
      shadingAnalysis,
      financialAnalyses,
      configurations,
      roofSegments,
      // Step 4 & 5 data (system design & brands)
      systemSizeKw,
      numPanels,
      panelCount, // From centralized calculation API
      panelWattage,
      batterySizeKwh,
      selectedPanelBrand,
      selectedBatteryBrand,
      selectedInverterBrand,
      selectedPanelBrandName,
      selectedBatteryBrandName,
      selectedInverterBrandName,
      panelModel,
      batteryModel,
      inverterModel,
      selectedAddons,
      // Calculated costs from Step 5
      step5Costs,
      // Payment preferences from Step 6
      paymentPreference,
      financeMonths,
    } = body;

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine what data is available and save progressively
    const quoteData: any = {
      id: quoteId || `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: finalSessionId,
      status: 'draft',
      updatedAt: new Date(),
    };
    
    // Note: leadId is not included here as it's managed separately in the contact flow

    // Property details (from Step 1)
    if (address) quoteData.address = address;
    if (propertyType) quoteData.propertyType = propertyType;
    if (roofType) quoteData.roofType = roofType;

    // If we have system configuration (from Step 4+), save it
    if (systemSizeKw) {
      quoteData.systemSizeKw = systemSizeKw;
      // Accept both panelCount (from calculation API) and numPanels (legacy)
      quoteData.panelCount = panelCount || numPanels || 0;
      quoteData.batterySizeKwh = batterySizeKwh || 0;
    }

    // If we have brand selections (from Step 5), save them
    if (selectedPanelBrand) {
      quoteData.panelBrandId = selectedPanelBrand;
      quoteData.panelBrandName = selectedPanelBrandName || '';
      quoteData.panelModel = panelModel || '';
      quoteData.panelBrandWattage = panelWattage || 0;
      quoteData.panelBrandTier = 'premium'; // Default, will be updated from brand data
    }

    if (selectedBatteryBrand) {
      quoteData.batteryBrandId = selectedBatteryBrand;
      quoteData.batteryBrandName = selectedBatteryBrandName || '';
      quoteData.batteryModel = batteryModel || '';
      quoteData.batteryBrandCapacity = batterySizeKwh || 0;
      quoteData.batteryBrandTier = 'premium'; // Default
    }

    if (selectedInverterBrand) {
      quoteData.inverterBrandId = selectedInverterBrand;
      quoteData.inverterBrandName = selectedInverterBrandName || '';
      quoteData.inverterModel = inverterModel || '';
      quoteData.inverterBrandCapacity = systemSizeKw || 0;
      quoteData.inverterBrandTier = 'premium'; // Default
    }

    // PHASE 5: Save final selected products from Step 5 customization
    if (body.finalPanelProductId) quoteData.finalPanelProductId = body.finalPanelProductId;
    if (body.finalPanelCount) quoteData.finalPanelCount = body.finalPanelCount;
    if (body.finalBatteryProductId) quoteData.finalBatteryProductId = body.finalBatteryProductId;
    if (body.finalInverterProductId) quoteData.finalInverterProductId = body.finalInverterProductId;

    // PHASE 3/4: Accept complete quote from centralized calculation API
    // Step 5 now passes the complete calculated quote directly
    if (body.panelSystemCost !== undefined) {
      quoteData.panelSystemCost = body.panelSystemCost;
      quoteData.batteryCost = body.batteryCost || 0;
      quoteData.inverterCost = body.inverterCost || 0;
      quoteData.installationCost = body.installationCost || 0;
      quoteData.totalCostBeforeRebates = body.totalCostBeforeRebates || 0;
      
      quoteData.federalSolarRebate = body.federalSolarRebate || 0;
      quoteData.federalBatteryRebate = body.federalBatteryRebate || 0;
      quoteData.stateBatteryRebate = body.stateBatteryRebate || 0;
      quoteData.totalRebates = body.totalRebates || 0;
      
      quoteData.totalCostAfterRebates = body.totalCostAfterRebates || 0;
      quoteData.upfrontPayment = body.upfrontPayment || body.totalCostAfterRebates || 0;
      
      // Savings calculations
      quoteData.annualSavings = body.annualSavings || 0;
      quoteData.year10Savings = body.year10Savings || 0;
      quoteData.year25Savings = body.year25Savings || 0;
      quoteData.paybackYears = body.paybackYears || 0;
      quoteData.roi = body.roi || 0;
      
      // PHASE 4: Save environmental impact data
      quoteData.co2SavedPerYear = body.co2SavedPerYear || 0;
      quoteData.equivalentTrees = body.equivalentTrees || 0;
      quoteData.equivalentCars = body.equivalentCars || 0;
      
      // PHASE 4: Save addon product IDs (similar to how we save panel/battery/inverter IDs)
      // The selectedAddons field stores an array of addon product IDs as JSON
      // Full addon details can be fetched from the Product table when needed
      if (body.selectedAddonIds !== undefined) {
        quoteData.selectedAddons = JSON.stringify(body.selectedAddonIds);
      }
    }
    
    // Legacy support: If old step5Costs format is passed
    if (step5Costs) {
      quoteData.panelSystemCost = step5Costs.panelsCost || 0;
      quoteData.batteryCost = step5Costs.batteryCost || 0;
      quoteData.inverterCost = step5Costs.inverterCost || 0;
      quoteData.installationCost = step5Costs.installationCost || 0;
      quoteData.totalCostBeforeRebates = step5Costs.totalBeforeRebates || 0;
      
      quoteData.federalSolarRebate = step5Costs.federalSRES || 0;
      quoteData.federalBatteryRebate = step5Costs.federalBattery || 0;
      quoteData.stateBatteryRebate = step5Costs.waBatteryScheme || 0;
      quoteData.totalRebates = step5Costs.totalRebates || 0;
      
      quoteData.totalCostAfterRebates = step5Costs.finalInvestment || 0;
      quoteData.upfrontPayment = step5Costs.finalInvestment || 0;
      
      // Savings calculations
      quoteData.annualSavings = step5Costs.annualSavings || 0;
      quoteData.year10Savings = (step5Costs.annualSavings || 0) * 10;
      quoteData.year25Savings = (step5Costs.annualSavings || 0) * 25;
      quoteData.paybackYears = step5Costs.finalInvestment / (step5Costs.annualSavings || 1);
      quoteData.roi = ((step5Costs.annualSavings * 25 - step5Costs.finalInvestment) / step5Costs.finalInvestment) * 100;
    }

    // Payment options (from Step 6)
    if (paymentPreference) {
      const depositPercentage = 10; // Default, should fetch from settings
      quoteData.depositAmount = (quoteData.totalCostAfterRebates || 0) * (depositPercentage / 100);
      quoteData.depositPercentage = depositPercentage;
      
      const installmentMonths = financeMonths || 24;
      quoteData.installmentMonths = installmentMonths;
      quoteData.monthlyPayment = (quoteData.totalCostAfterRebates || 0) / installmentMonths;
    }

    // Customer usage data (from Step 2)
    if (quarterlyBill) {
      quoteData.quarterlyBill = quarterlyBill;
      quoteData.dailyUsage = dailyConsumption || (quarterlyBill * 4) / 365 / 0.28; // Rough estimate
      quoteData.hasEv = hasEv || false;
      quoteData.planningEv = planningEv || false;
    }
    
    // Save dailyConsumption if provided directly
    if (dailyConsumption) {
      quoteData.dailyUsage = dailyConsumption;
      quoteData.dailyConsumption = dailyConsumption;
    }
    
    // Household details (advanced profile from Step 2)
    if (bedrooms !== undefined) quoteData.bedrooms = bedrooms;
    if (body.hasPool !== undefined) quoteData.hasPool = body.hasPool;
    if (body.poolHeated !== undefined) quoteData.poolHeated = body.poolHeated;
    if (body.homeOffices !== undefined) quoteData.homeOffices = body.homeOffices;
    if (body.hvacUsage !== undefined) quoteData.hvacUsage = body.hvacUsage;
    if (householdSize !== undefined) quoteData.householdSize = householdSize;
    if (usagePattern !== undefined) quoteData.usagePattern = usagePattern;
    if (hasElectricHotWater !== undefined) quoteData.hasElectricHotWater = hasElectricHotWater;
    if (hasElectricCooking !== undefined) quoteData.hasElectricCooking = hasElectricCooking;
    if (evCount !== undefined) quoteData.evCount = evCount;
    
    // EV enhanced fields
    if (body.evChargingTime !== undefined) quoteData.evChargingTime = body.evChargingTime;
    if (body.evUsageTier !== undefined) quoteData.evUsageTier = body.evUsageTier;
    
    // Bill data (from bill input modal)
    if (body.billData !== undefined) quoteData.billData = JSON.stringify(body.billData);
    if (body.seasonalPattern !== undefined) quoteData.seasonalPattern = JSON.stringify(body.seasonalPattern);
    
    // CONSUMPTION ANALYSIS - Calculated in Step 3
    if (body.annualConsumption !== undefined) quoteData.annualConsumption = body.annualConsumption;
    if (body.overnightUsage !== undefined) quoteData.overnightUsage = body.overnightUsage;
    if (body.usageSource !== undefined) quoteData.usageSource = body.usageSource;
    if (body.peakTime !== undefined) quoteData.peakTime = body.peakTime;
    if (body.consumptionBreakdown !== undefined) quoteData.consumptionBreakdown = JSON.stringify(body.consumptionBreakdown);
    
    // Save full energy profile JSON from Step 2
    if (body.energyProfile !== undefined) {
      quoteData.energyProfile = typeof body.energyProfile === 'string' 
        ? body.energyProfile 
        : JSON.stringify(body.energyProfile);
    }
    
    // Save bimonthly bill
    if (body.bimonthlyBill !== undefined) quoteData.bimonthlyBill = body.bimonthlyBill;
    
    // PRODUCTION DATA - From calculator-v2 roof analysis
    if (body.monthlyProductionData !== undefined) {
      quoteData.monthlyProductionData = typeof body.monthlyProductionData === 'string'
        ? body.monthlyProductionData
        : JSON.stringify(body.monthlyProductionData);
    }
    if (body.annualProductionKwh !== undefined) quoteData.annualProductionKwh = body.annualProductionKwh;

    // Create or update quote
    let savedQuote;
    if (quoteId) {
      // Update existing quote
      savedQuote = await prisma.customerQuote.update({
        where: { id: quoteId },
        data: {
          ...quoteData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new quote
      // Check if a quote already exists for this session
      const existingQuote = await prisma.customerQuote.findUnique({
        where: { sessionId: finalSessionId },
      });

      if (existingQuote) {
        // Update existing quote
        savedQuote = await prisma.customerQuote.update({
          where: { id: existingQuote.id },
          data: {
            ...quoteData,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new quote
        savedQuote = await prisma.customerQuote.create({
          data: quoteData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      quoteId: savedQuote.id,
      sessionId: savedQuote.sessionId,
      quote: savedQuote,
    });
  } catch (error: any) {
    console.error('Error saving quote:', error);
    return NextResponse.json(
      { error: 'Failed to save quote', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
