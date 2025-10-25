import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Fetch all active packages
    const packages = await prisma.systemPackageTemplate.findMany({
      where: { active: true },
    });

    let updatedCount = 0;

    for (const pkg of packages) {
      const features = pkg.features as any;
      if (!features || !features.panelProduct?.id) continue;

      // Fetch current product prices
      const panelProduct = await prisma.product.findUnique({
        where: { id: features.panelProduct.id },
        include: {
          SupplierProduct: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      const inverterProduct = await prisma.product.findUnique({
        where: { id: features.inverterProduct.id },
        include: {
          SupplierProduct: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      let batteryProduct = null;
      if (features.batteryProduct?.id) {
        batteryProduct = await prisma.product.findUnique({
          where: { id: features.batteryProduct.id },
          include: {
            SupplierProduct: {
              where: { isActive: true },
              take: 1,
            },
          },
        });
      }

      if (!panelProduct || !inverterProduct) continue;

      // Recalculate costs
      const panelCost = (panelProduct.SupplierProduct[0]?.retailPrice || 0) * features.panelCount;
      const inverterCost = inverterProduct.SupplierProduct[0]?.retailPrice || 0;
      const batteryCost = batteryProduct ? (batteryProduct.SupplierProduct[0]?.retailPrice || 0) * (features.batteryProduct.unitsNeeded || 1) : 0;

      // Installation cost - use unified system with subcontractor rates
      const { calculateInstallationCost } = await import('@/lib/installation-cost-calculator');
      const installationResult = await calculateInstallationCost({
        systemSize: features.systemSizeKw,
        panelCount: features.panelCount,
        hasBattery: (features.batterySizeKwh || 0) > 0,
        batteryCapacity: features.batterySizeKwh || 0,
        batteryType: 'dc_coupled',
        isRetrofit: false,
        storeys: 1,
        roofType: 'tile',
        roofPitch: 'standard',
        orientation: 'portrait',
        rakedCeilings: false,
        phases: 1,
        hasOptimisers: false,
        additionalInverters: 0,
        splits: 0,
        preferredProvider: 'SUBCONTRACTOR', // Use Kluem rates for packages
      });
      const installationCost = installationResult.total;

      const subtotal = panelCost + inverterCost + batteryCost + installationCost;

      // Recalculate rebates (simplified)
      const stcRebate = features.systemSizeKw * 550; // Rough estimate
      const federalBatteryRebate = features.batterySizeKwh > 0 ? features.batterySizeKwh * 200 : 0;
      const stateBatteryRebate = features.batterySizeKwh >= 13.5 ? 3000 : 0;
      const totalRebates = stcRebate + federalBatteryRebate + stateBatteryRebate;

      const finalPrice = subtotal - totalRebates;
      const costPerDay = (finalPrice / 365 / 10).toFixed(2);

      // Recalculate savings
      const annualSavings = Math.round(features.systemSizeKw * 1200 * 0.30);
      const year25Savings = annualSavings * 25;
      const paybackYears = (finalPrice / annualSavings).toFixed(1);

      // Update features
      const updatedFeatures = {
        ...features,
        subtotal,
        totalRebates,
        finalPrice,
        costPerDay: parseFloat(costPerDay),
        annualSavings,
        year25Savings,
        paybackYears: parseFloat(paybackYears),
      };

      // Update package
      await prisma.systemPackageTemplate.update({
        where: { id: pkg.id },
        data: {
          features: updatedFeatures,
          updatedAt: new Date(),
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      message: `Successfully recalculated ${updatedCount} packages`,
    });
  } catch (error) {
    console.error('Error recalculating packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to recalculate packages' },
      { status: 500 }
    );
  }
}
