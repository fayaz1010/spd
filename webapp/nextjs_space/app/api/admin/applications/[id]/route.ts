import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireRole, UserRole } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

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

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error('Get application error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update application
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const body = await request.json();

    const {
      status,
      rating,
      notes,
      interviewDate,
      interviewType,
      interviewers,
      interviewScore,
      interviewNotes,
      rejectionReason,
    } = body;

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        rating: rating ? parseInt(rating) : null,
        notes,
        interviewDate: interviewDate ? new Date(interviewDate) : null,
        interviewType,
        interviewers: interviewers || [],
        interviewScore: interviewScore ? parseInt(interviewScore) : null,
        interviewNotes,
        rejectionReason,
        reviewedBy: user.id,
        updatedAt: new Date(),
      },
      include: {
        vacancy: {
          include: {
            position: true,
          }
        }
      },
    });

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error('Update application error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireRole(request, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);

    await prisma.application.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete application error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
