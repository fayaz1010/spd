import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/electricians/[id]
 * Get a single electrician by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const electrician = await prisma.electrician.findUnique({
      where: { id: params.id },
      include: {
        assignedJobs: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            scheduledDate: true,
            systemSize: true,
            panelCount: true,
          },
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });
    
    if (!electrician) {
      return NextResponse.json(
        { error: 'Electrician not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(electrician);
  } catch (error) {
    console.error('Error fetching electrician:', error);
    return NextResponse.json(
      { error: 'Failed to fetch electrician' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/electricians/[id]
 * Update an electrician
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Check if electrician exists
    const existing = await prisma.electrician.findUnique({
      where: { id: params.id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Electrician not found' },
        { status: 404 }
      );
    }
    
    // Update electrician
    const electrician = await prisma.electrician.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(electrician);
  } catch (error) {
    console.error('Error updating electrician:', error);
    return NextResponse.json(
      { error: 'Failed to update electrician' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/electricians/[id]
 * Delete an electrician (soft delete by setting status to INACTIVE)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if electrician exists
    const existing = await prisma.electrician.findUnique({
      where: { id: params.id },
      include: {
        assignedJobs: {
          where: {
            status: {
              in: ['PENDING_SCHEDULE', 'SCHEDULED', 'IN_PROGRESS'],
            },
          },
        },
      },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Electrician not found' },
        { status: 404 }
      );
    }
    
    // Check if electrician has active jobs
    if (existing.assignedJobs.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete electrician with active jobs. Please reassign jobs first.' },
        { status: 400 }
      );
    }
    
    // Soft delete by setting status to INACTIVE
    const electrician = await prisma.electrician.update({
      where: { id: params.id },
      data: {
        status: 'INACTIVE',
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(electrician);
  } catch (error) {
    console.error('Error deleting electrician:', error);
    return NextResponse.json(
      { error: 'Failed to delete electrician' },
      { status: 500 }
    );
  }
}
