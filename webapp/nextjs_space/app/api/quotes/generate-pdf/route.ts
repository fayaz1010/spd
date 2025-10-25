import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/pdf-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Fetch quote from database
    const quote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
      include: {
        signature: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Transform database quote to PDF format
    const quoteData = {
      quoteReference: quote.quoteReference,
      systemSizeKw: quote.systemSizeKw,
      numPanels: quote.panelCount,
      batterySizeKwh: quote.batterySizeKwh,
      subtotal: quote.totalCostBeforeRebates,
      totalRebates: quote.totalRebates,
      finalTotal: quote.totalCostAfterRebates,
      solarCost: quote.panelSystemCost,
      batteryCost: quote.batteryCost,
      inverterCost: quote.inverterCost,
      installationCost: quote.installationCost,
      annualSavings: quote.annualSavings,
      savings25Years: quote.year25Savings,
      paybackYears: quote.paybackYears,
      validUntil: quote.validUntil,
      rebates: {
        federalSRES: quote.federalSolarRebate,
        federalBattery: quote.federalBatteryRebate,
        waBatteryScheme: quote.stateBatteryRebate,
      },
      panelBrand: {
        name: quote.panelBrandName,
        wattage: quote.panelBrandWattage,
      },
      batteryBrand: {
        name: quote.batteryBrandName,
        capacity: quote.batteryBrandCapacity,
      },
      inverterBrand: {
        name: quote.inverterBrandName,
      },
    };

    // Company settings (you can fetch from database if you have a settings table)
    const companySettings = {
      companyName: 'Sun Direct Power',
      primaryColor: '#2563eb',
      // logoUrl: 'https://yourdomain.com/logo.png', // Add your logo URL
    };

    // Signature data if available
    const signature = quote.signature ? {
      signatureData: quote.signature.signatureData,
      signedBy: quote.signature.signedBy,
      signedAt: quote.signature.signedAt.toISOString(),
    } : undefined;

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      QuotePDF({ quoteData, companySettings, signature } as any) as any
    );

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quoteReference || quoteId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
