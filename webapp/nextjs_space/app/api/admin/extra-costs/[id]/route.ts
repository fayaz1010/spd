import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const updated = await prisma.extraCost.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        cost: body.cost,
        category: body.category,
        defaultOn: body.defaultOn,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      extraCost: updated,
    });
  } catch (error) {
    console.error('Error updating extra cost:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update extra cost' },
      { status: 500 }
    );
  }
}
