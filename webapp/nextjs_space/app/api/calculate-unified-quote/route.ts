/**
 * ============================================================================
 * UNIFIED QUOTE CALCULATION API - SINGLE SOURCE OF TRUTH
 * ============================================================================
 * 
 * This API endpoint is used by ALL calculator systems:
 * 1. Calculator-v2 (customer-facing)
 * 2. Quote Tester (admin backend)
 * 3. System Customizer (proposal slider)
 * 
 * All calculations use:
 * - Database-driven product pricing
 * - Database-driven rebate formulas
 * - Database-driven installation costs
 * - Centralized calculation services
 * 
 * NO HARDCODED VALUES - Everything from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateUnifiedQuote } from '@/lib/unified-quote-calculator';

interface UnifiedQuoteRequest {
  // System configuration
  systemSizeKw: number;
  batterySizeKwh?: number;
  panelCount?: number;
  
  // Location (for zone-based rebates)
  postcode?: string;
  region?: string;
  
  // Product selection (optional - will auto-select if not provided)
  panelProductId?: string;
  inverterProductId?: string;
  batteryProductId?: string;
  
  // Installation options
  includeInstallation?: boolean;
  installationMethod?: 'allin' | 'detailed' | 'inhouse';
  
  // Extra costs
  extraCostIds?: string[];
  
  // Usage data (for savings calculation)
  dailyConsumptionKwh?: number;
  quarterlyBill?: number;
  annualConsumption?: number;
}

interface UnifiedQuoteResponse {
  success: boolean;
  quote?: {
    // System Configuration
    systemSizeKw: number;
    panelCount: number;
    batterySizeKwh: number;
    batteryUnitsNeeded?: number;
    
    // Selected Products with full details
    selectedPanel: {
      id: string;
      name: string;
      sku: string;
      manufacturer: string;
      wattage: number;
      warrantyYears: number;
      tier: string;
      unitCost: number;
      retailPrice: number;
      markupPercent: number;
      supplierName: string;
    };
    selectedInverter: {
      id: string;
      name: string;
      sku: string;
      manufacturer: string;
      capacity: number;
      warrantyYears: number;
      tier: string;
      unitCost: number;
      retailPrice: number;
      markupPercent: number;
      supplierName: string;
    };
    selectedBattery?: {
      id: string;
      name: string;
      sku: string;
      manufacturer: string;
      capacity: number;
      warrantyYears: number;
      tier: string;
      unitCost: number;
      retailPrice: number;
      markupPercent: number;
      supplierName: string;
    };
    
    // Cost Breakdown
    costs: {
      panelCost: number;
      inverterCost: number;
      batteryCost: number;
      installationCost: number;
      extraCosts: number;
      subtotal: number;
    };
    
    // Rebates (from database formulas)
    rebates: {
      federalSolar: number;
      federalBattery: number;
      stateBattery: number;
      total: number;
      details: any;
    };
    
    // Final Pricing
    totalAfterRebates: number;
    gst: number;
    finalPrice: number;
    
    // Profit Analysis (wholesale vs retail)
    profit: {
      wholesaleCost: number;
      retailPrice: number;
      grossProfit: number;
      profitMargin: number;
    };
    
    // Production Data (for proposals and analysis)
    annualProductionKwh: number;
    monthlyProductionData: number[];
    
    // Savings Calculation (if usage data provided)
    savings?: {
      annualSavings: number;
      monthlySavings: number;
      paybackYears: number;
      year10Savings: number;
      year25Savings: number;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UnifiedQuoteResponse>> {
  try {
    const body = await request.json();
    
    // PUBLIC CALCULATORS (Solar & Slider): Always charge subbie + 15%
    // This is the CUSTOMER PRICE regardless of who does the installation
    // If company uses internal team, they make MORE PROFIT (lower cost, same price)
    const calculatorParams = {
      ...body,
      // Always calculate installation cost as: subbie rate + 15% commission
      installationMethod: 'allin', // Subcontractor all-in rate
      installationMarginPercent: 15, // 15% commission (configurable from settings)
      // Customer always pays subbie price, even if internal team is used
      useConservativePricing: true,
    };
    
    // Call the unified calculator function
    const quote = await calculateUnifiedQuote(calculatorParams);
    
    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error: any) {
    console.error('Error calculating unified quote:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate quote' },
      { status: 500 }
    );
  }
}
