import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Admin API for managing extra services
 */

// GET all extra services
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: {
        productType: 'ADDON',
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
        { name: 'asc' }
      ],
    });

    // Filter for extra services (those with serviceType in specifications)
    const services = products
      .map((product: any) => {
        const specs = product.specifications as any;
        
        // Only include if it has a serviceType (extra services)
        if (!specs?.serviceType) {
          return null;
        }

        const supplier = product.SupplierProduct[0];
        const installation = product.installationReqs[0];
        const installationCost = (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0);

        return {
          id: product.id,
          name: product.name,
          manufacturer: product.manufacturer,
          description: product.description || '',
          imageUrl: product.imageUrl || null,
          specifications: {
            addonCategory: specs?.addonCategory || 'extra_services',
            serviceType: specs?.serviceType || 'general',
            showOnWebsite: specs?.showOnWebsite || false,
            benefits: specs?.benefits || [],
            iconName: specs?.iconName || 'Wrench',
            duration: specs?.duration || 'Varies',
            serviceArea: specs?.serviceArea || 'Perth Metro',
          },
          isRecommended: product.isRecommended || false,
          isAvailable: product.isAvailable,
          sortOrder: product.sortOrder || 0,
          retailPrice: supplier?.retailPrice || specs?.retailPrice || 0,
          installationCost: specs?.installationCost || installationCost,
          totalCost: specs?.totalCost || ((supplier?.retailPrice || specs?.retailPrice || 0) + installationCost),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching extra services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate unique ID
    const id = `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sku = `SVC-${Date.now()}`;

    // Merge pricing into specifications
    const specifications = {
      ...body.specifications,
      retailPrice: body.retailPrice || 0,
      installationCost: body.installationCost || 0,
      totalCost: body.totalCost || 0,
    };

    const newService = await prisma.product.create({
      data: {
        id,
        sku,
        name: body.name,
        manufacturer: body.manufacturer || 'Sun Direct Power',
        productType: 'ADDON',
        description: body.description,
        imageUrl: body.imageUrl || null,
        specifications: specifications,
        isRecommended: body.isRecommended || false,
        isAvailable: body.isAvailable !== false,
        sortOrder: body.sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      service: newService,
    });
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT bulk update services
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { services } = body;

    if (!services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Services array is required' },
        { status: 400 }
      );
    }

    // Update each service
    const updates = services.map(async (service: any) => {
      return prisma.product.update({
        where: { id: service.id },
        data: {
          specifications: service.specifications,
          isRecommended: service.isRecommended,
          isAvailable: service.isAvailable,
          sortOrder: service.sortOrder,
          updatedAt: new Date(),
        },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: 'Services updated successfully' });
  } catch (error) {
    console.error('Error updating services:', error);
    return NextResponse.json(
      { error: 'Failed to update services' },
      { status: 500 }
    );
  }
}
