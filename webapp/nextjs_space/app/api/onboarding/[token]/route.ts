import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch onboarding data by token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // In production, use a proper token system. For now, using applicationId as token
    const application = await prisma.application.findUnique({
      where: { id: params.token },
      include: {
        vacancy: {
          include: {
            position: true,
          }
        }
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Invalid onboarding link' },
        { status: 404 }
      );
    }

    // Check if application is in correct status
    if (application.status !== 'OFFER_ACCEPTED' && application.status !== 'ONBOARDING') {
      return NextResponse.json(
        { error: 'Onboarding not available for this application' },
        { status: 400 }
      );
    }

    const data = {
      applicationId: application.id,
      candidateName: `${application.firstName} ${application.lastName}`,
      position: application.vacancy.position.title,
      startDate: application.offerStartDate,
      alreadySubmitted: !!application.taxFileNumber, // Check if already submitted
      existingData: application.taxFileNumber ? {
        taxFileNumber: application.taxFileNumber,
        bankAccountName: application.bankAccountName,
        bankBSB: application.bankBSB,
        bankAccountNumber: application.bankAccountNumber,
        emergencyContactName: application.emergencyContactName,
        emergencyContactPhone: application.emergencyContactPhone,
        emergencyContactRelation: application.emergencyContactRelation,
        driverLicenseNumber: application.driverLicenseNumber,
        driverLicenseState: application.driverLicenseState,
        driverLicenseExpiry: application.driverLicenseExpiry,
        electricalLicenseNumber: application.electricalLicenseNumber,
        electricalLicenseState: application.electricalLicenseState,
        electricalLicenseExpiry: application.electricalLicenseExpiry,
        cecAccreditationNumber: application.cecAccreditationNumber,
        cecAccreditationType: application.cecAccreditationType,
        cecAccreditationExpiry: application.cecAccreditationExpiry,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Get onboarding data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
