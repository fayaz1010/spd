import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/pdf-generator';
import { sendEmail } from '@/lib/email-service';
import { quoteConfirmationEmail } from '@/lib/email-templates';
import {
  geocodeAddress,
  fetchGoogleSolarData,
  calculateMonthlyProduction,
  calculateSavings,
} from '@/lib/solar-data-helpers';
import { generateProposalToken } from '@/lib/token-helpers';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quote, customer } = body;

    if (!quote || !customer) {
      return NextResponse.json(
        { success: false, error: 'Missing quote or customer data' },
        { status: 400 }
      );
    }

    // Validate required address
    if (!customer.address) {
      return NextResponse.json(
        { success: false, error: 'Customer address is required for roof analysis' },
        { status: 400 }
      );
    }

    console.log('🔍 Step 1: Geocoding address:', customer.address);

    // STEP 1: Geocode the address
    const geocodeResult = await geocodeAddress(customer.address);
    if (!geocodeResult) {
      return NextResponse.json(
        { success: false, error: 'Invalid address - could not geocode. Please check the address and try again.' },
        { status: 400 }
      );
    }

    console.log('✅ Geocoded:', geocodeResult.formattedAddress, `(${geocodeResult.lat}, ${geocodeResult.lng})`);
    console.log('🛰️ Step 2: Fetching Google Solar data...');

    // STEP 2: Fetch Google Solar API data
    const solarData = await fetchGoogleSolarData(geocodeResult.lat, geocodeResult.lng);
    if (!solarData) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve roof analysis for this address. The property may not have sufficient satellite imagery.' },
        { status: 400 }
      );
    }

    console.log('✅ Solar data retrieved:', {
      maxPanels: solarData.maxArrayPanelsCount,
      sunshineHours: solarData.maxSunshineHoursPerYear,
      roofSegments: solarData.roofSegmentStats.length,
    });
    console.log('⚡ Step 3: Calculating production estimates...');

    // STEP 3: Calculate production estimates
    const production = calculateMonthlyProduction({
      systemSizeKw: quote.systemSizeKw,
      sunshineHours: solarData.maxSunshineHoursPerYear,
      latitude: geocodeResult.lat,
    });

    console.log('✅ Production calculated:', {
      annual: production.annualProduction,
      daily: production.dailyAverage,
    });

    // STEP 4: Calculate savings (if bill provided)
    let savingsData = null;
    if (customer.monthlyBill && customer.monthlyBill > 0) {
      console.log('💰 Step 4: Calculating savings with bill:', customer.monthlyBill);
      savingsData = calculateSavings({
        monthlyBill: customer.monthlyBill,
        annualProduction: production.annualProduction,
        systemSizeKw: quote.systemSizeKw,
        systemCost: quote.finalPrice,
      });
      console.log('✅ Savings calculated:', {
        annualSavings: savingsData.annualSavings,
        payback: savingsData.paybackYears,
        roi: savingsData.roi,
      });
    } else {
      console.log('ℹ️ Step 4: Skipping savings calculation (no bill provided)');
    }

    // Generate quote reference
    const quoteReference = `SDP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create or find lead
    let lead = await prisma.lead.findFirst({
      where: { email: customer.email },
    });

    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          id: `lead_${Date.now()}`,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address || '',
          status: 'NEW',
          source: 'QUOTE_TESTER',
          systemSizeKw: quote.systemSizeKw,
          numPanels: quote.panelCount,
          batterySizeKwh: quote.batterySizeKwh || 0,
          quoteData: {},
          quoteReference: `TEMP-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log('💾 Step 5: Saving quote to database...');

    // Create customer quote with all data
    const customerQuote = await prisma.customerQuote.create({
      data: {
        id: `quote_${Date.now()}`,
        quoteReference,
        leadId: lead.id,
        
        // System details
        systemSizeKw: quote.systemSizeKw,
        panelCount: quote.panelCount,
        batterySizeKwh: quote.batterySizeKwh || 0,
        
        // Products
        panelBrandName: quote.selectedPanel?.name || '',
        panelBrandWattage: quote.selectedPanel?.specifications?.wattage || 0,
        inverterBrandName: quote.selectedInverter?.name || '',
        batteryBrandName: quote.selectedBattery?.name || '',
        batteryBrandCapacity: quote.selectedBattery?.specifications?.capacity || 0,
        
        // Costs
        panelSystemCost: quote.panelCost,
        inverterCost: quote.inverterCost,
        batteryCost: quote.batteryCost,
        installationCost: quote.installationCost,
        totalCostBeforeRebates: quote.subtotal,
        
        // Rebates
        federalSolarRebate: quote.stcRebate,
        federalBatteryRebate: quote.federalBatteryRebate,
        stateBatteryRebate: quote.stateBatteryRebate,
        totalRebates: quote.totalRebates,
        
        // Final pricing
        totalCostAfterRebates: quote.totalAfterRebates,
        totalCostIncGst: quote.finalPrice,
        salePrice: quote.finalPrice,
        
        // NEW: Location data from geocoding
        address: geocodeResult.formattedAddress,
        latitude: geocodeResult.lat,
        longitude: geocodeResult.lng,
        suburb: geocodeResult.suburb,
        
        // NEW: Roof analysis data from Google Solar
        roofAnalysisData: solarData as any,
        
        // NEW: Production data
        monthlyProductionData: production.monthlyProduction as any,
        annualProductionKwh: production.annualProduction,
        
        // NEW: Bill data (if provided)
        monthlyBillAmount: customer.monthlyBill || null,
        
        // NEW: Savings data (if calculated)
        savingsDataJson: savingsData as any,
        annualSavings: savingsData?.annualSavings || Math.round(quote.systemSizeKw * 1200 * 0.30),
        year25Savings: savingsData?.year20Savings || Math.round(quote.systemSizeKw * 1200 * 0.30 * 25),
        paybackYears: savingsData?.paybackYears || (quote.finalPrice / (quote.systemSizeKw * 1200 * 0.30)),
        roi: savingsData?.roi || null,
        
        // NEW: Data tracking flags
        quoteSource: 'manual',
        hasRoofAnalysis: true,
        hasBillData: !!customer.monthlyBill,
        hasSavingsData: !!savingsData,
        
        // Metadata
        status: 'PENDING',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Quote saved:', customerQuote.id);

    // Generate proposal token for secure access
    const proposalToken = generateProposalToken();
    const proposalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5123'}/proposal/${proposalToken}`;

    // Create proposal tracking (we'll need to create a Deal first or make dealId optional)
    // For now, we'll skip this and add it when we have the Deal system
    // TODO: Create ProposalTracking record

    console.log('🔗 Proposal URL:', proposalUrl);

    // Generate PDF
    const quoteData = {
      quoteReference,
      systemSizeKw: quote.systemSizeKw,
      numPanels: quote.panelCount,
      batterySizeKwh: quote.batterySizeKwh || 0,
      subtotal: quote.subtotal,
      totalRebates: quote.totalRebates,
      finalTotal: quote.finalPrice,
      solarCost: quote.panelCost,
      batteryCost: quote.batteryCost,
      inverterCost: quote.inverterCost,
      installationCost: quote.installationCost,
      annualSavings: Math.round(quote.systemSizeKw * 1200 * 0.30),
      savings25Years: Math.round(quote.systemSizeKw * 1200 * 0.30 * 25),
      paybackYears: quote.finalPrice / (quote.systemSizeKw * 1200 * 0.30),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rebates: {
        federalSRES: quote.stcRebate,
        federalBattery: quote.federalBatteryRebate,
        waBatteryScheme: quote.stateBatteryRebate,
      },
      panelBrand: {
        name: quote.selectedPanel?.name || '',
        wattage: quote.selectedPanel?.specifications?.wattage || 0,
      },
      batteryBrand: {
        name: quote.selectedBattery?.name || '',
        capacity: quote.selectedBattery?.specifications?.capacity || 0,
      },
      inverterBrand: {
        name: quote.selectedInverter?.name || '',
      },
    };

    const companySettings = {
      companyName: 'Sun Direct Power',
      primaryColor: '#2563eb',
    };

    const pdfElement = QuotePDF({ quoteData, companySettings });
    const pdfBuffer = await renderToBuffer(pdfElement as any);

    // Generate email HTML
    const emailHtml = quoteConfirmationEmail({
      customerName: customer.name,
      quoteReference,
      systemSize: quote.systemSizeKw,
      totalCost: quote.finalPrice,
      annualSavings: Math.round(quote.systemSizeKw * 1200 * 0.30),
      quoteUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5123'}/confirmation?quoteId=${customerQuote.id}`,
    });

    // Send email with PDF attachment
    await sendEmail({
      to: customer.email,
      subject: `Your Solar Quote - ${quoteReference}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${quoteReference}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log('✅ Quote generation complete!');

    return NextResponse.json({
      success: true,
      quoteReference,
      quoteId: customerQuote.id,
      leadId: lead.id,
      hasRoofAnalysis: true,
      hasBillData: !!customer.monthlyBill,
      hasSavingsData: !!savingsData,
      production: {
        annual: production.annualProduction,
        daily: production.dailyAverage,
      },
      savings: savingsData ? {
        annual: savingsData.annualSavings,
        payback: savingsData.paybackYears,
        roi: savingsData.roi,
      } : null,
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}
