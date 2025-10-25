import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/installation-pricing
 * Get current installation pricing configuration
 */
export async function GET(request: NextRequest) {
  try {
    const pricing = await prisma.installationPricing.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!pricing) {
      return NextResponse.json(
        { error: 'Installation pricing not configured' },
        { status: 404 }
      );
    }

    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error('Error fetching installation pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installation pricing' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/admin/installation-pricing
 * Update installation pricing configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    // Update pricing
    const updated = await prisma.installationPricing.update({
      where: { id: data.id },
      data: {
        baseCalloutFee: data.baseCalloutFee,
        hourlyRate: data.hourlyRate,
        minimumCharge: data.minimumCharge,
        panelInstallPerUnit: data.panelInstallPerUnit,
        railingPerMeter: data.railingPerMeter,
        inverterInstall: data.inverterInstall,
        batteryInstallBase: data.batteryInstallBase,
        batteryInstallPerKwh: data.batteryInstallPerKwh,
        cablingPerMeter: data.cablingPerMeter,
        commissioningFee: data.commissioningFee,
        evCharger7kwInstall: data.evCharger7kwInstall,
        evCharger22kwInstall: data.evCharger22kwInstall,
        hotWaterInstall: data.hotWaterInstall,
        monitoringInstall: data.monitoringInstall,
        surgeProtectionInstall: data.surgeProtectionInstall,
        tileRoofMultiplier: data.tileRoofMultiplier,
        metalRoofMultiplier: data.metalRoofMultiplier,
        flatRoofMultiplier: data.flatRoofMultiplier,
        twoStoryMultiplier: data.twoStoryMultiplier,
        difficultAccessMult: data.difficultAccessMult,
        asbestosRemoval: data.asbestosRemoval,
        scaffoldingRequired: data.scaffoldingRequired,
        avgRailingPerKw: data.avgRailingPerKw,
        avgCablingPerKw: data.avgCablingPerKw,
        internalMarginPercent: data.internalMarginPercent,
        subbieCommissionPercent: data.subbieCommissionPercent,
        notes: data.notes || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      pricing: updated,
    });
  } catch (error: any) {
    console.error('Error updating installation pricing:', error);
    return NextResponse.json(
      { error: 'Failed to update installation pricing' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/installation-pricing
 * Create new installation pricing configuration
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Deactivate existing pricing
    await prisma.installationPricing.updateMany({
      where: { active: true },
      data: { active: false },
    });

    // Create new pricing
    const pricing = await prisma.installationPricing.create({
      data: {
        id: `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        baseCalloutFee: data.baseCalloutFee || 500,
        hourlyRate: data.hourlyRate || 85,
        minimumCharge: data.minimumCharge || 800,
        panelInstallPerUnit: data.panelInstallPerUnit || 50,
        railingPerMeter: data.railingPerMeter || 25,
        inverterInstall: data.inverterInstall || 300,
        batteryInstallBase: data.batteryInstallBase || 500,
        batteryInstallPerKwh: data.batteryInstallPerKwh || 50,
        cablingPerMeter: data.cablingPerMeter || 15,
        commissioningFee: data.commissioningFee || 400,
        evCharger7kwInstall: data.evCharger7kwInstall || 800,
        evCharger22kwInstall: data.evCharger22kwInstall || 1200,
        hotWaterInstall: data.hotWaterInstall || 1200,
        monitoringInstall: data.monitoringInstall || 150,
        surgeProtectionInstall: data.surgeProtectionInstall || 200,
        tileRoofMultiplier: data.tileRoofMultiplier || 1.2,
        metalRoofMultiplier: data.metalRoofMultiplier || 1.0,
        flatRoofMultiplier: data.flatRoofMultiplier || 1.1,
        twoStoryMultiplier: data.twoStoryMultiplier || 1.3,
        difficultAccessMult: data.difficultAccessMult || 1.4,
        asbestosRemoval: data.asbestosRemoval || 2000,
        scaffoldingRequired: data.scaffoldingRequired || 1500,
        avgRailingPerKw: data.avgRailingPerKw || 4,
        avgCablingPerKw: data.avgCablingPerKw || 10,
        region: data.region || 'WA',
        active: true,
        notes: data.notes || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error: any) {
    console.error('Error creating installation pricing:', error);
    return NextResponse.json(
      { error: 'Failed to create installation pricing' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
