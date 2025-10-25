
/**
 * API Route: Create or Update Customer Quote
 * This is the SINGLE SOURCE OF TRUTH for quote creation and updates.
 * Called from calculator steps to progressively save quote data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateQuoteReference } from '@/lib/quote-reference';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      leadId,
      quoteId, // If updating existing quote
      // System Configuration
      systemSizeKw,
      panelCount,
      batterySizeKwh,
      // Brand Selections (IDs and names)
      panelBrandId,
      panelBrandName,
      panelBrandWattage,
      panelBrandTier,
      batteryBrandId,
      batteryBrandName,
      batteryBrandCapacity,
      batteryBrandTier,
      inverterBrandId,
      inverterBrandName,
      inverterBrandCapacity,
      inverterBrandTier,
      // Cost Breakdown
      panelSystemCost,
      batteryCost,
      inverterCost,
      installationCost,
      totalCostBeforeRebates,
      // Rebates
      federalSolarRebate,
      federalBatteryRebate,
      stateBatteryRebate,
      totalRebates,
      // Final Costs
      totalCostAfterRebates,
      // Payment Options
      depositAmount,
      depositPercentage,
      installmentMonths,
      monthlyPayment,
      // Savings Calculations
      annualSavings,
      year10Savings,
      year25Savings,
      paybackYears,
      roi,
      // Customer Usage Data
      quarterlyBill,
      dailyUsage,
      hasEv,
      planningEv,
      // Quote Status
      status,
    } = body;

    // Validate required fields (session or quote ID required to create/update)
    if (!sessionId && !quoteId) {
      return NextResponse.json(
        { error: 'Either sessionId or quoteId is required' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare quote data
    const quoteData: any = {
      sessionId: finalSessionId,
      leadId: leadId || null,
      status: status || 'draft',
    };

    // System Configuration
    if (systemSizeKw !== undefined) quoteData.systemSizeKw = systemSizeKw;
    if (panelCount !== undefined) quoteData.panelCount = panelCount;
    if (batterySizeKwh !== undefined) quoteData.batterySizeKwh = batterySizeKwh;

    // Brand Selections
    if (panelBrandId) {
      quoteData.panelBrandId = panelBrandId;
      quoteData.panelBrandName = panelBrandName || '';
      quoteData.panelBrandWattage = panelBrandWattage || 0;
      quoteData.panelBrandTier = panelBrandTier || 'premium';
    }

    if (batteryBrandId) {
      quoteData.batteryBrandId = batteryBrandId;
      quoteData.batteryBrandName = batteryBrandName || '';
      quoteData.batteryBrandCapacity = batteryBrandCapacity || 0;
      quoteData.batteryBrandTier = batteryBrandTier || 'premium';
    }

    if (inverterBrandId) {
      quoteData.inverterBrandId = inverterBrandId;
      quoteData.inverterBrandName = inverterBrandName || '';
      quoteData.inverterBrandCapacity = inverterBrandCapacity || 0;
      quoteData.inverterBrandTier = inverterBrandTier || 'premium';
    }

    // Cost Breakdown
    if (panelSystemCost !== undefined) quoteData.panelSystemCost = panelSystemCost;
    if (batteryCost !== undefined) quoteData.batteryCost = batteryCost;
    if (inverterCost !== undefined) quoteData.inverterCost = inverterCost;
    if (installationCost !== undefined) quoteData.installationCost = installationCost;
    if (totalCostBeforeRebates !== undefined) quoteData.totalCostBeforeRebates = totalCostBeforeRebates;

    // Rebates
    if (federalSolarRebate !== undefined) quoteData.federalSolarRebate = federalSolarRebate;
    if (federalBatteryRebate !== undefined) quoteData.federalBatteryRebate = federalBatteryRebate;
    if (stateBatteryRebate !== undefined) quoteData.stateBatteryRebate = stateBatteryRebate;
    if (totalRebates !== undefined) quoteData.totalRebates = totalRebates;

    // Final Costs
    if (totalCostAfterRebates !== undefined) {
      quoteData.totalCostAfterRebates = totalCostAfterRebates;
      quoteData.upfrontPayment = totalCostAfterRebates;
    }

    // Payment Options
    if (depositAmount !== undefined) quoteData.depositAmount = depositAmount;
    if (depositPercentage !== undefined) quoteData.depositPercentage = depositPercentage;
    if (installmentMonths !== undefined) quoteData.installmentMonths = installmentMonths;
    if (monthlyPayment !== undefined) quoteData.monthlyPayment = monthlyPayment;

    // Savings Calculations
    if (annualSavings !== undefined) quoteData.annualSavings = annualSavings;
    if (year10Savings !== undefined) quoteData.year10Savings = year10Savings;
    if (year25Savings !== undefined) quoteData.year25Savings = year25Savings;
    if (paybackYears !== undefined) quoteData.paybackYears = paybackYears;
    if (roi !== undefined) quoteData.roi = roi;

    // Customer Usage Data
    if (quarterlyBill !== undefined) quoteData.quarterlyBill = quarterlyBill;
    if (dailyUsage !== undefined) quoteData.dailyUsage = dailyUsage;
    if (hasEv !== undefined) quoteData.hasEv = hasEv;
    if (planningEv !== undefined) quoteData.planningEv = planningEv;

    // Create or update quote
    let savedQuote;
    
    if (quoteId) {
      // Update existing quote
      savedQuote = await prisma.customerQuote.update({
        where: { id: quoteId },
        data: {
          ...quoteData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Try to find existing quote by sessionId
      const existingQuote = await prisma.customerQuote.findUnique({
        where: { sessionId: finalSessionId },
      });

      if (existingQuote) {
        // Update existing quote
        savedQuote = await prisma.customerQuote.update({
          where: { id: existingQuote.id },
          data: {
            ...quoteData,
            updatedAt: new Date(),
          },
        });
      } else {
        // Generate quote reference only for new quotes
        let quoteReference = generateQuoteReference();
        
        // Ensure uniqueness
        let referenceExists = await prisma.customerQuote.findUnique({
          where: { quoteReference },
        });
        
        while (referenceExists) {
          quoteReference = generateQuoteReference();
          referenceExists = await prisma.customerQuote.findUnique({
            where: { quoteReference },
          });
        }
        
        quoteData.quoteReference = quoteReference;
        
        // Set valid until date (30 days from now)
        quoteData.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        // Create new quote
        savedQuote = await prisma.customerQuote.create({
          data: quoteData,
        });
      }
    }

    return NextResponse.json({
      success: true,
      quoteId: savedQuote.id,
      sessionId: savedQuote.sessionId,
      quoteReference: savedQuote.quoteReference,
      quote: savedQuote,
    });
  } catch (error: any) {
    console.error('Error creating/updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to save quote', details: error.message },
      { status: 500 }
    );
  }
}
