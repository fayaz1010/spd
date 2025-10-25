
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    requireAdmin(request);

    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subcontractor });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subcontractor' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    requireAdmin(request);

    const body = await request.json();
    const {
      companyName,
      contactName,
      email,
      phone,
      serviceSuburbs,
      dayRate,
      hourlyRate,
      costPerJob,
      isActive,
    } = body;

    // Check if subcontractor exists
    const existingSubcontractor = await prisma.subcontractor.findUnique({
      where: { id: params.id },
    });

    if (!existingSubcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    // If email is being changed, check if new email is already in use
    if (email && email !== existingSubcontractor.email) {
      const emailInUse = await prisma.subcontractor.findUnique({
        where: { email },
      });

      if (emailInUse) {
        return NextResponse.json(
          { error: 'Email is already in use by another subcontractor' },
          { status: 400 }
        );
      }
    }

    // Update subcontractor
    const subcontractor = await prisma.subcontractor.update({
      where: { id: params.id },
      data: {
        companyName: companyName || existingSubcontractor.companyName,
        contactName: contactName || existingSubcontractor.contactName,
        email: email || existingSubcontractor.email,
        phone: phone || existingSubcontractor.phone,
        serviceSuburbs:
          serviceSuburbs !== undefined
            ? serviceSuburbs
            : existingSubcontractor.serviceSuburbs,
        dayRate: dayRate !== undefined ? dayRate : existingSubcontractor.dayRate,
        hourlyRate:
          hourlyRate !== undefined ? hourlyRate : existingSubcontractor.hourlyRate,
        costPerJob:
          costPerJob !== undefined ? costPerJob : existingSubcontractor.costPerJob,
        isActive:
          isActive !== undefined ? isActive : existingSubcontractor.isActive,
      },
    });

    return NextResponse.json({ subcontractor });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to update subcontractor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    requireAdmin(request);

    // Check if subcontractor exists
    const subcontractor = await prisma.subcontractor.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!subcontractor) {
      return NextResponse.json(
        { error: 'Subcontractor not found' },
        { status: 404 }
      );
    }

    // Check if subcontractor has active jobs
    if (subcontractor._count.jobs > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subcontractor with ${subcontractor._count.jobs} active jobs. Please reassign or complete these jobs first.`,
        },
        { status: 400 }
      );
    }

    // Delete subcontractor
    await prisma.subcontractor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Subcontractor deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json(
      { error: 'Failed to delete subcontractor' },
      { status: 500 }
    );
  }
}
