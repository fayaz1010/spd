/**
 * Calculator-v2 Adapter API
 * 
 * Adapts unified quote calculator response to Calculator-v2 expected format
 * Ensures all calculators use the same underlying logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateUnifiedQuote } from '@/lib/unified-quote-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      systemSizeKw,
      panelCount,
      panelProductId,
      inverterProductId,
      batteryProductId,
      batterySizeKwh,
      postcode,
      dailyConsumption,
    } = body;

    console.log('🧮 Calculator-v2: Calculating with unified system');

    // Call unified calculator
    const quote = await calculateUnifiedQuote({
      systemSizeKw,
      panelCount,
      panelProductId,
      inverterProductId,
      batteryProductId,
      batterySizeKwh: batterySizeKwh || 0,
      includeInstallation: true,
      useConservativePricing: true, // Public calculator always uses subbie rates
      postcode: postcode || '6000',
      region: 'WA',
      dailyConsumptionKwh: dailyConsumption,
    });

    // Adapt response to Calculator-v2 expected format
    const adapted = {
      systemSpecs: {
        solarKw: quote.systemSizeKw,
        panelCount: quote.panelCount,
        batteryKwh: quote.batterySizeKwh,
        dailyGeneration: quote.systemSizeKw * 4.4, // Perth average
        coveragePercent: dailyConsumption 
          ? Math.min(100, Math.round((quote.systemSizeKw * 4.4 / dailyConsumption) * 100))
          : 100,
      },
      costs: {
        panels: quote.costs.panelCost,
        battery: quote.costs.batteryCost,
        inverter: quote.costs.inverterCost,
        installation: quote.costs.installationCost,
        subtotal: quote.costs.subtotal,
      },
      rebates: {
        federalSolar: quote.rebates.federalSolar,
        federalBattery: quote.rebates.federalBattery,
        stateBattery: quote.rebates.stateBattery,
        total: quote.rebates.total,
      },
      finalInvestment: quote.finalPrice,
      savings: {
        annual: quote.savings?.annualSavings || 0,
        monthly: quote.savings?.monthlySavings || 0,
        year10: quote.savings?.year10Savings || 0,
        year25: quote.savings?.year25Savings || 0,
        paybackYears: quote.savings?.paybackYears || 0,
      },
      installationBreakdown: quote.costs.installationCost > 0 ? {
        base: quote.costs.installationCost * 0.6,
        complexity: quote.costs.installationCost * 0.2,
        labor: quote.costs.installationCost * 0.2,
      } : null,
      selectedPanel: quote.selectedPanel,
      selectedInverter: quote.selectedInverter,
      selectedBattery: quote.selectedBattery,
    };

    console.log('✅ Calculator-v2: Response adapted');

    return NextResponse.json(adapted);
  } catch (error) {
    console.error('❌ Calculator-v2 calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate quote' },
      { status: 500 }
    );
  }
}
