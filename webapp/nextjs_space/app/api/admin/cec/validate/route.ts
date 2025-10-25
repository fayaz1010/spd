import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/cec/validate
 * Validate equipment serial number against CEC database
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const { serialNumber, equipmentType, manufacturer, model } = body;

    if (!serialNumber || !equipmentType) {
      return NextResponse.json(
        { error: 'Serial number and equipment type are required' },
        { status: 400 }
      );
    }

    // Extract manufacturer from serial if not provided
    const detectedManufacturer = manufacturer || extractManufacturerFromSerial(serialNumber);

    // Search CEC database
    const products = await prisma.cECApprovedProduct.findMany({
      where: {
        type: equipmentType,
        isActive: true,
        ...(detectedManufacturer && {
          manufacturer: {
            contains: detectedManufacturer,
            mode: 'insensitive'
          }
        }),
        ...(model && {
          model: {
            contains: model,
            mode: 'insensitive'
          }
        })
      },
      take: 10
    });

    // If no products found, try by serial prefix
    let matchedProduct = null;
    let confidence = 0;

    if (products.length === 0) {
      // Try matching by serial prefix
      const allProducts = await prisma.cECApprovedProduct.findMany({
        where: {
          type: equipmentType,
          isActive: true,
          serialPrefix: {
            not: null
          }
        }
      });

      for (const product of allProducts) {
        if (product.serialPrefix && serialNumber.toUpperCase().includes(product.serialPrefix.toUpperCase())) {
          matchedProduct = product;
          confidence = 0.7; // Medium confidence (prefix match)
          break;
        }
      }
    } else {
      // Found products by manufacturer/model
      matchedProduct = products[0];
      
      // Calculate confidence based on match quality
      if (manufacturer && model) {
        confidence = 0.95; // High confidence (exact manufacturer + model)
      } else if (manufacturer) {
        confidence = 0.8; // Good confidence (manufacturer match)
      } else {
        confidence = 0.6; // Medium confidence (auto-detected)
      }
    }

    // Check if approval is expired
    const warnings: string[] = [];
    if (matchedProduct?.expiryDate) {
      const expiryDate = new Date(matchedProduct.expiryDate);
      if (expiryDate < new Date()) {
        warnings.push('CEC approval has expired');
        confidence = Math.max(confidence - 0.3, 0);
      }
    }

    const result = {
      isApproved: !!matchedProduct,
      confidence,
      product: matchedProduct,
      reason: matchedProduct 
        ? `Matched to ${matchedProduct.manufacturer} ${matchedProduct.model}`
        : 'No matching CEC approved product found',
      warnings
    };

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('CEC validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate against CEC database',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Extract manufacturer from serial number
 */
function extractManufacturerFromSerial(serial: string): string | null {
  const upper = serial.toUpperCase();

  const prefixes: Record<string, string> = {
    'TSM': 'Trina Solar',
    'JKM': 'JinkoSolar',
    'SPR': 'SunPower',
    'LG': 'LG Electronics',
    'CS': 'Canadian Solar',
    'LONGI': 'LONGi Solar',
    'JA': 'JA Solar',
    'FRONIUS': 'Fronius',
    'SMA': 'SMA Solar Technology',
    'SOLAREDGE': 'SolarEdge',
    'ENPHASE': 'Enphase Energy',
    'HUAWEI': 'Huawei',
    'SUNGROW': 'Sungrow',
    'TESLA': 'Tesla',
    'BYD': 'BYD',
    'SONNEN': 'sonnen'
  };

  for (const [prefix, manufacturer] of Object.entries(prefixes)) {
    if (upper.includes(prefix)) {
      return manufacturer;
    }
  }

  return null;
}
