import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existing = await prisma.systemPackageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.systemPackageTemplate.update({
      where: { id },
      data: {
        active: !existing.active,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      package: updated,
    });
  } catch (error) {
    console.error('Error toggling package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle package' },
      { status: 500 }
    );
  }
}
