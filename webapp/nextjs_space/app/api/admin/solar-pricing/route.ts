
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/auth-admin';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const pricing = await prisma.solarPricing.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching solar pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const data = await request.json();

    const pricing = await prisma.solarPricing.create({
      data: {
        id: `solar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        costPerKw: data.costPerKw,
        panelWattage: data.panelWattage,
        panelBrand: data.panelBrand,
        inverterBrand: data.inverterBrand,
        installationFee: data.installationFee || 0,
        active: data.active ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating solar pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAdmin(request);

    const { id, ...data } = await request.json();

    const pricing = await prisma.solarPricing.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, pricing });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating solar pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
