import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Get application with all details
    const application = await prisma.application.findUnique({
      where: { id: params.id },
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
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify application is ready for conversion
    if (application.status !== 'ONBOARDING') {
      return NextResponse.json(
        { error: 'Application must be in ONBOARDING status' },
        { status: 400 }
      );
    }

    // Check if required onboarding data is complete
    if (!application.taxFileNumber || !application.bankAccountNumber || !application.contractSignedDate) {
      return NextResponse.json(
        { error: 'Onboarding data incomplete. Please ensure all required information is collected.' },
        { status: 400 }
      );
    }

    // Check if already converted
    if (application.convertedToStaffId) {
      return NextResponse.json(
        { error: 'Application already converted to staff' },
        { status: 400 }
      );
    }

    // Create TeamMember record
    const teamMember = await prisma.teamMember.create({
      data: {
        id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${application.firstName} ${application.lastName}`,
        email: application.email,
        phone: application.phone,
        
        // Position assignment
        position: {
          connect: { id: application.vacancy.positionId }
        },
        role: application.vacancy.position.title,
        
        // Employment details
        employmentType: 'FULL_TIME',
        startDate: application.offerStartDate || new Date(),
        baseSalary: application.offerSalary || 0,
        
        // Driver License
        driverLicenseNumber: application.driverLicenseNumber,
        driverLicenseState: application.driverLicenseState,
        driverLicenseExpiry: application.driverLicenseExpiry,
        
        // Electrical License
        electricalLicenseNumber: application.electricalLicenseNumber,
        electricalLicenseState: application.electricalLicenseState,
        electricalLicenseExpiry: application.electricalLicenseExpiry,
        
        // CEC Accreditation
        cecAccreditationNumber: application.cecAccreditationNumber,
        cecAccreditationType: application.cecAccreditationType,
        cecAccreditationExpiry: application.cecAccreditationExpiry,
        
        // Banking
        bankAccountName: application.bankAccountName,
        bankBSB: application.bankBSB,
        bankAccountNumber: application.bankAccountNumber,
        
        // Emergency contact
        emergencyContact: application.emergencyContactName,
        emergencyPhone: application.emergencyContactPhone,
        emergencyContactRelation: application.emergencyContactRelation,
        
        // Status
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Update application with conversion details
    await prisma.application.update({
      where: { id: params.id },
      data: {
        convertedToStaffId: teamMember.id,
        convertedDate: new Date(),
        status: 'CONVERTED',
        updatedAt: new Date(),
      },
    });

    // TODO: Create user account for staff member
    // TODO: Send welcome email

    return NextResponse.json({
      success: true,
      staffId: teamMember.id,
      message: 'Successfully converted to staff member',
    });
  } catch (error: any) {
    console.error('Convert to staff error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to convert to staff', details: error.message },
      { status: 500 }
    );
  }
}
