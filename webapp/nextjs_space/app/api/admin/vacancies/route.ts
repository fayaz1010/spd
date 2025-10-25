import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all vacancies
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const positionId = searchParams.get('positionId');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (positionId && positionId !== 'all') {
      where.positionId = positionId;
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
            _count: {
              select: { teamMembers: true }
            }
          },
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      vacancies,
    });
  } catch (error: any) {
    console.error('Get vacancies error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new vacancy
export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      positionId,
      openings,
      closingDate,
      startDate,
      customTitle,
      customDescription,
      customRequirements,
      requireCoverLetter,
      requireResume,
      screeningQuestions,
    } = body;

    // Generate vacancy code
    const count = await prisma.vacancy.count();
    const year = new Date().getFullYear();
    const vacancyCode = `VAC-${year}-${String(count + 1).padStart(3, '0')}`;

    const vacancy = await prisma.vacancy.create({
      data: {
        vacancyCode,
        positionId,
        openings: openings || 1,
        closingDate: closingDate ? new Date(closingDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        customTitle,
        customDescription,
        customRequirements,
        requireCoverLetter: requireCoverLetter || false,
        requireResume: requireResume !== false,
        screeningQuestions: screeningQuestions || [],
        status: 'DRAFT',
        createdBy: user.id,
      },
      include: {
        position: true,
      },
    });

    return NextResponse.json({
      success: true,
      vacancy,
    });
  } catch (error: any) {
    console.error('Create vacancy error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
