import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/cec/sync
 * Sync CEC approved products database
 * 
 * In production, this would fetch from CEC API or CSV file
 * For now, we'll seed with mock data
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    let added = 0;
    let updated = 0;
    const errors: string[] = [];

    // Mock CEC data (in production, fetch from official CEC source)
    const mockProducts = [
      // Solar Panels
      { type: 'panel', manufacturer: 'Trina Solar', model: 'TSM-400DE09.08', serialPrefix: 'TSM', wattage: 400, cecListingId: 'A12345' },
      { type: 'panel', manufacturer: 'Trina Solar', model: 'TSM-405DE09.08', serialPrefix: 'TSM', wattage: 405, cecListingId: 'A12346' },
      { type: 'panel', manufacturer: 'JinkoSolar', model: 'JKM-400M-6RL3', serialPrefix: 'JKM', wattage: 400, cecListingId: 'A12347' },
      { type: 'panel', manufacturer: 'JinkoSolar', model: 'JKM-405M-6RL3', serialPrefix: 'JKM', wattage: 405, cecListingId: 'A12348' },
      { type: 'panel', manufacturer: 'Canadian Solar', model: 'CS3W-400MS', serialPrefix: 'CS', wattage: 400, cecListingId: 'A12349' },
      { type: 'panel', manufacturer: 'Canadian Solar', model: 'CS3W-405MS', serialPrefix: 'CS', wattage: 405, cecListingId: 'A12350' },
      { type: 'panel', manufacturer: 'LG Electronics', model: 'LG400N2W-A5', serialPrefix: 'LG', wattage: 400, cecListingId: 'A12351' },
      { type: 'panel', manufacturer: 'SunPower', model: 'SPR-MAX3-400', serialPrefix: 'SPR', wattage: 400, cecListingId: 'A12352' },
      { type: 'panel', manufacturer: 'LONGi Solar', model: 'LR5-72HPH-400M', serialPrefix: 'LONGI', wattage: 400, cecListingId: 'A12353' },
      { type: 'panel', manufacturer: 'JA Solar', model: 'JAM72S20-400/MR', serialPrefix: 'JA', wattage: 400, cecListingId: 'A12354' },

      // Inverters
      { type: 'inverter', manufacturer: 'Fronius', model: 'Primo 5.0-1', serialPrefix: 'FRONIUS', cecListingId: 'I12345' },
      { type: 'inverter', manufacturer: 'Fronius', model: 'Symo 10.0-3-M', serialPrefix: 'FRONIUS', cecListingId: 'I12346' },
      { type: 'inverter', manufacturer: 'SolarEdge', model: 'SE5000H', serialPrefix: 'SOLAREDGE', cecListingId: 'I12347' },
      { type: 'inverter', manufacturer: 'SolarEdge', model: 'SE10000H', serialPrefix: 'SOLAREDGE', cecListingId: 'I12348' },
      { type: 'inverter', manufacturer: 'Enphase Energy', model: 'IQ7PLUS-72-2-INT', serialPrefix: 'ENPHASE', cecListingId: 'I12349' },
      { type: 'inverter', manufacturer: 'Enphase Energy', model: 'IQ8PLUS-72-2-INT', serialPrefix: 'ENPHASE', cecListingId: 'I12350' },
      { type: 'inverter', manufacturer: 'SMA Solar Technology', model: 'Sunny Boy 5.0', serialPrefix: 'SMA', cecListingId: 'I12351' },
      { type: 'inverter', manufacturer: 'Huawei', model: 'SUN2000-5KTL-L1', serialPrefix: 'HUAWEI', cecListingId: 'I12352' },
      { type: 'inverter', manufacturer: 'Sungrow', model: 'SG5.0RS', serialPrefix: 'SUNGROW', cecListingId: 'I12353' },
      { type: 'inverter', manufacturer: 'GoodWe', model: 'GW5000-EH', serialPrefix: 'GOODWE', cecListingId: 'I12354' },

      // Batteries
      { type: 'battery', manufacturer: 'Tesla', model: 'Powerwall 2', serialPrefix: 'TESLA', cecListingId: 'B12345' },
      { type: 'battery', manufacturer: 'Tesla', model: 'Powerwall 3', serialPrefix: 'TESLA', cecListingId: 'B12346' },
      { type: 'battery', manufacturer: 'BYD', model: 'Battery-Box Premium HVS 10.2', serialPrefix: 'BYD', cecListingId: 'B12347' },
      { type: 'battery', manufacturer: 'BYD', model: 'Battery-Box Premium LVS 12.0', serialPrefix: 'BYD', cecListingId: 'B12348' },
      { type: 'battery', manufacturer: 'LG Chem', model: 'RESU10H', serialPrefix: 'LG', cecListingId: 'B12349' },
      { type: 'battery', manufacturer: 'LG Chem', model: 'RESU13', serialPrefix: 'LG', cecListingId: 'B12350' },
      { type: 'battery', manufacturer: 'sonnen', model: 'sonnenBatterie 10', serialPrefix: 'SONNEN', cecListingId: 'B12351' },
      { type: 'battery', manufacturer: 'Pylontech', model: 'US3000C', serialPrefix: 'PYLONTECH', cecListingId: 'B12352' },
      { type: 'battery', manufacturer: 'Alpha ESS', model: 'SMILE-B3-PLUS', serialPrefix: 'ALPHA', cecListingId: 'B12353' },
      { type: 'battery', manufacturer: 'Sungrow', model: 'SBR096', serialPrefix: 'SUNGROW', cecListingId: 'B12354' }
    ];

    // Upsert each product
    for (const product of mockProducts) {
      try {
        const existing = await prisma.cECApprovedProduct.findUnique({
          where: {
            type_manufacturer_model: {
              type: product.type,
              manufacturer: product.manufacturer,
              model: product.model
            }
          }
        });

        if (existing) {
          await prisma.cECApprovedProduct.update({
            where: { id: existing.id },
            data: {
              serialPrefix: product.serialPrefix,
              wattage: product.wattage,
              cecListingId: product.cecListingId,
              isActive: true,
              updatedAt: new Date()
            }
          });
          updated++;
        } else {
          await prisma.cECApprovedProduct.create({
            data: {
              type: product.type,
              manufacturer: product.manufacturer,
              model: product.model,
              serialPrefix: product.serialPrefix,
              wattage: product.wattage,
              approvedDate: new Date(),
              cecListingId: product.cecListingId,
              isActive: true
            }
          });
          added++;
        }
      } catch (error: any) {
        errors.push(`Failed to sync ${product.manufacturer} ${product.model}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      added,
      updated,
      total: added + updated,
      errors
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('CEC sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync CEC database',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cec/sync
 * Get last sync status
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const totalProducts = await prisma.cECApprovedProduct.count();
    const panels = await prisma.cECApprovedProduct.count({ where: { type: 'panel' } });
    const inverters = await prisma.cECApprovedProduct.count({ where: { type: 'inverter' } });
    const batteries = await prisma.cECApprovedProduct.count({ where: { type: 'battery' } });

    const lastProduct = await prisma.cECApprovedProduct.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        panels,
        inverters,
        batteries,
        lastSync: lastProduct?.updatedAt
      }
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('CEC stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get CEC stats',
        details: error.message
      },
      { status: 500 }
    );
  }
}
