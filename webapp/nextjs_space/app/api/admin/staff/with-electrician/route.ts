import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/staff/with-electrician
 * Fetch all active staff members with their linked electrician credentials
 * Used for team creation to select in-house electricians
 */
export async function GET(request: NextRequest) {
  try {
    const staff = await prisma.teamMember.findMany({
      where: {
        isActive: true,
        electricianId: {
          not: null, // Only staff members who are also electricians
        },
      },
      include: {
        electrician: {
          select: {
            id: true,
            type: true,
            status: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            mobile: true,
            electricalLicense: true,
            licenseNumber: true,
            licenseState: true,
            licenseExpiry: true,
            licenseVerified: true,
            cecNumber: true,
            cecAccreditationType: true,
            cecExpiry: true,
            cecVerified: true,
            digitalSignature: true,
            totalJobsCompleted: true,
            averageRating: true,
          },
        },
        Team: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
            department: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      staff,
      total: staff.length,
    });
  } catch (error: any) {
    console.error('Get staff with electrician error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
