import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all partners
export async function GET(request: NextRequest) {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      partners,
    });
  } catch (error: any) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

// POST - Create new partner
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const partner = await prisma.partner.create({
      data: {
        name: data.name,
        logoUrl: data.logoUrl,
        website: data.website,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error: any) {
    console.error('Error creating partner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
