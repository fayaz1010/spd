

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const category = searchParams.get('category') as 'PANEL' | 'BATTERY' | 'INVERTER' | null;

    const where: any = {};
    
    if (brandId && category) {
      where.brandCategory = category;
      if (category === 'PANEL') where.panelBrandId = brandId;
      else if (category === 'BATTERY') where.batteryBrandId = brandId;
      else if (category === 'INVERTER') where.inverterBrandId = brandId;
    }

    const mappings = await prisma.brandSupplier.findMany({
      where,
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
        panelBrand: category === 'PANEL',
        batteryBrand: category === 'BATTERY',
        inverterBrand: category === 'INVERTER',
      },
      orderBy: [
        { isPrimary: 'desc' },
        { supplierCost: 'asc' },
      ],
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching brand-supplier mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.brandCategory || !data.supplierProductId) {
      return NextResponse.json(
        { error: 'Brand category and supplier product are required' },
        { status: 400 }
      );
    }

    // Ensure only one brand ID is set based on category
    const brandData: any = {
      brandCategory: data.brandCategory,
      supplierProductId: data.supplierProductId,
      supplierCost: data.supplierCost || 0,
      ourCommission: data.ourCommission || 0,
      commissionType: data.commissionType || 'fixed',
      isPrimary: data.isPrimary || false,
      leadTimeDays: data.leadTimeDays,
      minOrderQty: data.minOrderQty,
      isActive: data.isActive !== false,
      notes: data.notes,
    };

    if (data.brandCategory === 'PANEL') {
      brandData.panelBrandId = data.brandId;
    } else if (data.brandCategory === 'BATTERY') {
      brandData.batteryBrandId = data.brandId;
    } else if (data.brandCategory === 'INVERTER') {
      brandData.inverterBrandId = data.brandId;
    }

    // If setting as primary, unset other primary mappings for this brand
    if (data.isPrimary) {
      const updateWhere: any = { brandCategory: data.brandCategory };
      if (data.brandCategory === 'PANEL') updateWhere.panelBrandId = data.brandId;
      else if (data.brandCategory === 'BATTERY') updateWhere.batteryBrandId = data.brandId;
      else if (data.brandCategory === 'INVERTER') updateWhere.inverterBrandId = data.brandId;

      await prisma.brandSupplier.updateMany({
        where: updateWhere,
        data: { isPrimary: false },
      });
    }

    const mapping = await prisma.brandSupplier.create({
      data: brandData,
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Error creating brand-supplier mapping:', error);
    return NextResponse.json({ error: 'Failed to create mapping' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Mapping ID is required' }, { status: 400 });
    }

    // If setting as primary, unset other primary mappings for this brand
    if (updateData.isPrimary) {
      const existing = await prisma.brandSupplier.findUnique({ where: { id } });
      if (existing) {
        const updateWhere: any = { brandCategory: existing.brandCategory };
        if (existing.brandCategory === 'PANEL') updateWhere.panelBrandId = existing.panelBrandId;
        else if (existing.brandCategory === 'BATTERY') updateWhere.batteryBrandId = existing.batteryBrandId;
        else if (existing.brandCategory === 'INVERTER') updateWhere.inverterBrandId = existing.inverterBrandId;

        await prisma.brandSupplier.updateMany({
          where: { ...updateWhere, id: { not: id } },
          data: { isPrimary: false },
        });
      }
    }

    const mapping = await prisma.brandSupplier.update({
      where: { id },
      data: updateData,
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json(mapping);
  } catch (error) {
    console.error('Error updating brand-supplier mapping:', error);
    return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mapping ID is required' }, { status: 400 });
    }

    await prisma.brandSupplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand-supplier mapping:', error);
    return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
  }
}

