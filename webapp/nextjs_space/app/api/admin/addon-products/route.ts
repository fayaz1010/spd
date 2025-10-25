import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Admin API for managing addon products
 * Uses Product table with productType: ADDON
 */

// GET all addon products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {
      productType: 'ADDON',
    };

    if (category) {
      where.specifications = {
        path: ['addonCategory'],
        equals: category,
      };
    }

    const addons = await prisma.product.findMany({
      where,
      include: {
        SupplierProduct: {
          where: { isActive: true },
          include: {
            supplier: true,
          },
          take: 1,
        },
        installationReqs: {
          include: {
            laborType: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Format response
    const formattedAddons = addons.map((addon: any) => {
      const specs = addon.specifications as any;
      const supplier = addon.SupplierProduct?.[0];
      const installation = addon.installationReqs?.[0];

      return {
        id: addon.id,
        name: addon.name,
        manufacturer: addon.manufacturer,
        description: addon.description,
        sku: addon.sku,
        isAvailable: addon.isAvailable,
        isRecommended: addon.isRecommended,
        sortOrder: addon.sortOrder,
        tier: addon.tier,
        
        // Addon-specific fields
        addonCategory: specs?.addonCategory || 'general',
        showAtCheckout: specs?.showAtCheckout || false,
        showBeforeCheckout: specs?.showBeforeCheckout || false,
        benefits: specs?.benefits || [],
        iconName: specs?.iconName || 'Package',
        
        // Pricing
        unitCost: supplier?.unitCost || 0,
        retailPrice: supplier?.retailPrice || 0,
        supplierId: supplier?.supplierId,
        supplierName: supplier?.supplier?.name,
        
        // Installation
        laborType: installation?.laborType?.name,
        laborHours: installation?.quantityMultiplier || 0,
        laborRate: installation?.laborType?.baseRate || 0,
        installationCost: (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0),
      };
    });

    return NextResponse.json({
      success: true,
      addons: formattedAddons,
    });

  } catch (error: any) {
    console.error('Error fetching addon products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon products', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST create new addon product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      manufacturer,
      description,
      retailPrice,
      unitCost,
      addonCategory,
      showAtCheckout,
      showBeforeCheckout,
      benefits,
      iconName,
      isRecommended,
      sortOrder,
    } = body;

    // Validate required fields
    if (!name || !manufacturer || !retailPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: name, manufacturer, retailPrice' },
        { status: 400 }
      );
    }

    // Generate unique ID and SKU
    const productId = `addon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sku = `ADDON-${manufacturer.substring(0, 3).toUpperCase()}-${name.substring(0, 10).replace(/\s/g, '')}-${Date.now()}`.substring(0, 50);

    // Create Product
    const product = await prisma.product.create({
      data: {
        id: productId,
        sku: sku,
        productType: 'ADDON',
        name,
        manufacturer,
        description: description || '',
        isAvailable: true,
        isRecommended: isRecommended || false,
        sortOrder: sortOrder || 0,
        tier: 'standard',
        updatedAt: new Date(),
        specifications: {
          addonCategory: addonCategory || 'general',
          showAtCheckout: showAtCheckout !== undefined ? showAtCheckout : true,
          showBeforeCheckout: showBeforeCheckout !== undefined ? showBeforeCheckout : false,
          benefits: benefits || [],
          iconName: iconName || 'Package',
        },
      },
    });

    // Get default supplier
    const supplier = await prisma.supplier.findFirst({
      where: { isActive: true },
    });

    if (!supplier) {
      throw new Error('No active supplier found');
    }

    // Create SupplierProduct
    await prisma.supplierProduct.create({
      data: {
        id: `sp_addon_${productId}`,
        supplierId: supplier.id,
        category: 'addon',
        brand: manufacturer,
        model: name,
        sku: sku,
        unitCost: unitCost || retailPrice * 0.7,
        unit: 'unit',
        isActive: true,
        productId: product.id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      addon: product,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating addon product:', error);
    return NextResponse.json(
      { error: 'Failed to create addon product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT update addon product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      manufacturer,
      description,
      retailPrice,
      unitCost,
      addonCategory,
      showAtCheckout,
      showBeforeCheckout,
      benefits,
      iconName,
      isAvailable,
      isRecommended,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get current product
    const currentProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        SupplierProduct: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Addon product not found' },
        { status: 404 }
      );
    }

    const currentSpecs = currentProduct.specifications as any;

    // Update Product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(manufacturer && { manufacturer }),
        ...(description !== undefined && { description }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(isRecommended !== undefined && { isRecommended }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
        specifications: {
          ...currentSpecs,
          ...(addonCategory && { addonCategory }),
          ...(showAtCheckout !== undefined && { showAtCheckout }),
          ...(showBeforeCheckout !== undefined && { showBeforeCheckout }),
          ...(benefits && { benefits }),
          ...(iconName && { iconName }),
        },
      },
    });

    // Update SupplierProduct if pricing changed
    if ((retailPrice !== undefined || unitCost !== undefined) && currentProduct.SupplierProduct.length > 0) {
      const supplierProduct = currentProduct.SupplierProduct[0];
      await prisma.supplierProduct.update({
        where: { id: supplierProduct.id },
        data: {
          ...(unitCost !== undefined && { unitCost }),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      addon: updatedProduct,
    });

  } catch (error: any) {
    console.error('Error updating addon product:', error);
    return NextResponse.json(
      { error: 'Failed to update addon product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE addon product (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - mark as unavailable
    const product = await prisma.product.update({
      where: { id },
      data: {
        isAvailable: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      addon: product,
    });

  } catch (error: any) {
    console.error('Error deleting addon product:', error);
    return NextResponse.json(
      { error: 'Failed to delete addon product', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
