import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const formData = await request.formData();

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: params.token },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Invalid onboarding link' },
        { status: 404 }
      );
    }

    // Extract form fields
    const data: any = {
      taxFileNumber: formData.get('taxFileNumber') as string,
      bankAccountName: formData.get('bankAccountName') as string,
      bankBSB: formData.get('bankBSB') as string,
      bankAccountNumber: formData.get('bankAccountNumber') as string,
      emergencyContactName: formData.get('emergencyContactName') as string,
      emergencyContactPhone: formData.get('emergencyContactPhone') as string,
      emergencyContactRelation: formData.get('emergencyContactRelation') as string,
      driverLicenseNumber: formData.get('driverLicenseNumber') as string,
      driverLicenseState: formData.get('driverLicenseState') as string,
      driverLicenseExpiry: formData.get('driverLicenseExpiry') 
        ? new Date(formData.get('driverLicenseExpiry') as string) 
        : null,
    };

    // Optional fields
    if (formData.get('electricalLicenseNumber')) {
      data.electricalLicenseNumber = formData.get('electricalLicenseNumber') as string;
      data.electricalLicenseState = formData.get('electricalLicenseState') as string;
      data.electricalLicenseExpiry = formData.get('electricalLicenseExpiry')
        ? new Date(formData.get('electricalLicenseExpiry') as string)
        : null;
    }

    if (formData.get('cecAccreditationNumber')) {
      data.cecAccreditationNumber = formData.get('cecAccreditationNumber') as string;
      data.cecAccreditationType = formData.get('cecAccreditationType') as string;
      data.cecAccreditationExpiry = formData.get('cecAccreditationExpiry')
        ? new Date(formData.get('cecAccreditationExpiry') as string)
        : null;
    }

    // Handle file uploads
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'applications', params.token, 'licenses');
    await mkdir(uploadsDir, { recursive: true });

    const fileFields = ['driverLicense', 'electricalLicense', 'cecAccreditation'];
    const uploadedFiles: Record<string, string> = {};

    for (const fieldName of fileFields) {
      const file = formData.get(fieldName) as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const ext = file.name.split('.').pop();
        const filename = `${fieldName}-${Date.now()}.${ext}`;
        const filepath = join(uploadsDir, filename);
        await writeFile(filepath, buffer);
        
        uploadedFiles[fieldName] = `/uploads/applications/${params.token}/licenses/${filename}`;
      }
    }

    // Initialize onboarding checklist
    const checklist = {
      taxFormComplete: !!data.taxFileNumber,
      bankDetailsProvided: !!data.bankAccountNumber,
      emergencyContactAdded: !!data.emergencyContactName,
      driverLicenseUploaded: !!uploadedFiles.driverLicense,
      electricalLicenseUploaded: !!uploadedFiles.electricalLicense || !data.electricalLicenseNumber,
      cecAccreditationUploaded: !!uploadedFiles.cecAccreditation || !data.cecAccreditationNumber,
      contractSigned: !!application.contractSignedDate,
      equipmentOrdered: false,
      systemAccessCreated: false,
      inductionScheduled: false,
    };

    // Update application
    await prisma.application.update({
      where: { id: params.token },
      data: {
        ...data,
        onboardingChecklist: checklist,
        status: 'ONBOARDING',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding information submitted successfully',
    });
  } catch (error: any) {
    console.error('Submit onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to submit onboarding information', details: error.message },
      { status: 500 }
    );
  }
}
