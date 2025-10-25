import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/calculator-packages/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const package_ = await prisma.calculatorPackageTemplate.findUnique({
      where: { id: params.id },
    });

    if (!package_) {
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      package: package_,
    });
  } catch (error) {
    console.error('Error fetching calculator package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/calculator-packages/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const package_ = await prisma.calculatorPackageTemplate.update({
      where: { id: params.id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      package: package_,
    });
  } catch (error) {
    console.error('Error updating calculator package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/calculator-packages/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.calculatorPackageTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting calculator package:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
