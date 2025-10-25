import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all active products grouped by category
 * UPDATED: Now uses Product table instead of old Brand tables
 */
export async function GET() {
  try {
    console.log('🔍 Fetching active products from Product table...');

    const [panels, batteries, inverters] = await Promise.all([
      prisma.product.findMany({
        where: { 
          productType: 'PANEL',
          isAvailable: true 
        },
        include: {
          SupplierProduct: {
            where: { 
              isActive: true,
              retailPrice: { not: null },
            },
            orderBy: { retailPrice: 'asc' },
            take: 1,
          },
        },
        orderBy: [
          { tier: 'asc' },
          { sortOrder: 'asc' },
        ],
      }),
      prisma.product.findMany({
        where: { 
          productType: 'BATTERY',
          isAvailable: true 
        },
        include: {
          SupplierProduct: {
            where: { 
              isActive: true,
              retailPrice: { not: null },
            },
            orderBy: { retailPrice: 'asc' },
            take: 1,
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
        ],
      }),
      prisma.product.findMany({
        where: { 
          productType: 'INVERTER',
          isAvailable: true 
        },
        include: {
          SupplierProduct: {
            where: { 
              isActive: true,
              retailPrice: { not: null },
            },
            orderBy: { retailPrice: 'asc' },
            take: 1,
          },
        },
        orderBy: [
          { tier: 'asc' },
          { sortOrder: 'asc' },
        ],
      }),
    ]);

    // Transform to match expected format
    const formattedPanels = panels.map((p: any) => {
      const specs = p.specifications as any;
      const supplier = p.SupplierProduct[0];
      return {
        id: p.id, // Product table ID (matches saved IDs)
        manufacturer: p.manufacturer,
        model: p.model || p.name,
        price: supplier?.retailPrice || supplier?.unitCost || 1200, // From SupplierProduct
        tier: p.tier,
        specifications: {
          wattage: specs.wattage || 400,
          warrantyYears: p.warrantyYears || 25,
          efficiency: specs.efficiency || 20,
        },
      };
    });

    const formattedBatteries = batteries.map((b: any) => {
      const specs = b.specifications as any;
      const supplier = b.SupplierProduct[0];
      return {
        id: b.id, // Product table ID (matches saved IDs)
        manufacturer: b.manufacturer,
        model: b.model || b.name,
        price: supplier?.retailPrice || supplier?.unitCost || 15000, // From SupplierProduct
        tier: b.tier,
        specifications: {
          capacityKwh: specs.capacityKwh || specs.capacity || 10,
          warrantyYears: b.warrantyYears || 10,
          cycleLife: specs.cycleLife || 6000,
        },
      };
    });

    const formattedInverters = inverters.map((i: any) => {
      const specs = i.specifications as any;
      const supplier = i.SupplierProduct[0];
      return {
        id: i.id, // Product table ID (matches saved IDs)
        manufacturer: i.manufacturer,
        model: i.model || i.name,
        price: supplier?.retailPrice || supplier?.unitCost || 2000, // From SupplierProduct (total price)
        tier: i.tier,
        specifications: {
          capacityKw: specs.capacity || specs.capacityKw || 10,
          warrantyYears: i.warrantyYears || 10,
          hasOptimizers: specs.hasOptimizers || false,
        },
      };
    });

    console.log(`✅ Found ${formattedPanels.length} panels, ${formattedBatteries.length} batteries, ${formattedInverters.length} inverters`);

    return NextResponse.json({
      success: true,
      products: {
        panels: formattedPanels,
        batteries: formattedBatteries,
        inverters: formattedInverters,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
