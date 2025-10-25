import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { calculateSavings } from '@/lib/solar-data-helpers';

// Generate monthly production based on Perth seasonal patterns
function generateMonthlyProduction(annualProduction: number): number[] {
  const seasonalFactors = [
    0.095, // Jan - High
    0.090, // Feb - High
    0.088, // Mar - Medium-High
    0.080, // Apr - Medium
    0.070, // May - Medium-Low
    0.065, // Jun - Low
    0.068, // Jul - Low
    0.075, // Aug - Medium-Low
    0.082, // Sep - Medium
    0.090, // Oct - Medium-High
    0.095, // Nov - High
    0.102, // Dec - Highest
  ];
  
  return seasonalFactors.map(factor => Math.round(annualProduction * factor));
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch the quote
    const quote = await prisma.customerQuote.findUnique({
      where: { id: params.id },
      include: { lead: true },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const updates: any = {};

    // 1. Calculate/Estimate Annual Production if missing
    if (!quote.annualProductionKwh || quote.annualProductionKwh === 0) {
      // Estimate: systemSize (kW) × 1,400 hours (Perth average)
      const estimatedAnnualProduction = quote.systemSizeKw * 1400;
      updates.annualProductionKwh = estimatedAnnualProduction;
      console.log(`Estimated annual production: ${estimatedAnnualProduction} kWh`);
    }

    // 2. Generate Monthly Production Data if missing
    const annualProduction = updates.annualProductionKwh || quote.annualProductionKwh || 0;
    if (annualProduction > 0 && !quote.monthlyProductionData) {
      const monthlyData = generateMonthlyProduction(annualProduction);
      updates.monthlyProductionData = JSON.stringify(monthlyData);
      console.log('Generated monthly production data');
    }

    // 3. Calculate Savings if we have bill data
    const bimonthlyBill = quote.bimonthlyBill || quote.lead?.quarterlyBill;
    if (bimonthlyBill && annualProduction > 0) {
      const monthlyBill = bimonthlyBill / 2;
      // Use the correct price field - try multiple options
      const systemCost = quote.salePrice || quote.totalCostAfterRebates || quote.totalCostIncGst || 0;

      const savingsData = calculateSavings({
        monthlyBill,
        annualProduction,
        systemSizeKw: quote.systemSizeKw,
        systemCost,
      });

      updates.savingsDataJson = savingsData as any;
      updates.annualSavings = savingsData.annualSavings;
      updates.roi = savingsData.roi;
      updates.paybackYears = savingsData.paybackYears;
      updates.year25Savings = savingsData.year25Savings;
      updates.hasSavingsData = true;
      updates.hasBillData = true;
      
      console.log(`Calculated savings: $${savingsData.annualSavings}/year, payback: ${savingsData.paybackYears} years`);
    }

    // 4. Calculate Final Price if missing
    if ((!quote.salePrice || quote.salePrice === 0) && quote.totalCostIncGst) {
      const totalRebates = (quote.stcRebateAmount || 0) + 
                          (quote.federalBatteryRebate || 0) + 
                          (quote.waStateRebateAmount || 0);
      updates.salePrice = quote.totalCostIncGst - totalRebates;
      console.log(`Calculated final price: $${updates.salePrice}`);
    }

    // Update the quote
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      
      const updatedQuote = await prisma.customerQuote.update({
        where: { id: params.id },
        data: updates,
      });

      return NextResponse.json({
        success: true,
        message: 'Quote recalculated successfully',
        updates: {
          annualProduction: updatedQuote.annualProductionKwh,
          monthlyProductionGenerated: !!updates.monthlyProductionData,
          savingsCalculated: !!updates.annualSavings,
          finalPrice: updatedQuote.salePrice,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No recalculation needed - all data present',
      });
    }
  } catch (error) {
    console.error('Error recalculating quote:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate quote' },
      { status: 500 }
    );
  }
}
