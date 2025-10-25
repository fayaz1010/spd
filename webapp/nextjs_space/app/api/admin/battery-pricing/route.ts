
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const pricing = await prisma.batteryPricing.findMany({
      orderBy: { capacityKwh: 'asc' },
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching battery pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const data = await request.json();

    const pricing = await prisma.batteryPricing.create({
      data: {
        id: `battery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        capacityKwh: data.capacityKwh,
        brand: data.brand,
        model: data.model,
        cost: data.cost,
        active: data.active ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating battery pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);

    const { id, ...data } = await request.json();

    const pricing = await prisma.batteryPricing.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating battery pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.batteryPricing.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting battery pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
