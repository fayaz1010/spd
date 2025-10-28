import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from ConfigSettings
    const config = await prisma.configSettings.findUnique({
      where: { key: 'social_links' }
    });

    if (config && config.value) {
      return NextResponse.json({
        success: true,
        links: config.value,
      });
    }

    // Return default links if not found
    return NextResponse.json({
      success: true,
      links: {
        facebook: 'https://facebook.com/sundirectpower',
        instagram: 'https://instagram.com/sundirectpower',
        linkedin: 'https://linkedin.com/company/sundirectpower',
        youtube: 'https://youtube.com/@sundirectpower',
        tiktok: '',
        pinterest: '',
      },
    });
  } catch (error: any) {
    console.error('Error fetching social links:', error);
    return NextResponse.json({
      success: true,
      links: {
        facebook: 'https://facebook.com/sundirectpower',
        instagram: 'https://instagram.com/sundirectpower',
        linkedin: 'https://linkedin.com/company/sundirectpower',
        youtube: 'https://youtube.com/@sundirectpower',
        tiktok: '',
        pinterest: '',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Save to ConfigSettings
    await prisma.configSettings.upsert({
      where: { key: 'social_links' },
      update: { 
        value: body,
        updatedAt: new Date(),
      },
      create: {
        id: 'social_links',
        key: 'social_links',
        value: body,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Social links saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving social links:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
