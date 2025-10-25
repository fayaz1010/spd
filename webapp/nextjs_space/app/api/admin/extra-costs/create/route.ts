import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate ID
    const id = `extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get max sort order
    const maxSortOrder = await prisma.extraCost.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const newCost = await prisma.extraCost.create({
      data: {
        id,
        name: body.name,
        description: body.description || '',
        cost: body.cost,
        category: body.category || 'installation',
        active: true,
        optional: true,
        defaultOn: body.defaultOn || false,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({
      success: true,
      extraCost: newCost,
    });
  } catch (error) {
    console.error('Error creating extra cost:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create extra cost' },
      { status: 500 }
    );
  }
}
