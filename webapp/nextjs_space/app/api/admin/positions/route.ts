import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all positions
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    
    if (department && department !== 'all') {
      where.department = department;
    }
    
    if (level && level !== 'all') {
      where.level = level;
    }
    
    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true';
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        _count: {
          select: { teamMembers: true }
        }
      },
      orderBy: [
        { department: 'asc' },
        { level: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      positions,
    });
  } catch (error: any) {
    console.error('Get positions error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new position
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      positionCode,
      title,
      department,
      level,
      description,
      responsibilities,
      essentialRequirements,
      desirableRequirements,
      requiredLicenses,
      requiredCerts,
      salaryType,
      hourlyRateMin,
      hourlyRateMax,
      annualSalaryMin,
      annualSalaryMax,
      superannuationRate,
      overtimeAvailable,
      overtimeRate,
      bonusStructure,
      benefits,
      employmentType,
      hoursPerWeek,
      workSchedule,
      rdoAvailable,
      workLocations,
      travelRequired,
      travelDetails,
      physicalRequirements,
      isActive,
      isPublic,
    } = body;

    // Check if position code already exists
    const existing = await prisma.position.findUnique({
      where: { positionCode }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Position code already exists' },
        { status: 400 }
      );
    }

    const position = await prisma.position.create({
      data: {
        positionCode,
        title,
        department,
        level,
        description,
        responsibilities: responsibilities || [],
        essentialRequirements: essentialRequirements || [],
        desirableRequirements: desirableRequirements || [],
        requiredLicenses: requiredLicenses || [],
        requiredCerts: requiredCerts || [],
        salaryType: salaryType || 'hourly',
        hourlyRateMin,
        hourlyRateMax,
        annualSalaryMin,
        annualSalaryMax,
        superannuationRate: superannuationRate || 11.5,
        overtimeAvailable: overtimeAvailable ?? true,
        overtimeRate: overtimeRate || 1.5,
        bonusStructure,
        benefits: benefits || [],
        employmentType: employmentType || 'FULL_TIME',
        hoursPerWeek: hoursPerWeek || 38,
        workSchedule,
        rdoAvailable: rdoAvailable ?? false,
        workLocations: workLocations || [],
        travelRequired: travelRequired ?? false,
        travelDetails,
        physicalRequirements: physicalRequirements || [],
        isActive: isActive ?? true,
        isPublic: isPublic ?? false,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      position,
    });
  } catch (error: any) {
    console.error('Create position error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
