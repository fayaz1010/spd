
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { determineMarketingSegment } from '@/lib/marketing-segments';
import { generateQuoteReference } from '@/lib/quote-reference';
import { autoCreateDeal } from '@/lib/crm-auto-deal';

export const dynamic = 'force-dynamic';

/**
 * PHASE 3 FIX: Submit Lead API
 * This API now:
 * 1. Uses the existing CustomerQuote from previous steps (no recalculation)
 * 2. Creates a Lead record with contact info
 * 3. Links the Lead to the existing CustomerQuote
 * 4. Updates the CustomerQuote status to 'pending_contact'
 * 
 * NO MORE:
 * - Recalculating costs
 * - Fetching brands
 * - Creating duplicate CustomerQuote records
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      email,
      phone,
      preferredContactTime,
      comments,
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
      systemSizeKw,
      numPanels,
      batterySizeKwh,
      selectedAddons,
      quoteReference,
      quoteId, // CRITICAL: Must receive quoteId from Step 7
      // Advanced profile fields
      bedrooms,
      acTier,
      poolType,
      homeOfficeCount,
      dailyConsumption,
    } = body;

    // Validate required fields
    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone, and address are required' },
        { status: 400 }
      );
    }

    // Validate quoteId
    if (!quoteId) {
      return NextResponse.json(
        { error: 'Missing quoteId. Please ensure you have completed the calculator steps.' },
        { status: 400 }
      );
    }

    // Fetch the existing CustomerQuote
    const existingQuote = await prisma.customerQuote.findUnique({
      where: { id: quoteId },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found. Please restart the calculator.' },
        { status: 404 }
      );
    }

    // Determine marketing segment
    const marketingSegment = determineMarketingSegment({
      quarterlyBill: parseFloat(quarterlyBill) ?? 0,
      hasEv: hasEv ?? false,
      planningEv: planningEv ?? false,
      evCount: parseInt(evCount) ?? 0,
      poolType: poolType ?? 'none',
      acTier: acTier ?? 'moderate',
      homeOfficeCount: homeOfficeCount ? parseInt(homeOfficeCount) : 0,
      dailyConsumption: dailyConsumption ? parseFloat(dailyConsumption) : undefined,
      batterySizeKwh: parseFloat(batterySizeKwh) ?? 0,
      propertyType: propertyType ?? 'residential',
    });

    // Generate a proper quote reference if not provided
    let finalQuoteReference = quoteReference || existingQuote.quoteReference;
    if (!finalQuoteReference) {
      finalQuoteReference = generateQuoteReference();
      
      // Ensure uniqueness
      let referenceExists = await prisma.lead.findUnique({
        where: { quoteReference: finalQuoteReference },
      });
      
      while (referenceExists) {
        finalQuoteReference = generateQuoteReference();
        referenceExists = await prisma.lead.findUnique({
          where: { quoteReference: finalQuoteReference },
        });
      }
    }

    // Prepare quote data for Lead record (legacy field)
    const calculatedQuoteData = {
      systemSizeKw: existingQuote.systemSizeKw ?? 0,
      numPanels: existingQuote.panelCount ?? 0,
      batterySizeKwh: existingQuote.batterySizeKwh ?? 0,
      solarCost: existingQuote.panelSystemCost ?? 0,
      batteryCost: existingQuote.batteryCost ?? 0,
      inverterCost: existingQuote.inverterCost ?? 0,
      subtotal: existingQuote.totalCostBeforeRebates ?? 0,
      totalRebates: existingQuote.totalRebates ?? 0,
      finalTotal: existingQuote.totalCostAfterRebates ?? 0,
      annualSavings: existingQuote.annualSavings ?? 0,
      paybackYears: existingQuote.paybackYears,
      savings25Years: existingQuote.year25Savings,
      rebates: {
        federalSRES: existingQuote.federalSolarRebate,
        federalBattery: existingQuote.federalBatteryRebate,
        waBatteryScheme: existingQuote.stateBatteryRebate,
        totalRebates: existingQuote.totalRebates,
      },
      panelBrand: existingQuote.panelBrandName ? {
        id: existingQuote.panelBrandId,
        name: existingQuote.panelBrandName,
        wattage: existingQuote.panelBrandWattage,
      } : null,
      batteryBrand: existingQuote.batteryBrandName ? {
        id: existingQuote.batteryBrandId,
        name: existingQuote.batteryBrandName,
        capacityKwh: existingQuote.batteryBrandCapacity,
      } : null,
      inverterBrand: existingQuote.inverterBrandName ? {
        id: existingQuote.inverterBrandId,
        name: existingQuote.inverterBrandName,
        capacityKw: existingQuote.inverterBrandCapacity,
      } : null,
      selectedAddons: selectedAddons ?? [],
    };

    // Save lead to database with calculated quote data
    const lead = await prisma.lead.create({
      data: {
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        phone,
        preferredContactTime: preferredContactTime ?? 'anytime',
        address,
        propertyType: propertyType ?? 'residential',
        roofType: roofType ?? 'tile',
        quarterlyBill: parseFloat(quarterlyBill) ?? 0,
        householdSize: parseInt(householdSize) ?? 4,
        usagePattern: usagePattern ?? 'balanced',
        hasEv: hasEv ?? false,
        planningEv: planningEv ?? false,
        evCount: parseInt(evCount) ?? 0,
        hasElectricHotWater: hasElectricHotWater ?? false,
        systemSizeKw: existingQuote.systemSizeKw ?? 0,
        numPanels: existingQuote.panelCount ?? 0,
        batterySizeKwh: existingQuote.batterySizeKwh ?? 0,
        selectedAddons: selectedAddons ?? [],
        quoteReference: finalQuoteReference,
        quoteData: calculatedQuoteData,
        updatedAt: new Date(),
        // Advanced profile
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        acTier: acTier ?? 'moderate',
        poolType: poolType ?? 'none',
        homeOfficeCount: homeOfficeCount ? parseInt(homeOfficeCount) : 0,
        dailyConsumption: dailyConsumption ? parseFloat(dailyConsumption) : null,
        // Marketing segment
        marketingSegment,
      },
    });

    // Update the existing CustomerQuote with Lead ID and status
    const updatedQuote = await prisma.customerQuote.update({
      where: { id: existingQuote.id },
      data: {
        leadId: lead.id,
        quoteReference: finalQuoteReference,
        status: 'pending_contact',
        updatedAt: new Date(),
      },
    });

    // Auto-create CRM deal
    let deal = null;
    try {
      deal = await autoCreateDeal({
        leadId: lead.id,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        systemSizeKw: existingQuote.systemSizeKw ?? 0,
        batterySizeKwh: existingQuote.batterySizeKwh ?? 0,
        totalValue: existingQuote.totalCostAfterRebates ?? 0,
        leadSource: 'WEBSITE',
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      });
      console.log('✅ CRM deal auto-created:', deal.id);
    } catch (dealError) {
      console.error('Failed to auto-create deal:', dealError);
      // Don't fail the whole request if deal creation fails
    }

    // In a production app, you would send emails here using a service like SendGrid
    // For now, we'll just log it
    console.log('New lead created:', lead.id, lead.quoteReference);
    console.log('Customer quote updated:', updatedQuote.id, updatedQuote.quoteReference);
    console.log('Marketing Segment:', marketingSegment);
    console.log('Email would be sent to:', email);
    console.log('Notification would be sent to: sales@sundirectpower.com.au');

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      quoteId: updatedQuote.id,
      quoteReference: finalQuoteReference,
      marketingSegment,
      quoteData: calculatedQuoteData,
      dealId: deal?.id, // Include deal ID in response
    });
  } catch (error: any) {
    console.error('Lead submission error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Failed to submit lead' },
      { status: 500 }
    );
  }
}
