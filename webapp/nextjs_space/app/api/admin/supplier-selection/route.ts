
/**
 * Supplier Selection API
 * 
 * Test and preview supplier selection for brands
 */

import { NextRequest, NextResponse } from 'next/server';
import { selectSupplierForBrand, selectSuppliersForQuote } from '@/lib/supplier-selection';

// POST /api/admin/supplier-selection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, category, brands } = body;
    
    if (brands) {
      // Batch selection for multiple brands
      const result = await selectSuppliersForQuote(brands);
      return NextResponse.json(result);
    } else if (brandId && category) {
      // Single brand selection
      const result = await selectSupplierForBrand(brandId, category);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error selecting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to select supplier' },
      { status: 500 }
    );
  }
}
