import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobId,
      rebateType,
      stcCount,
      stcValue,
      inverterSerial,
      inverterModel,
      batterySerial,
      batteryModel,
      batteryCapacity,
    } = body;

    if (!jobId || !rebateType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get panel serials from validated panels
    const panelValidations = await prisma.panelValidation.findMany({
      where: {
        jobId,
        isCecApproved: true,
      },
      select: {
        serialNumber: true,
        manufacturer: true,
        model: true,
      },
    });

    const panelSerials = panelValidations.map(p => p.serialNumber);
    const panelManufacturer = panelValidations[0]?.manufacturer || '';
    const panelModel = panelValidations[0]?.model || '';

    // Create rebate submission
    const submission = await prisma.rebateSubmission.create({
      data: {
        jobId,
        rebateType,
        stcCount,
        stcValue,
        panelSerials,
        panelModel,
        panelManufacturer,
        panelValidated: panelSerials.length > 0,
        panelValidatedAt: panelSerials.length > 0 ? new Date() : null,
        inverterSerial,
        inverterModel,
        inverterValidated: !!inverterSerial,
        batterySerial,
        batteryModel,
        batteryCapacity: batteryCapacity ? parseFloat(batteryCapacity) : null,
        batteryValidated: !!batterySerial,
        stcStatus: 'PENDING',
        submittedToCER: false,
      },
    });

    return NextResponse.json({
      success: true,
      submission,
    });
  } catch (error) {
    console.error('Rebate submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create rebate submission' },
      { status: 500 }
    );
  }
}
