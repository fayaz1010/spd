import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * Customer-facing API for getting extra services
 * Used in /extra-services page
 */
export async function GET(request: NextRequest) {
  try {
    // Get all extra services from Product table
    const products = await prisma.product.findMany({
      where: {
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
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Filter for extra services only (showOnWebsite: true)
    const services = products
      .map((product: any) => {
        const specs = product.specifications as any;
        const supplier = product.SupplierProduct[0];
        const installation = product.installationReqs[0];

        // Only include services marked for website
        if (!specs?.showOnWebsite) {
          return null;
        }

        // Get pricing from specifications (for services) or supplier (for products)
        const retailPrice = specs?.retailPrice || supplier?.retailPrice || 0;
        const installationCost = specs?.installationCost || (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0);
        const totalCost = specs?.totalCost || (retailPrice + installationCost);

        return {
          id: product.id,
          name: product.name,
          manufacturer: product.manufacturer,
          description: product.description || '',
          imageUrl: product.imageUrl || null,
          specifications: {
            addonCategory: specs?.addonCategory || 'extra_services',
            serviceType: specs?.serviceType || 'general',
            benefits: specs?.benefits || [],
            iconName: specs?.iconName || 'Wrench',
            duration: specs?.duration || 'Varies',
            serviceArea: specs?.serviceArea || 'Perth Metro',
            seo: specs?.seo || {},
          },
          isRecommended: product.isRecommended || false,
          sortOrder: product.sortOrder || 0,
          retailPrice: retailPrice,
          installationCost: installationCost,
          totalCost: totalCost,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      services,
    });

  } catch (error: any) {
    console.error('Error fetching extra services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
