
/**
 * System Settings API
 * 
 * Manage supplier selection strategy and system-wide configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSystemSettings } from '@/lib/supplier-selection';

// GET /api/admin/system-settings
export async function GET(req: NextRequest) {
  try {
    const settings = await getSystemSettings();
    
    // Also fetch quote settings (commission settings)
    const quoteSettings = await prisma.quoteSettings.findFirst({
      where: { region: 'WA' }
    });
    
    // Merge quote settings into system settings
    const mergedSettings = {
      ...settings,
      quoteCommissionType: quoteSettings?.commissionType || 'PERCENTAGE',
      quoteCommissionPercent: quoteSettings?.commissionPercent || 20,
      quoteCommissionFixed: quoteSettings?.commissionFixed || 3000,
      quoteMinimumProfit: quoteSettings?.minimumProfit || 2000,
    };
    
    return NextResponse.json(mergedSettings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/system-settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract quote commission settings
    const {
      quoteCommissionType,
      quoteCommissionPercent,
      quoteCommissionFixed,
      quoteMinimumProfit,
      ...systemSettingsData
    } = body;
    
    // Update system settings
    let settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: systemSettingsData,
      });
    } else {
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: systemSettingsData,
      });
    }
    
    // Update quote settings (commission settings)
    if (quoteCommissionType !== undefined) {
      let quoteSettings = await prisma.quoteSettings.findFirst({
        where: { region: 'WA' }
      });
      
      const quoteSettingsData = {
        region: 'WA',
        commissionType: quoteCommissionType,
        commissionPercent: quoteCommissionPercent || 20,
        commissionFixed: quoteCommissionFixed || 3000,
        minimumProfit: quoteMinimumProfit || 2000,
        updatedAt: new Date(),
      };
      
      if (!quoteSettings) {
        await prisma.quoteSettings.create({
          data: quoteSettingsData,
        });
      } else {
        await prisma.quoteSettings.update({
          where: { id: quoteSettings.id },
          data: quoteSettingsData,
        });
      }
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
