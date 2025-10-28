import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Fetch from ConfigSettings
    const config = await prisma.configSettings.findUnique({
      where: { key: 'legal_documents' }
    });

    if (config && config.value) {
      return NextResponse.json({
        success: true,
        documents: config.value,
      });
    }

    // Return empty documents if not found
    return NextResponse.json({
      success: true,
      documents: {
        privacyPolicy: '',
        termsConditions: '',
        cookiePolicy: '',
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching legal documents:', error);
    return NextResponse.json({
      success: true,
      documents: {
        privacyPolicy: '',
        termsConditions: '',
        cookiePolicy: '',
        lastUpdated: new Date().toISOString(),
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Save to ConfigSettings
    await prisma.configSettings.upsert({
      where: { key: 'legal_documents' },
      update: { 
        value: body,
        updatedAt: new Date(),
      },
      create: {
        id: 'legal_documents',
        key: 'legal_documents',
        value: body,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Legal documents saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving legal documents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
