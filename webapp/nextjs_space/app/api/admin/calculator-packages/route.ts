import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/calculator-packages - List all calculator packages
export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.calculatorPackageTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Error fetching calculator packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST /api/admin/calculator-packages - Create new calculator package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const package_ = await prisma.calculatorPackageTemplate.create({
      data: body,
    });

    return NextResponse.json({
      success: true,
      package: package_,
    });
  } catch (error) {
    console.error('Error creating calculator package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package' },
      { status: 500 }
    );
  }
}
