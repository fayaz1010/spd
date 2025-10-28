import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch from SystemSettings table
    const systemSettings = await prisma.systemSettings.findFirst();
    
    if (!systemSettings) {
      // Return fallback data if no settings found
      return NextResponse.json({
        success: true,
        settings: {
          companyName: 'Sun Direct Power',
          abn: '12 345 678 901',
          address: '1 Whipper Street',
          city: 'Balcatta, WA 6112',
          phone: '08 6246 5606',
          mobile: '+61 0413 823 725',
          email: 'admin@sundirectpower.com.au',
          logoUrl: '/logos/sdp-logo-medium.png',
        },
      });
    }

    // Map database fields to expected format
    const settings = {
      companyName: systemSettings.companyName || 'Sun Direct Power',
      abn: systemSettings.companyABN || '12 345 678 901',
      address: systemSettings.address || '1 Whipper Street',
      city: `${systemSettings.postcode || 'Balcatta, WA 6112'}`,
      phone: systemSettings.phone || '08 6246 5606',
      mobile: systemSettings.phone || '+61 0413 823 725', // Using phone as fallback for mobile
      email: systemSettings.email || 'admin@sundirectpower.com.au',
      logoUrl: systemSettings.logoMedium || '/logos/sdp-logo-medium.png',
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { 
        success: true, // Return success with fallback data
        settings: {
          companyName: 'Sun Direct Power',
          abn: '12 345 678 901',
          address: '1 Whipper Street',
          city: 'Balcatta, WA 6112',
          phone: '08 6246 5606',
          mobile: '+61 0413 823 725',
          email: 'admin@sundirectpower.com.au',
          logoUrl: '/logos/sdp-logo-medium.png',
        },
      },
      { status: 200 }
    );
  }
}
