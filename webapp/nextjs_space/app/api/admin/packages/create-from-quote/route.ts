import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quote, package: packageData } = body;

    if (!quote || !packageData) {
      return NextResponse.json(
        { success: false, error: 'Missing quote or package data' },
        { status: 400 }
      );
    }

    // Calculate cost per day
    const costPerDay = (quote.finalPrice / 365 / 10).toFixed(2); // Amortized over 10 years

    // Create package template
    const packageTemplate = await prisma.systemPackageTemplate.create({
      data: {
        id: `pkg_${Date.now()}`,
        name: packageData.name,
        displayName: packageData.displayName,
        description: packageData.description || '',
        tier: quote.selectedPanel?.tier || 'mid',
        sortOrder: packageData.sortOrder || 0,
        active: true,
        
        // Sizing strategies (fixed for now)
        solarSizingStrategy: 'FIXED',
        solarFixedKw: quote.systemSizeKw,
        batterySizingStrategy: quote.batterySizeKwh > 0 ? 'FIXED' : 'NONE',
        batteryFixedKwh: quote.batterySizeKwh || null,
        
        // Defaults
        includeMonitoring: true,
        includeWarranty: 'standard',
        includeMaintenance: false,
        priceMultiplier: 1.0,
        discountPercent: 0,
        
        // Display data
        badge: packageData.badge || null,
        highlightColor: null,
        features: {
          systemSizeKw: quote.systemSizeKw,
          panelCount: quote.panelCount,
          batterySizeKwh: quote.batterySizeKwh || 0,
          
          // Products
          panelProduct: {
            id: quote.selectedPanel?.id,
            name: quote.selectedPanel?.name,
            manufacturer: quote.selectedPanel?.manufacturer,
            wattage: quote.selectedPanel?.specifications?.wattage,
            tier: quote.selectedPanel?.tier,
          },
          inverterProduct: {
            id: quote.selectedInverter?.id,
            name: quote.selectedInverter?.name,
            manufacturer: quote.selectedInverter?.manufacturer,
            unitsNeeded: quote.inverterUnitsNeeded || 1,
          },
          batteryProduct: quote.selectedBattery ? {
            id: quote.selectedBattery.id,
            name: quote.selectedBattery.name,
            manufacturer: quote.selectedBattery.manufacturer,
            capacity: quote.selectedBattery.specifications?.capacity,
            unitsNeeded: quote.batteryUnitsNeeded || 1,
          } : null,
          
          // Detailed Pricing Breakdown
          panelCost: quote.panelCost,
          inverterCost: quote.inverterCost,
          batteryCost: quote.batteryCost || 0,
          installationCost: quote.installationCost,
          installationWholesaleCost: quote.installationWholesaleCost,
          extraCostsTotal: quote.extraCostsTotal || 0,
          subtotal: quote.subtotal,
          totalRebates: quote.totalRebates,
          finalPrice: quote.finalPrice,
          costPerDay: parseFloat(costPerDay),
          
          // Rebates Breakdown
          stcRebate: quote.stcRebate || 0,
          federalBatteryRebate: quote.federalBatteryRebate || 0,
          stateBatteryRebate: quote.stateBatteryRebate || 0,
          batteryRebate: quote.batteryRebate || 0,
          
          // Installation Details
          installationMethod: quote.installationBreakdown?.method || 'standard',
          installationBreakdown: quote.installationBreakdown || null,
          
          // Extra Costs
          extraCosts: quote.extraCosts || [],
          
          // Profit Analysis
          totalWholesaleCost: quote.totalWholesaleCost,
          grossProfit: quote.grossProfit,
          profitMargin: quote.profitMargin,
          
          // Savings
          annualSavings: Math.round(quote.systemSizeKw * 1200 * 0.30),
          year25Savings: Math.round(quote.systemSizeKw * 1200 * 0.30 * 25),
          paybackYears: parseFloat((quote.finalPrice / (quote.systemSizeKw * 1200 * 0.30)).toFixed(1)),
          
          // Marketing/Display info
          suitability: packageData.suitability || '',
          dailyUsage: packageData.dailyUsage || '',
          heroImageUrl: packageData.heroImageUrl || null,
          infographicUrl: packageData.infographicUrl || null,
          
          // Feature list (customizable)
          featureList: packageData.featureList || [
            '25-year panel warranty',
            'CEC certified installer',
            'Tier 1 panels',
            'Professional installation',
            'Monitoring included',
            'Full rebate assistance',
          ],
        },
        
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      packageId: packageTemplate.id,
      message: 'Package template created successfully',
    });
  } catch (error) {
    console.error('Error creating package template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package template' },
      { status: 500 }
    );
  }
}
