import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/leads/[id]/property-details
 * Update property and technical details for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);

    const leadId = params.id;
    const body = await request.json();

    const {
      propertyOwnership,
      meterNumber,
      networkProvider,
      tariffType,
      postcode,
      mainSwitchRating,
      exportLimitRequested,
      switchboardLocation,
      meterLocation,
      storeyCount,
      existingSolar,
      existingSolarSize,
      dateOfBirth,
      driverLicenseNumber,
      driverLicenseState,
      vppSelection,
      installationZone
    } = body;

    // Update lead with property details
    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        propertyOwnership: propertyOwnership || null,
        meterNumber: meterNumber || null,
        networkProvider: networkProvider || null,
        tariffType: tariffType || null,
        postcode: postcode || null,
        mainSwitchRating: mainSwitchRating || null,
        exportLimitRequested: exportLimitRequested || null,
        switchboardLocation: switchboardLocation || null,
        meterLocation: meterLocation || null,
        storeyCount: storeyCount || 1,
        existingSolar: existingSolar || false,
        existingSolarSize: existingSolarSize || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        driverLicenseNumber: driverLicenseNumber || null,
        driverLicenseState: driverLicenseState || null,
        vppSelection: vppSelection || null,
        installationZone: installationZone || null,
        updatedAt: new Date()
      }
    });

    // Create activity log
    await prisma.leadActivity.create({
      data: {
        leadId,
        type: 'update',
        description: 'Property & technical details updated',
        createdBy: 'admin',
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      lead
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.error('Error updating property details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update property details',
        details: error.message
      },
      { status: 500 }
    );
  }
}
