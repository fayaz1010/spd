import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Save selected addons to a customer quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, addonIds } = body;

    if (!sessionId || !Array.isArray(addonIds)) {
      return NextResponse.json(
        { error: 'sessionId and addonIds array are required' },
        { status: 400 }
      );
    }

    console.log(`💾 Saving ${addonIds.length} addons to quote ${sessionId}`);

    // Get addon details
    const addons = await prisma.product.findMany({
      where: {
        id: { in: addonIds },
        productType: 'ADDON',
        isAvailable: true,
      },
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
    });

    if (addons.length === 0) {
      return NextResponse.json(
        { error: 'No valid addons found' },
        { status: 404 }
      );
    }

    // Calculate total addon cost
    let totalAddonCost = 0;
    const addonData = addons.map((addon: any) => {
      const supplier = addon.SupplierProduct?.[0];
      const installation = addon.installationReqs?.[0];
      
      const retailPrice = supplier?.retailPrice || 0;
      const installationCost = (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0);
      const totalCost = retailPrice + installationCost;
      
      totalAddonCost += totalCost;

      return {
        id: addon.id,
        name: addon.name,
        manufacturer: addon.manufacturer,
        retailPrice: retailPrice,
        installationCost: installationCost,
        totalCost: totalCost,
      };
    });

    // Get current quote
    const currentQuote = await prisma.customerQuote.findUnique({
      where: { sessionId },
    });

    if (!currentQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Update quote with addons
    const updatedQuote = await prisma.customerQuote.update({
      where: { sessionId },
      data: {
        // Optionally update total cost
        totalCostAfterRebates: (currentQuote.totalCostAfterRebates || 0) + totalAddonCost,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Saved ${addonData.length} addons (total: $${totalAddonCost})`);

    return NextResponse.json({
      success: true,
      addons: addonData,
      totalAddonCost,
      newTotal: (currentQuote.totalCostAfterRebates || 0) + totalAddonCost,
    });

  } catch (error: any) {
    console.error('❌ Error saving addons:', error);
    return NextResponse.json(
      { error: 'Failed to save addons', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
