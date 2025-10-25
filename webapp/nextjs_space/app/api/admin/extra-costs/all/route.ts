import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const extraCosts = await prisma.extraCost.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      extraCosts,
    });
  } catch (error) {
    console.error('Error fetching extra costs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch extra costs' },
      { status: 500 }
    );
  }
}
