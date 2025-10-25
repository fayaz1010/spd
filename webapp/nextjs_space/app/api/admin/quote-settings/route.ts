import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/quote-settings
 * Get quote settings
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get settings from database
    const settings = await (prisma as any).quoteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      return NextResponse.json({
        success: true,
        settings: {
          depositType: settings.depositType || 'percentage',
          depositPercentage: settings.depositPercentage || 30,
          depositFixedAmount: settings.depositFixedAmount || 5000,
          quoteValidityDays: settings.quoteValidityDays || 30,
          defaultPriceMultiplier: settings.defaultPriceMultiplier || 1.3,
          gstRate: settings.gstRate || 10,
          showPackageComparison: settings.showPackageComparison ?? true,
          allowCustomPackages: settings.allowCustomPackages ?? false,
          termsAndConditions: settings.termsAndConditions || '',
          paymentTerms: settings.paymentTerms || '',
        },
      });
    }

    // Return defaults if no settings exist
    return NextResponse.json({
      success: true,
      settings: {
        depositType: 'percentage',
        depositPercentage: 30,
        depositFixedAmount: 5000,
        quoteValidityDays: 30,
        defaultPriceMultiplier: 1.3,
        gstRate: 10,
        showPackageComparison: true,
        allowCustomPackages: false,
        termsAndConditions: '',
        paymentTerms: '30% deposit required upon acceptance. Balance due upon completion of installation.',
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching quote settings:', error);
    
    // Return defaults on error
    return NextResponse.json({
      success: true,
      settings: {
        depositType: 'percentage',
        depositPercentage: 30,
        depositFixedAmount: 5000,
        quoteValidityDays: 30,
        defaultPriceMultiplier: 1.3,
        gstRate: 10,
        showPackageComparison: true,
        allowCustomPackages: false,
        termsAndConditions: '',
        paymentTerms: '30% deposit required upon acceptance. Balance due upon completion of installation.',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/quote-settings
 * Save quote settings
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Delete existing settings (we only keep one record)
    await (prisma as any).quoteSettings.deleteMany({});

    // Create new settings
    const settings = await (prisma as any).quoteSettings.create({
      data: {
        depositType: data.depositType || 'percentage',
        depositPercentage: parseFloat(data.depositPercentage) || 30,
        depositFixedAmount: parseFloat(data.depositFixedAmount) || 5000,
        quoteValidityDays: parseInt(data.quoteValidityDays) || 30,
        defaultPriceMultiplier: parseFloat(data.defaultPriceMultiplier) || 1.3,
        gstRate: parseFloat(data.gstRate) || 10,
        showPackageComparison: data.showPackageComparison ?? true,
        allowCustomPackages: data.allowCustomPackages ?? false,
        termsAndConditions: data.termsAndConditions || '',
        paymentTerms: data.paymentTerms || '',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Quote settings saved');

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('❌ Error saving quote settings:', error);
    return NextResponse.json(
      { error: 'Failed to save quote settings', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
