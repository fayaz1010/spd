import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Save final customized system configuration and create lead
 */
export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      selectedProducts,
      calculation,
      contactInfo,
    } = await request.json();

    console.log('💾 Saving final configuration for session:', sessionId);

    if (!sessionId || !selectedProducts || !calculation || !contactInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Update CustomerQuote with final products and calculations
    const quote = await prisma.customerQuote.update({
      where: { sessionId },
      data: {
        // Final selected products
        finalPanelProductId: selectedProducts.panelId,
        finalPanelCount: selectedProducts.panelCount,
        finalBatteryProductId: selectedProducts.batteryId,
        finalInverterProductId: selectedProducts.inverterId,
        
        // System specs
        systemSizeKw: calculation.systemSpecs.solarKw,
        panelCount: calculation.systemSpecs.panelCount,
        batterySizeKwh: calculation.systemSpecs.batteryKwh,
        
        // Costs
        panelSystemCost: calculation.costs.panels,
        batteryCost: calculation.costs.battery,
        inverterCost: calculation.costs.inverter,
        installationCost: calculation.costs.installation,
        totalCostBeforeRebates: calculation.costs.subtotal,
        
        // Rebates
        federalSolarRebate: calculation.rebates.federalSolar,
        federalBatteryRebate: calculation.rebates.federalBattery,
        stateBatteryRebate: calculation.rebates.stateBattery,
        totalRebates: calculation.rebates.total,
        totalCostAfterRebates: calculation.finalInvestment,
        upfrontPayment: calculation.finalInvestment,
        
        // Savings
        annualSavings: calculation.savings.annual,
        year10Savings: calculation.savings.year10,
        year25Savings: calculation.savings.year25,
        paybackYears: calculation.savings.paybackYears,
        
        // Contact info
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        contactPhone: contactInfo.phone,
        contactPreferredTime: contactInfo.preferredTime,
        contactNotes: contactInfo.notes,
        
        // Product details for display
        panelBrandName: calculation.products.panel.manufacturer,
        batteryBrandName: calculation.products.battery?.manufacturer,
        inverterBrandName: calculation.products.inverter.manufacturer,
        
        status: 'quoted',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Quote updated:', quote.id);

    // 2. Create Lead record
    const lead = await prisma.lead.create({
      data: {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        preferredContactTime: contactInfo.preferredTime || '',
        status: 'new',
        leadType: 'qualified',
        
        // Property details
        address: quote.address || '',
        propertyType: quote.propertyType || '',
        roofType: quote.roofType || '',
        
        // System details
        systemSizeKw: calculation.systemSpecs.solarKw,
        numPanels: calculation.systemSpecs.panelCount,
        batterySizeKwh: calculation.systemSpecs.batteryKwh,
        
        // Quote data
        quoteData: calculation,
        quoteReference: `SQ-${Date.now().toString().slice(-8)}`,
        
        updatedAt: new Date(),
        
        // Notes
        notes: `
Preferred Contact Time: ${contactInfo.preferredTime || 'Anytime'}
Additional Notes: ${contactInfo.notes || 'None'}

Selected Package: ${quote.selectedPackageName}
Customization Notes: ${quote.customizationNotes || 'None'}

System Configuration:
- Solar: ${calculation.systemSpecs.solarKw}kW (${calculation.systemSpecs.panelCount} panels)
- Battery: ${calculation.systemSpecs.batteryKwh}kWh
- Coverage: ${calculation.systemSpecs.coveragePercent}%

Products:
- Panels: ${calculation.products.panel.manufacturer} ${calculation.products.panel.model}
- Battery: ${calculation.products.battery ? `${calculation.products.battery.manufacturer} ${calculation.products.battery.model}` : 'None'}
- Inverter: ${calculation.products.inverter.manufacturer} ${calculation.products.inverter.model}

Investment: ${calculation.finalInvestment}
Annual Savings: ${calculation.savings.annual}
Payback: ${calculation.savings.paybackYears} years
        `.trim(),
      },
    });

    console.log('✅ Lead created:', lead.id);

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      leadId: lead.id,
      quoteReference: lead.quoteReference,
      message: 'Quote saved and lead created successfully',
    });

  } catch (error: any) {
    console.error('❌ Error saving final configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
