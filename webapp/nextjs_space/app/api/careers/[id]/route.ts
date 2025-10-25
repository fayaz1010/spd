import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get single vacancy detail (PUBLIC - no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancy = await prisma.vacancy.findUnique({
      where: { 
        id: params.id,
        status: 'PUBLISHED'
      },
      include: {
        position: {
          select: {
            id: true,
            positionCode: true,
            title: true,
            department: true,
            level: true,
            description: true,
            responsibilities: true,
            essentialRequirements: true,
            desirableRequirements: true,
            requiredLicenses: true,
            requiredCerts: true,
            salaryType: true,
            hourlyRateMin: true,
            hourlyRateMax: true,
            annualSalaryMin: true,
            annualSalaryMax: true,
            superannuationRate: true,
            overtimeAvailable: true,
            overtimeRate: true,
            bonusStructure: true,
            benefits: true,
            employmentType: true,
            hoursPerWeek: true,
            workSchedule: true,
            rdoAvailable: true,
            workLocations: true,
            travelRequired: true,
            travelDetails: true,
            physicalRequirements: true,
            isPublic: true,
          },
        },
      },
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found or not published' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.vacancy.update({
      where: { id: params.id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      vacancy,
    });
  } catch (error: any) {
    console.error('Get vacancy detail error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
