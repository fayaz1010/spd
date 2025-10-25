import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Extract key fields for debugging
    const debugInfo = {
      quoteId: quote.id,
      leadId: quote.leadId,
      customerName: quote.lead?.name,
      
      // System Info
      systemSizeKw: quote.systemSizeKw,
      panelCount: quote.panelCount,
      batterySizeKwh: quote.batterySizeKwh,
      
      // Financial Data
      totalCostIncGst: quote.totalCostIncGst,
      salePrice: quote.salePrice,
      totalRebates: quote.totalRebates,
      totalCostAfterRebates: quote.totalCostAfterRebates,
      
      // Rebates
      stcRebateAmount: quote.stcRebateAmount,
      federalBatteryRebate: quote.federalBatteryRebate,
      waStateRebateAmount: quote.waStateRebateAmount,
      
      // Production Data
      annualProductionKwh: quote.annualProductionKwh,
      monthlyProductionData: quote.monthlyProductionData,
      
      // Savings Data
      annualSavings: quote.annualSavings,
      year10Savings: quote.year10Savings,
      year25Savings: quote.year25Savings,
      paybackYears: quote.paybackYears,
      roi: quote.roi,
      
      // Bill Data
      bimonthlyBill: quote.bimonthlyBill,
      monthlyBillAmount: quote.monthlyBillAmount,
      quarterlyBill: quote.quarterlyBill,
      
      // Flags
      hasSavingsData: quote.hasSavingsData,
      hasBillData: quote.hasBillData,
      hasRoofAnalysis: quote.hasRoofAnalysis,
      
      // Timestamps
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: debugInfo,
      missingFields: {
        noProduction: !quote.annualProductionKwh || quote.annualProductionKwh === 0,
        noMonthlyData: !quote.monthlyProductionData,
        noSavings: !quote.annualSavings || quote.annualSavings === 0,
        noFinalPrice: !quote.salePrice || quote.salePrice === 0,
        noBillData: !quote.bimonthlyBill && !quote.monthlyBillAmount && !quote.quarterlyBill,
      },
    });
  } catch (error) {
    console.error('Error debugging quote:', error);
    return NextResponse.json(
      { error: 'Failed to debug quote' },
      { status: 500 }
    );
  }
}
