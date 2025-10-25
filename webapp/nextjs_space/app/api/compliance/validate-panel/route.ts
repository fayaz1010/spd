import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock CEC approved panels database
// In production, integrate with actual CEC database API
const CEC_APPROVED_PANELS = [
  {
    serialPrefix: 'LON',
    manufacturer: 'Longi Solar',
    model: 'Hi-MO 5',
    wattage: 540,
    cecListingId: 'CEC-12345',
  },
  {
    serialPrefix: 'TRI',
    manufacturer: 'Trina Solar',
    model: 'Vertex S',
    wattage: 425,
    cecListingId: 'CEC-23456',
  },
  {
    serialPrefix: 'JIN',
    manufacturer: 'JinkoSolar',
    model: 'Tiger Pro',
    wattage: 540,
    cecListingId: 'CEC-34567',
  },
  {
    serialPrefix: 'CAN',
    manufacturer: 'Canadian Solar',
    model: 'HiKu6',
    wattage: 540,
    cecListingId: 'CEC-45678',
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, serialNumber } = body;

    if (!jobId || !serialNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if panel already validated
    const existing = await prisma.panelValidation.findFirst({
      where: {
        jobId,
        serialNumber,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        ...existing,
      });
    }

    // Validate against CEC database (mock)
    const serialPrefix = serialNumber.substring(0, 3).toUpperCase();
    const approvedPanel = CEC_APPROVED_PANELS.find(
      p => p.serialPrefix === serialPrefix
    );

    let validationResult;

    if (approvedPanel) {
      // Panel is CEC approved
      validationResult = await prisma.panelValidation.create({
        data: {
          jobId,
          serialNumber,
          manufacturer: approvedPanel.manufacturer,
          model: approvedPanel.model,
          wattage: approvedPanel.wattage,
          isValidated: true,
          isCecApproved: true,
          validatedAt: new Date(),
          cecListingId: approvedPanel.cecListingId,
          cecApprovedDate: new Date(),
          isFlagged: false,
          scanMethod: 'manual', // or 'barcode', 'qr', 'ocr'
        },
      });

      // Update compliance checklist
      await updateComplianceChecklist(jobId);

      return NextResponse.json({
        success: true,
        ...validationResult,
      });
    } else {
      // Panel not approved - flag it
      validationResult = await prisma.panelValidation.create({
        data: {
          jobId,
          serialNumber,
          isValidated: true,
          isCecApproved: false,
          validatedAt: new Date(),
          isFlagged: true,
          flagReason: 'Panel not found in CEC approved list',
          scanMethod: 'manual',
        },
      });

      return NextResponse.json({
        success: true,
        ...validationResult,
      });
    }
  } catch (error) {
    console.error('Panel validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate panel' },
      { status: 500 }
    );
  }
}

async function updateComplianceChecklist(jobId: string) {
  try {
    // Check if all panels are validated
    const job = await prisma.installationJob.findUnique({
      where: { id: jobId },
      include: {
        panelValidations: true,
      },
    });

    if (!job) return;

    const totalPanels = job.panelCount;
    const validatedPanels = job.panelValidations.filter(p => p.isCecApproved).length;
    const allPanelsValidated = validatedPanels >= totalPanels;

    // Update checklist
    await prisma.complianceChecklist.upsert({
      where: { jobId },
      update: {
        panelsValidated: allPanelsValidated,
        updatedAt: new Date(),
      },
      create: {
        jobId,
        panelsValidated: allPanelsValidated,
      },
    });

    // Recalculate compliance score
    await recalculateComplianceScore(jobId);
  } catch (error) {
    console.error('Failed to update compliance checklist:', error);
  }
}

async function recalculateComplianceScore(jobId: string) {
  try {
    const checklist = await prisma.complianceChecklist.findUnique({
      where: { jobId },
    });

    if (!checklist) return;

    // Calculate score (simplified - use compliance-scoring.ts in production)
    let score = 0;

    // Pre-Installation (20 points)
    if (checklist.cecAccreditationVerified) score += 5;
    if (checklist.electricalLicenseVerified) score += 5;
    if (checklist.councilPermitObtained) score += 5;
    if (checklist.networkApprovalObtained) score += 5;

    // Installation (40 points)
    if (checklist.panelsValidated) score += 15;
    if (checklist.inverterValidated) score += 10;
    if (checklist.batteryValidated) score += 5;
    if (checklist.isolatorsInstalled) score += 3;
    if (checklist.labelsAffixed) score += 3;
    if (checklist.earthingCompleted) score += 4;

    // Testing (20 points)
    if (checklist.insulationTested) score += 7;
    if (checklist.earthContinuityTested) score += 7;
    if (checklist.voltageRiseCalculated) score += 6;

    // Documentation (20 points)
    if (checklist.sldCompleted) score += 5;
    if (checklist.complianceCertIssued) score += 5;
    if (checklist.customerHandoverComplete) score += 5;
    if (checklist.photosUploaded) score += 5;

    const isFullyCompliant = score === 100;

    await prisma.complianceChecklist.update({
      where: { jobId },
      data: {
        complianceScore: score,
        isFullyCompliant,
      },
    });
  } catch (error) {
    console.error('Failed to recalculate compliance score:', error);
  }
}
