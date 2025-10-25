import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/package-templates
 * List all package templates (including inactive ones for admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const templates = await (prisma as any).systemPackageTemplate.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('❌ Error fetching package templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package templates', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/package-templates
 * Create a new package template
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'displayName', 'description', 'tier', 'solarSizingStrategy', 'batterySizingStrategy'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate ID if not provided
    const id = data.id || `template-${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Get the highest sortOrder to append new template at the end
    const maxSortOrder = await (prisma as any).systemPackageTemplate.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = data.sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1;

    const template = await (prisma as any).systemPackageTemplate.create({
      data: {
        id,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        tier: data.tier,
        sortOrder,
        active: data.active ?? true,
        
        // Solar sizing
        solarSizingStrategy: data.solarSizingStrategy,
        solarCoveragePercent: data.solarCoveragePercent || null,
        solarFixedKw: data.solarFixedKw || null,
        
        // Battery sizing
        batterySizingStrategy: data.batterySizingStrategy,
        batteryCoverageHours: data.batteryCoverageHours || null,
        batteryFixedKwh: data.batteryFixedKwh || null,
        
        // Features
        includeMonitoring: data.includeMonitoring ?? true,
        includeWarranty: data.includeWarranty || 'standard',
        includeMaintenance: data.includeMaintenance ?? false,
        
        // Pricing
        priceMultiplier: data.priceMultiplier ?? 1.0,
        discountPercent: data.discountPercent ?? 0,
        
        // UI elements
        badge: data.badge || null,
        highlightColor: data.highlightColor || null,
        features: data.features || [],
        
        updatedAt: new Date(),
      },
    });

    console.log('✅ Created package template:', template.id);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('❌ Error creating package template:', error);
    return NextResponse.json(
      { error: 'Failed to create package template', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
