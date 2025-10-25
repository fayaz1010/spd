import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.extraCost.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Extra cost not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.extraCost.update({
      where: { id },
      data: {
        active: !existing.active,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      extraCost: updated,
    });
  } catch (error) {
    console.error('Error toggling extra cost:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle extra cost' },
      { status: 500 }
    );
  }
}
