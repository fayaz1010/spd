import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get single vacancy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: {
        position: true,
        applications: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            rating: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vacancy,
    });
  } catch (error: any) {
    console.error('Get vacancy error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update vacancy
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      openings,
      closingDate,
      startDate,
      customTitle,
      customDescription,
      customRequirements,
      requireCoverLetter,
      requireResume,
      screeningQuestions,
      status,
    } = body;

    // Check if vacancy exists
    const existing = await prisma.vacancy.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      );
    }

    // If publishing, set publishedAt
    const updateData: any = {
      openings,
      closingDate: closingDate ? new Date(closingDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      customTitle,
      customDescription,
      customRequirements,
      requireCoverLetter,
      requireResume,
      screeningQuestions,
      status,
      updatedAt: new Date(),
    };

    if (status === 'PUBLISHED' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const vacancy = await prisma.vacancy.update({
      where: { id: params.id },
      data: updateData,
      include: {
        position: true,
      },
    });

    return NextResponse.json({
      success: true,
      vacancy,
    });
  } catch (error: any) {
    console.error('Update vacancy error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vacancy
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    // Check if vacancy has applications
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found' },
        { status: 404 }
      );
    }

    if (vacancy._count.applications > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vacancy with applications. Please close it instead.' },
        { status: 400 }
      );
    }

    await prisma.vacancy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Vacancy deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete vacancy error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
