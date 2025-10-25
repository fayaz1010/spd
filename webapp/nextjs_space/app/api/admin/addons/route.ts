
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

// GET all add-ons from Product table
export async function GET(request: NextRequest) {
  try {
    // Fetch addons from Product table
    const products = await prisma.product.findMany({
      where: { productType: 'ADDON' },
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

    // Format for admin UI
    const addons = products.map((product: any) => {
      const specs = product.specifications as any;
      const supplier = product.SupplierProduct[0];
      const installation = product.installationReqs[0];
      const installationCost = (installation?.quantityMultiplier || 0) * (installation?.laborType?.baseRate || 0);

      return {
        id: product.id,
        name: product.name,
        manufacturer: product.manufacturer,
        description: product.description || '',
        specifications: {
          addonCategory: specs?.addonCategory || 'general',
          showAtCheckout: specs?.showAtCheckout || false,
          showBeforeCheckout: specs?.showBeforeCheckout || false,
          benefits: specs?.benefits || [],
          iconName: specs?.iconName || 'Package',
        },
        isRecommended: product.isRecommended || false,
        isAvailable: product.isAvailable,
        sortOrder: product.sortOrder || 0,
        retailPrice: supplier?.retailPrice || 0,
        installationCost: installationCost,
        totalCost: (supplier?.retailPrice || 0) + installationCost,
      };
    });

    return NextResponse.json({ success: true, addons });
  } catch (error) {
    console.error('Error fetching add-ons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch add-ons' },
      { status: 500 }
    );
  }
}

// POST create new add-on
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const token = headersList.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin token
    const admin = await prisma.admin.findFirst({
      where: { id: token },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      addonId, 
      name, 
      description, 
      cost, 
      category, 
      iconName, 
      benefits, 
      sortOrder,
      active 
    } = body;

    // Validate required fields
    if (!addonId || !name || !description || cost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if addonId already exists
    const existing = await prisma.addonPricing.findUnique({
      where: { addonId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Add-on ID already exists' },
        { status: 400 }
      );
    }

    const addon = await prisma.addonPricing.create({
      data: {
        id: `addon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addonId,
        name,
        description,
        cost: parseFloat(cost),
        category: category || 'general',
        iconName: iconName || 'package',
        benefits: benefits || [],
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        active: active !== undefined ? active : true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ addon }, { status: 201 });
  } catch (error) {
    console.error('Error creating add-on:', error);
    return NextResponse.json(
      { error: 'Failed to create add-on' },
      { status: 500 }
    );
  }
}

// PUT bulk update add-ons
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { addons } = body;

    if (!addons || !Array.isArray(addons)) {
      return NextResponse.json(
        { error: 'Addons array is required' },
        { status: 400 }
      );
    }

    // Update each addon
    const updates = addons.map(async (addon: any) => {
      return prisma.product.update({
        where: { id: addon.id },
        data: {
          specifications: addon.specifications,
          isRecommended: addon.isRecommended,
          isAvailable: addon.isAvailable,
          sortOrder: addon.sortOrder,
          updatedAt: new Date(),
        },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true, message: 'Addons updated successfully' });
  } catch (error) {
    console.error('Error updating add-ons:', error);
    return NextResponse.json(
      { error: 'Failed to update add-ons' },
      { status: 500 }
    );
  }
}

// DELETE add-on (soft delete by setting active = false)
export async function DELETE(request: NextRequest) {
  try {
    const headersList = await headers();
    const token = headersList.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin token
    const admin = await prisma.admin.findFirst({
      where: { id: token },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Add-on ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - just mark as inactive
    const addon = await prisma.addonPricing.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ addon });
  } catch (error) {
    console.error('Error deleting add-on:', error);
    return NextResponse.json(
      { error: 'Failed to delete add-on' },
      { status: 500 }
    );
  }
}
