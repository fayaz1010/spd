import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Customer-facing API for getting addons
 * Used in checkout drawer and customization page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showAtCheckout = searchParams.get('showAtCheckout');
    const showBeforeCheckout = searchParams.get('showBeforeCheckout');
    const category = searchParams.get('category');

    // Build where clause
    const where: any = {
      productType: 'ADDON',
      isAvailable: true,
    };

    // Get all addons with their pricing and installation info
    const addons = await prisma.product.findMany({
      where,
      include: {
        SupplierProduct: {
          where: { isActive: true },
          take: 1,
        },
        installationReqs: {
          include: {
            laborType: true,
          },
          take: 1,
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Format and filter addons
    const formattedAddons = addons
      .map((addon: any) => {
        const specs = addon.specifications as any;
        const supplier = addon.SupplierProduct[0];
        const installation = addon.installationReqs[0];

        // Apply filters
        if (showAtCheckout === 'true' && !specs?.showAtCheckout) {
          return null;
        }
        if (showBeforeCheckout === 'true' && !specs?.showBeforeCheckout) {
          return null;
        }
        if (category && specs?.addonCategory !== category) {
          return null;
        }

        const installationCost = (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0);

        return {
          id: addon.id,
          name: addon.name,
          manufacturer: addon.manufacturer,
          description: addon.description || '',
          addonCategory: specs?.addonCategory || 'general',
          showAtCheckout: specs?.showAtCheckout || false,
          showBeforeCheckout: specs?.showBeforeCheckout || false,
          benefits: specs?.benefits || [],
          iconName: specs?.iconName || 'Package',
          isRecommended: addon.isRecommended || false,
          sortOrder: addon.sortOrder || 0,
          
          // Pricing
          retailPrice: supplier?.retailPrice || 0,
          
          // Installation
          laborType: installation?.laborType?.name || null,
          laborHours: installation?.quantityMultiplier || 0,
          laborRate: installation?.laborType?.baseRate || 0,
          installationCost: installationCost,
          
          // Total
          totalCost: (supplier?.retailPrice || 0) + installationCost,
        };
      })
      .filter(Boolean);

    // Group by category
    const categories: Record<string, any[]> = {};
    formattedAddons.forEach((addon: any) => {
      if (!categories[addon.addonCategory]) {
        categories[addon.addonCategory] = [];
      }
      categories[addon.addonCategory].push(addon);
    });

    return NextResponse.json({
      success: true,
      addons: formattedAddons,
      categories,
    });

  } catch (error: any) {
    console.error('Error fetching addons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addons', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
