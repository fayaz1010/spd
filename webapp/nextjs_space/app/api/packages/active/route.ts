import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch active package templates
    const packages = await prisma.systemPackageTemplate.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform for frontend
    const transformedPackages = packages.map(pkg => {
      const features = pkg.features as any;
      
      return {
        id: pkg.id,
        name: pkg.name,
        displayName: pkg.displayName,
        description: pkg.description,
        tier: pkg.tier,
        badge: pkg.badge,
        sortOrder: pkg.sortOrder,
        
        // System specs
        systemSizeKw: features?.systemSizeKw || pkg.solarFixedKw || 0,
        panelCount: features?.panelCount || 0,
        batterySizeKwh: features?.batterySizeKwh || pkg.batteryFixedKwh || 0,
        
        // Pricing
        subtotal: features?.subtotal || 0,
        totalRebates: features?.totalRebates || 0,
        finalPrice: features?.finalPrice || 0,
        costPerDay: features?.costPerDay || 0,
        
        // Savings
        annualSavings: features?.annualSavings || 0,
        year25Savings: features?.year25Savings || 0,
        paybackYears: features?.paybackYears || 0,
        
        // Display
        suitability: features?.suitability || '',
        dailyUsage: features?.dailyUsage || '',
        featureList: features?.featureList || [],
        
        // Marketing
        heroImageUrl: features?.heroImageUrl || null,
        infographicUrl: features?.infographicUrl || null,
        hookText: features?.hookText || null,
        ctaText: features?.ctaText || 'Get This Package Now',
        
        // Products (for reference)
        panelProduct: features?.panelProduct || null,
        inverterProduct: features?.inverterProduct || null,
        batteryProduct: features?.batteryProduct || null,
      };
    });

    return NextResponse.json({
      success: true,
      packages: transformedPackages,
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
