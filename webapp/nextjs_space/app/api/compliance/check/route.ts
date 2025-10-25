/**
 * Compliance Check API
 * Checks job compliance and returns detailed report
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { checkJobCompliance } from '@/lib/compliance-checker';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // In production, fetch actual job data from database
    // For now, return mock data structure
    const jobData = {
      // Documents
      hasSLD: true,
      hasElectricalCertificate: true,
      hasComplianceStatement: true,
      hasTestResults: true,
      hasCustomerDeclaration: true,
      hasHandoverPack: false,

      // Validation
      panelCount: 16,
      panelsValidated: 16,
      hasInverterValidation: true,

      // Photos
      photoCount: 25,
      hasBeforePhotos: true,
      hasDuringPhotos: true,
      hasAfterPhotos: true,
      hasSerialPhotos: true,

      // Signatures
      hasCustomerSignature: true,
      hasInstallerSignature: true,

      // Network
      hasNetworkApproval: true,
      networkApprovalStatus: 'APPROVED',

      // System details
      systemSize: 6.6,
      state: 'WA',
    };

    const complianceReport = checkJobCompliance(jobData);

    return NextResponse.json({
      success: true,
      compliance: complianceReport,
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check compliance' },
      { status: 500 }
    );
  }
}
