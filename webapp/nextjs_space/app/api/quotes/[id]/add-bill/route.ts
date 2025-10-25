import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateSavings } from '@/lib/solar-data-helpers';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { monthlyBill } = await request.json();

    if (!monthlyBill || monthlyBill <= 0) {
      return NextResponse.json(
        { error: 'Valid monthly bill amount required' },
        { status: 400 }
      );
    }

    // Fetch the quote
    const quote = await prisma.customerQuote.findUnique({
      where: { id: params.id },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Calculate savings
    const savingsData = calculateSavings({
      monthlyBill,
      annualProduction: quote.annualProductionKwh || 0,
      systemSizeKw: quote.systemSizeKw,
      systemCost: quote.salePrice || quote.totalCostIncGst || 0,
    });

    // Update quote with bill and savings data
    const updatedQuote = await prisma.customerQuote.update({
      where: { id: params.id },
      data: {
        monthlyBillAmount: monthlyBill,
        savingsDataJson: savingsData as any,
        annualSavings: savingsData.annualSavings,
        roi: savingsData.roi,
        paybackYears: savingsData.paybackYears,
        hasBillData: true,
        hasSavingsData: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      savings: savingsData,
    });
  } catch (error) {
    console.error('Error adding bill amount:', error);
    return NextResponse.json(
      { error: 'Failed to add bill amount' },
      { status: 500 }
    );
  }
}
