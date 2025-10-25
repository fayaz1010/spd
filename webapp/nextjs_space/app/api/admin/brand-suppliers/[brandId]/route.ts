
/**
 * Brand Supplier Mappings API
 * 
 * Fetch supplier information for a specific brand
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { brandId: string } }
) {
  try {
    const { brandId } = params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as 'PANEL' | 'BATTERY' | 'INVERTER' | null;
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }
    
    const whereClause: any = {
      brandCategory: category,
      isActive: true,
    };
    
    if (category === 'PANEL') {
      whereClause.panelBrandId = brandId;
    } else if (category === 'BATTERY') {
      whereClause.batteryBrandId = brandId;
    } else if (category === 'INVERTER') {
      whereClause.inverterBrandId = brandId;
    }
    
    const mappings = await prisma.brandSupplier.findMany({
      where: whereClause,
      include: {
        supplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { supplierCost: 'asc' },
      ],
    });
    
    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching brand suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand suppliers' },
      { status: 500 }
    );
  }
}
