
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const where: any = {};
    if (tier) where.tier = tier;
    if (availableOnly) where.isAvailable = true;

    const brands = await prisma.batteryBrand.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching battery brands:', error);
    return NextResponse.json({ error: 'Failed to fetch battery brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const brand = await prisma.batteryBrand.create({
      data: {
        ...data,
        features: JSON.stringify(data.features || []),
        bestFor: JSON.stringify(data.bestFor || []),
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error creating battery brand:', error);
    return NextResponse.json({ error: 'Failed to create battery brand' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const brand = await prisma.batteryBrand.update({
      where: { id },
      data: {
        ...updateData,
        features: typeof updateData.features === 'string' ? updateData.features : JSON.stringify(updateData.features || []),
        bestFor: typeof updateData.bestFor === 'string' ? updateData.bestFor : JSON.stringify(updateData.bestFor || []),
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error updating battery brand:', error);
    return NextResponse.json({ error: 'Failed to update battery brand' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    await prisma.batteryBrand.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting battery brand:', error);
    return NextResponse.json({ error: 'Failed to delete battery brand' }, { status: 500 });
  }
}
