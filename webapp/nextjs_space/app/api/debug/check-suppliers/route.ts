import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check all products and their supplier links
    const products = await prisma.product.findMany({
      include: {
        SupplierProduct: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { productType: 'asc' },
    });

    const summary = {
      totalProducts: products.length,
      panels: products.filter(p => p.productType === 'PANEL').length,
      batteries: products.filter(p => p.productType === 'BATTERY').length,
      inverters: products.filter(p => p.productType === 'INVERTER').length,
      productsWithoutSuppliers: products.filter(p => p.SupplierProduct.length === 0).map(p => ({
        name: p.name,
        type: p.productType,
      })),
      productsWithInactiveSuppliers: products.filter(p => 
        p.SupplierProduct.length > 0 && 
        p.SupplierProduct.filter(sp => sp.isActive).length === 0
      ).map(p => ({
        name: p.name,
        type: p.productType,
        suppliers: p.SupplierProduct.map(sp => ({
          supplier: sp.supplier.name,
          isActive: sp.isActive,
        })),
      })),
      productsWithActiveSuppliers: products.filter(p => 
        p.SupplierProduct.filter(sp => sp.isActive).length > 0
      ).map(p => ({
        name: p.name,
        type: p.productType,
        activeSuppliers: p.SupplierProduct.filter(sp => sp.isActive).map(sp => ({
          supplier: sp.supplier.name,
          unitCost: sp.unitCost,
          retailPrice: sp.retailPrice,
        })),
      })),
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error checking suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to check suppliers', details: error.message },
      { status: 500 }
    );
  }
}
