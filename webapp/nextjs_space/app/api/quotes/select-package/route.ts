import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Save selected package to CustomerQuote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      selectedPackage,
      customizationNotes,
    } = body;

    if (!sessionId || !selectedPackage) {
      return NextResponse.json(
        { error: 'Session ID and selected package are required' },
        { status: 400 }
      );
    }

    // Find the quote
    const quote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Update quote with selected package and system details
    const updated = await prisma.customerQuote.update({
      where: { sessionId },
      data: {
        // Package selection
        selectedPackageId: selectedPackage.templateId,
        selectedPackageTier: selectedPackage.tier,
        selectedPackageName: selectedPackage.displayName,
        customizationNotes: customizationNotes || null,
        
        // System specifications
        systemSizeKw: selectedPackage.solarKw,
        panelCount: selectedPackage.panelCount,
        batterySizeKwh: selectedPackage.batteryKwh,
        panelBrandWattage: selectedPackage.panelWattage,
        batteryBrandName: selectedPackage.batteryBrand,
        
        // Product IDs from package (these are the selected products)
        finalPanelProductId: selectedPackage.panelProductId || null,
        finalPanelCount: selectedPackage.panelCount,
        finalBatteryProductId: selectedPackage.batteryProductId || null,
        finalInverterProductId: selectedPackage.inverterProductId || null,
        
        // Costs (SAVED - never recalculate)
        panelSystemCost: selectedPackage.solarCost,
        batteryCost: selectedPackage.batteryCost,
        inverterCost: selectedPackage.inverterCost || 0,
        installationCost: selectedPackage.installationCost,
        totalCostBeforeRebates: selectedPackage.totalBeforeRebates,
        federalSolarRebate: selectedPackage.federalSolarRebate,
        federalBatteryRebate: selectedPackage.federalBatteryRebate,
        stateBatteryRebate: selectedPackage.stateBatteryRebate || 0,
        totalRebates: selectedPackage.totalRebates,
        totalCostAfterRebates: selectedPackage.totalAfterRebates,
        upfrontPayment: selectedPackage.totalAfterRebates,
        
        // Savings (SAVED - never recalculate)
        annualSavings: selectedPackage.annualSavings,
        year10Savings: selectedPackage.year10Savings,
        year25Savings: selectedPackage.year25Savings,
        paybackYears: selectedPackage.paybackYears,
        
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Saved package selection: ${selectedPackage.displayName} for quote ${updated.id}`);

    return NextResponse.json({
      success: true,
      quoteId: updated.id,
      message: 'Package selection saved successfully',
    });

  } catch (error: any) {
    console.error('Error saving package selection:', error);
    return NextResponse.json(
      { error: 'Failed to save package selection', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
