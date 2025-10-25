import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/electricians
 * List all electricians with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // IN_HOUSE, SUBCONTRACTOR
    const status = searchParams.get('status'); // ACTIVE, INACTIVE, SUSPENDED
    
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    
    const electricians = await prisma.electrician.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      include: {
        assignedJobs: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
            scheduledDate: true,
          },
          take: 5,
          orderBy: { scheduledDate: 'desc' },
        },
      },
    });
    
    return NextResponse.json(electricians);
  } catch (error) {
    console.error('Error fetching electricians:', error);
    return NextResponse.json(
      { error: 'Failed to fetch electricians' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/electricians
 * Create a new electrician (STAFF, FREELANCE, or SUBCONTRACTOR)
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { electricianType, staffId, subcontractorId, ...electricianData } = data;
    
    // Validate required fields
    if (!electricianData.firstName || !electricianData.lastName || !electricianData.email || !electricianData.type) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, type' },
        { status: 400 }
      );
    }
    
    // Validate type-specific requirements
    if (electricianType === 'STAFF' && !staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required for STAFF type' },
        { status: 400 }
      );
    }
    
    if (electricianType === 'SUBCONTRACTOR' && !subcontractorId) {
      return NextResponse.json(
        { error: 'Subcontractor ID is required for SUBCONTRACTOR type' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    const existing = await prisma.electrician.findUnique({
      where: { email: electricianData.email },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Electrician with this email already exists' },
        { status: 409 }
      );
    }
    
    // STAFF: Check if staff member already has an electrician profile
    if (electricianType === 'STAFF') {
      const staff = await prisma.teamMember.findUnique({
        where: { id: staffId },
        include: { electrician: true },
      });
      
      if (!staff) {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        );
      }
      
      if (staff.electricianId) {
        return NextResponse.json(
          { error: 'This staff member is already linked to an electrician profile' },
          { status: 409 }
        );
      }
    }
    
    // SUBCONTRACTOR: Check if subcontractor already has an electrician profile
    if (electricianType === 'SUBCONTRACTOR') {
      const subcontractor = await prisma.subcontractor.findUnique({
        where: { id: subcontractorId },
        include: { electrician: true },
      });
      
      if (!subcontractor) {
        return NextResponse.json(
          { error: 'Subcontractor not found' },
          { status: 404 }
        );
      }
      
      if (subcontractor.electricianId) {
        return NextResponse.json(
          { error: 'This subcontractor is already linked to an electrician profile' },
          { status: 409 }
        );
      }
    }
    
    // Create electrician
    const electrician = await prisma.electrician.create({
      data: {
        ...electricianData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Link to staff member if STAFF type
    if (electricianType === 'STAFF' && staffId) {
      await prisma.teamMember.update({
        where: { id: staffId },
        data: { electricianId: electrician.id },
      });
    }
    
    // Link to subcontractor if SUBCONTRACTOR type
    if (electricianType === 'SUBCONTRACTOR' && subcontractorId) {
      await prisma.subcontractor.update({
        where: { id: subcontractorId },
        data: { electricianId: electrician.id },
      });
    }
    
    return NextResponse.json(electrician, { status: 201 });
  } catch (error) {
    console.error('Error creating electrician:', error);
    return NextResponse.json(
      { error: 'Failed to create electrician' },
      { status: 500 }
    );
  }
}
