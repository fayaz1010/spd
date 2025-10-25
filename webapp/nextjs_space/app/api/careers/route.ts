import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all published vacancies (PUBLIC - no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    const where: any = {
      status: 'PUBLISHED',
      OR: [
        { closingDate: null },
        { closingDate: { gte: new Date() } }
      ]
    };

    if (department && department !== 'all') {
      where.position = {
        department: department
      };
    }

    if (search) {
      where.OR = [
        { customTitle: { contains: search, mode: 'insensitive' } },
        { position: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const vacancies = await prisma.vacancy.findMany({
      where,
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
            salaryType: true,
            hourlyRateMin: true,
            hourlyRateMax: true,
            annualSalaryMin: true,
            annualSalaryMax: true,
            superannuationRate: true,
            employmentType: true,
            hoursPerWeek: true,
            workSchedule: true,
            workLocations: true,
            benefits: true,
            isPublic: true,
          },
        },
      },
      orderBy: [
        { publishedAt: 'desc' }
      ]
    });

    // Increment view count for each vacancy
    // Note: In production, you might want to do this more efficiently
    // or track unique views with cookies/IP

    return NextResponse.json({
      success: true,
      vacancies,
    });
  } catch (error: any) {
    console.error('Get public vacancies error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
