import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.product.findUnique({
      where: {
        id: params.id,
        productType: 'ADDON',
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      service,
    });
  } catch (error: any) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    console.log('PUT /api/admin/extra-services/[id] - Body:', JSON.stringify(body, null, 2));
    console.log('Image URL received:', body.imageUrl);

    // Merge pricing into specifications
    const specifications = typeof body.specifications === 'string' 
      ? JSON.parse(body.specifications) 
      : body.specifications || {};
    
    if (body.retailPrice !== undefined) specifications.retailPrice = body.retailPrice;
    if (body.installationCost !== undefined) specifications.installationCost = body.installationCost;
    if (body.totalCost !== undefined) specifications.totalCost = body.totalCost;

    const updatedService = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.manufacturer !== undefined && { manufacturer: body.manufacturer }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        specifications: specifications,
        ...(body.isRecommended !== undefined && { isRecommended: body.isRecommended }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      service: updatedService,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
