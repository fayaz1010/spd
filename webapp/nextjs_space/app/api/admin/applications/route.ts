import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all applications
export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const { searchParams } = new URL(request.url);
    const vacancyId = searchParams.get('vacancyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (vacancyId && vacancyId !== 'all') {
      where.vacancyId = vacancyId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        vacancy: {
          select: {
            id: true,
            vacancyCode: true,
            customTitle: true,
            position: {
              select: {
                title: true,
                department: true,
              }
            }
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error: any) {
    console.error('Get applications error:', error);
    
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
